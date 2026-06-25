import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import type { AnticipateInstallmentsDto } from './dto/anticipate-installments.dto';
import {
  addMonths,
  computeInvoiceDates,
  distributeAmounts,
  getRemainderBaseMonth,
} from './utils/date-helpers';
import {
  InstallmentPlanItem,
  resolveInvoicesAndCreateInstallments,
} from './utils/invoice-batch';

function computeTotal(
  installments: { amount: number; isAnticipated: boolean }[],
  advances: { paidAmount: number }[] = [],
) {
  const installmentTotal = installments
    .filter((i) => !i.isAnticipated)
    .reduce((sum, i) => sum + i.amount, 0);
  const advanceTotal = advances.reduce((sum, a) => sum + a.paidAmount, 0);
  return installmentTotal + advanceTotal;
}

// Price (French amortization) installment value
function computePriceInstallment(
  principal: number,
  monthlyRatePct: number,
  n: number,
): number {
  if (monthlyRatePct === 0 || n === 0) return principal / n;
  const r = monthlyRatePct / 100;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

@Injectable()
export class CreditCardInvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAllForCard(userId: string, cardId: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: cardId, userId },
    });
    if (!card) throw new NotFoundException('Credit card not found');

    const invoices = await this.prisma.creditCardInvoice.findMany({
      where: { cardId, userId },
      include: {
        installments: { include: { purchase: true } },
        advances: true,
        transaction: true,
      },
      orderBy: [{ referenceYear: 'asc' }, { referenceMonth: 'asc' }],
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: computeTotal(invoice.installments, invoice.advances),
    }));
  }

  async findAllForUser(userId: string, from?: string, to?: string) {
    const invoices = await this.prisma.creditCardInvoice.findMany({
      where: {
        userId,
        paymentDate: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        installments: true,
        advances: true,
        transaction: true,
        card: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: computeTotal(invoice.installments, invoice.advances),
    }));
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.prisma.creditCardInvoice.findFirst({
      where: { id, userId },
      include: {
        installments: { include: { purchase: true } },
        advances: true,
        transaction: true,
        card: true,
        remainderPurchases: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    return {
      ...invoice,
      totalAmount: computeTotal(invoice.installments, invoice.advances),
    };
  }

  async updatePaymentDate(userId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(userId, id);
    if (invoice.isPaid) {
      throw new BadRequestException(
        'Não é possível alterar a data de pagamento de uma fatura já paga',
      );
    }

    return this.prisma.creditCardInvoice.update({
      where: { id, userId },
      data: {
        paymentDate: new Date(dto.paymentDate),
        paymentDateOverridden: true,
      },
    });
  }

  async pay(userId: string, id: string, dto: PayInvoiceDto) {
    const invoice = await this.findOne(userId, id);
    if (invoice.isPaid) throw new BadRequestException('Fatura já paga');

    const card = invoice.card;
    const paymentDate = dto.paymentDate
      ? new Date(dto.paymentDate)
      : invoice.paymentDate;
    const isFullPayment = dto.amount >= invoice.totalAmount - 0.005;

    return this.prisma.$transaction(
      async (tx) => {
        const transaction = invoice.transactionId
          ? await tx.transaction.update({
              where: { id: invoice.transactionId, userId },
              data: { amount: dto.amount, date: paymentDate, isPaid: true },
            })
          : await tx.transaction.create({
              data: {
                description: `Fatura ${card.name} ${String(invoice.referenceMonth).padStart(2, '0')}/${invoice.referenceYear}`,
                amount: dto.amount,
                type: 'EXPENSE',
                date: paymentDate,
                isPaid: true,
                userId,
              },
            });

        const updated = await tx.creditCardInvoice.update({
          where: { id, userId },
          data: {
            isPaid: true,
            paidAmount: dto.amount,
            paymentDate,
            paymentDateOverridden: true,
            transactionId: transaction.id,
          },
          include: {
            installments: true,
            advances: true,
            transaction: true,
            card: true,
          },
        });

        // Partial payment: roll the remainder into a new purchase, re-parceled
        // starting the month after this invoice's reference month.
        if (!isFullPayment) {
          const remainderAmount = invoice.totalAmount - dto.amount;
          const installmentsCount = dto.remainderInstallments ?? 1;

          // Resolve total with interest
          let totalRemainder: number;
          if (dto.installmentAmount) {
            totalRemainder = dto.installmentAmount * installmentsCount;
          } else if (dto.interestRate != null && dto.interestRate > 0) {
            const pmt = computePriceInstallment(
              remainderAmount,
              dto.interestRate,
              installmentsCount,
            );
            totalRemainder = pmt * installmentsCount;
          } else {
            totalRemainder = remainderAmount;
          }

          const remainderPurchase = await tx.creditCardPurchase.create({
            data: {
              description: `Saldo remanescente - Fatura ${String(invoice.referenceMonth).padStart(2, '0')}/${invoice.referenceYear}`,
              totalAmount: totalRemainder,
              installmentsCount,
              purchaseDate: new Date(),
              cardId: invoice.cardId,
              userId,
              originInvoiceId: invoice.id,
            },
          });

          const baseMonth = getRemainderBaseMonth(invoice);
          const amounts = distributeAmounts(totalRemainder, installmentsCount);

          const plan: InstallmentPlanItem[] = [];
          for (let i = 1; i <= installmentsCount; i++) {
            const { year, month } = addMonths(
              baseMonth.year,
              baseMonth.month,
              i - 1,
            );
            plan.push({
              number: i,
              totalCount: installmentsCount,
              amount: amounts[i - 1],
              referenceYear: year,
              referenceMonth: month,
              ...computeInvoiceDates(card, year, month),
            });
          }

          await resolveInvoicesAndCreateInstallments(tx, {
            cardId: card.id,
            userId,
            purchaseId: remainderPurchase.id,
            plan,
          });
        }

        return {
          ...updated,
          totalAmount: computeTotal(updated.installments, updated.advances),
        };
      },
      { timeout: 15000 },
    );
  }

  async anticipate(
    userId: string,
    cardId: string,
    dto: AnticipateInstallmentsDto,
  ) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: cardId, userId },
    });
    if (!card) throw new NotFoundException('Cartão não encontrado');

    // "Fatura atual" = a fatura não paga com o menor paymentDate
    const currentInvoice = await this.prisma.creditCardInvoice.findFirst({
      where: { cardId, userId, isPaid: false },
      orderBy: { paymentDate: 'asc' },
    });
    if (!currentInvoice) {
      throw new UnprocessableEntityException(
        'Nenhuma fatura aberta encontrada para este cartão',
      );
    }

    const purchase = await this.prisma.creditCardPurchase.findFirst({
      where: { id: dto.purchaseId, userId, cardId },
      include: {
        installments: {
          include: { invoice: true },
          orderBy: { number: 'asc' },
        },
      },
    });
    if (!purchase)
      throw new NotFoundException('Compra não encontrada neste cartão');

    // Parcelas elegíveis: não antecipadas, em fatura não paga, DEPOIS da fatura atual
    const eligible = purchase.installments.filter(
      (i) =>
        !i.isAnticipated &&
        !i.invoice.isPaid &&
        i.invoice.paymentDate > currentInvoice.paymentDate,
    );

    if (eligible.length === 0) {
      throw new UnprocessableEntityException(
        'Nenhuma parcela futura elegível para antecipação',
      );
    }
    if (dto.installmentsCount > eligible.length) {
      throw new BadRequestException(
        `Quantidade solicitada (${dto.installmentsCount}) excede as parcelas disponíveis (${eligible.length})`,
      );
    }

    // "Últimas N" = as mais distantes no tempo (maior paymentDate / maior number)
    const sorted = [...eligible].sort((a, b) => {
      const diff =
        b.invoice.paymentDate.getTime() - a.invoice.paymentDate.getTime();
      return diff !== 0 ? diff : b.number - a.number;
    });
    const toAnticipate = sorted.slice(0, dto.installmentsCount);

    const originalAmount =
      Math.round(toAnticipate.reduce((sum, i) => sum + i.amount, 0) * 100) /
      100;

    if (dto.paidAmount > originalAmount + 0.005) {
      throw new BadRequestException(
        'O valor a pagar não pode ser maior que o valor original das parcelas',
      );
    }
    const discount = Math.round((originalAmount - dto.paidAmount) * 100) / 100;

    const toAnticipateIds = toAnticipate.map((i) => i.id);
    const affectedInvoiceIds = [
      ...new Set(toAnticipate.map((i) => i.invoiceId)),
    ];

    return this.prisma.$transaction(
      async (tx) => {
        const advance = await tx.installmentAdvance.create({
          data: {
            purchaseId: dto.purchaseId,
            invoiceId: currentInvoice.id,
            userId,
            installmentsCount: dto.installmentsCount,
            originalAmount,
            paidAmount: dto.paidAmount,
            discount,
          },
        });

        await tx.creditCardInstallment.updateMany({
          where: { id: { in: toAnticipateIds } },
          data: { isAnticipated: true, advanceId: advance.id },
        });

        const updatedInvoice = await tx.creditCardInvoice.findUniqueOrThrow({
          where: { id: currentInvoice.id },
          include: {
            installments: { include: { purchase: true } },
            advances: { include: { purchase: true } },
            transaction: true,
          },
        });

        const affectedInvoices = await tx.creditCardInvoice.findMany({
          where: { id: { in: affectedInvoiceIds } },
          include: {
            installments: { include: { purchase: true } },
            advances: true,
          },
        });

        return {
          advance,
          updatedInvoice: {
            ...updatedInvoice,
            totalAmount: computeTotal(
              updatedInvoice.installments,
              updatedInvoice.advances,
            ),
          },
          affectedInvoices: affectedInvoices.map((inv) => ({
            ...inv,
            totalAmount: computeTotal(inv.installments, inv.advances),
          })),
        };
      },
      { timeout: 15000 },
    );
  }

  async revertAdvance(userId: string, advanceId: string) {
    const advance = await this.prisma.installmentAdvance.findFirst({
      where: { id: advanceId, userId },
    });
    if (!advance) throw new NotFoundException('Antecipação não encontrada');

    return this.prisma.$transaction(async (tx) => {
      await tx.creditCardInstallment.updateMany({
        where: { advanceId },
        data: { isAnticipated: false, advanceId: null },
      });

      await tx.installmentAdvance.delete({ where: { id: advanceId } });

      const invoice = await tx.creditCardInvoice.findUniqueOrThrow({
        where: { id: advance.invoiceId },
        include: {
          installments: { include: { purchase: true } },
          advances: { include: { purchase: true } },
          transaction: true,
          card: true,
        },
      });

      return {
        ...invoice,
        totalAmount: computeTotal(invoice.installments, invoice.advances),
      };
    });
  }

  async reopen(userId: string, id: string) {
    const invoice = await this.findOne(userId, id);
    if (!invoice.isPaid) {
      throw new BadRequestException('Esta fatura ainda não foi paga');
    }

    // Intelligent rollback: a partial payment rolled the remainder into a new
    // purchase, re-parceled into future invoices. If any of those future
    // invoices have already been paid, their paid amount was based on a total
    // that included those installments — reopening would leave them
    // inconsistent, so block it until that invoice is reopened first.
    if (invoice.remainderPurchases.length > 0) {
      const allInstallments = await this.prisma.creditCardInstallment.findMany({
        where: {
          purchaseId: { in: invoice.remainderPurchases.map((p) => p.id) },
        },
        include: { invoice: true },
      });
      if (allInstallments.some((i) => i.invoice.isPaid)) {
        throw new BadRequestException(
          'Não é possível reabrir esta fatura: o saldo remanescente já foi processado em uma fatura que já está paga. Reabra primeiro essa fatura.',
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        await tx.creditCardInvoice.update({
          where: { id, userId },
          data: { isPaid: false, paidAmount: null, transactionId: null },
        });

        if (invoice.transactionId) {
          await tx.transaction.delete({
            where: { id: invoice.transactionId, userId },
          });
        }

        for (const purchase of invoice.remainderPurchases) {
          await tx.creditCardInstallment.deleteMany({
            where: { purchaseId: purchase.id },
          });
          await tx.creditCardPurchase.delete({
            where: { id: purchase.id, userId },
          });
        }

        const updated = await tx.creditCardInvoice.findUniqueOrThrow({
          where: { id, userId },
          include: {
            installments: true,
            advances: true,
            transaction: true,
            card: true,
          },
        });

        return {
          ...updated,
          totalAmount: computeTotal(updated.installments, updated.advances),
        };
      },
      { timeout: 15000 },
    );
  }
}
