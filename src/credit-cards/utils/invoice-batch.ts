import { Prisma } from '@prisma/client';

export interface InstallmentPlanItem {
  number: number;
  totalCount: number;
  amount: number;
  referenceYear: number;
  referenceMonth: number;
  closingDate: Date;
  dueDate: Date;
  paymentDate: Date;
}

// Resolves (creating if needed) the CreditCardInvoice for each item's
// reference month, then bulk-creates the CreditCardInstallment rows.
// Uses batched queries (findMany/createMany) instead of one upsert+create
// per installment, since the latter can exceed Prisma's interactive
// transaction timeout for purchases with many installments.
export async function resolveInvoicesAndCreateInstallments(
  tx: Prisma.TransactionClient,
  params: {
    cardId: string;
    userId: string;
    purchaseId: string;
    plan: InstallmentPlanItem[];
  },
) {
  const { cardId, userId, purchaseId, plan } = params;

  const periods = plan.map((item) => ({
    referenceYear: item.referenceYear,
    referenceMonth: item.referenceMonth,
  }));

  const existingInvoices = await tx.creditCardInvoice.findMany({
    where: { cardId, OR: periods },
  });

  const invoiceIdByPeriod = new Map(
    existingInvoices.map((invoice) => [
      `${invoice.referenceYear}-${invoice.referenceMonth}`,
      invoice.id,
    ]),
  );

  const missing = plan.filter(
    (item) =>
      !invoiceIdByPeriod.has(`${item.referenceYear}-${item.referenceMonth}`),
  );

  if (missing.length > 0) {
    await tx.creditCardInvoice.createMany({
      data: missing.map((item) => ({
        referenceYear: item.referenceYear,
        referenceMonth: item.referenceMonth,
        closingDate: item.closingDate,
        dueDate: item.dueDate,
        paymentDate: item.paymentDate,
        cardId,
        userId,
      })),
      skipDuplicates: true,
    });

    const newInvoices = await tx.creditCardInvoice.findMany({
      where: {
        cardId,
        OR: missing.map((item) => ({
          referenceYear: item.referenceYear,
          referenceMonth: item.referenceMonth,
        })),
      },
    });
    for (const invoice of newInvoices) {
      invoiceIdByPeriod.set(
        `${invoice.referenceYear}-${invoice.referenceMonth}`,
        invoice.id,
      );
    }
  }

  await tx.creditCardInstallment.createMany({
    data: plan.map((item) => ({
      number: item.number,
      totalCount: item.totalCount,
      amount: item.amount,
      purchaseId,
      invoiceId: invoiceIdByPeriod.get(
        `${item.referenceYear}-${item.referenceMonth}`,
      )!,
    })),
  });
}
