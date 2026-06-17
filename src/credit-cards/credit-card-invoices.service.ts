import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
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

function computeTotal(installments: { amount: number }[]) {
  return installments.reduce((sum, i) => sum + i.amount, 0);
}

// Price (French amortization) installment value
function computePriceInstallment(principal: number, monthlyRatePct: number, n: number): number {
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
      where: { cardId },
      include: {
        installments: { include: { purchase: true } },
        transaction: true,
      },
      orderBy: [{ referenceYear: 'asc' }, { referenceMonth: 'asc' }],
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: computeTotal(invoice.installments),
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
        transaction: true,
        card: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    return invoices.map((invoice) => ({
      ...invoice,
      totalAmount: computeTotal(invoice.installments),
    }));
  }

  async findOne(userId: string, id: string) {
    const invoice = await this.prisma.creditCardInvoice.findFirst({
      where: { id, userId },
      include: {
        installments: { include: { purchase: true } },
        transaction: true,
        card: true,
        remainderPurchases: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    return { ...invoice, totalAmount: computeTotal(invoice.installments) };
  }

  async updatePaymentDate(userId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(userId, id);
    if (invoice.isPaid) {
      throw new BadRequestException(
        'Não é possível alterar a data de pagamento de uma fatura já paga',
      );
    }

    return this.prisma.creditCardInvoice.update({
      where: { id },
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

    return this.prisma.$transaction(async (tx) => {
      const transaction = invoice.transactionId
        ? await tx.transaction.update({
            where: { id: invoice.transactionId },
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
        where: { id },
        data: {
          isPaid: true,
          paidAmount: dto.amount,
          paymentDate,
          paymentDateOverridden: true,
          transactionId: transaction.id,
        },
        include: { installments: true, transaction: true, card: true },
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
          const pmt = computePriceInstallment(remainderAmount, dto.interestRate, installmentsCount);
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

      return { ...updated, totalAmount: computeTotal(updated.installments) };
    }, { timeout: 15000 });
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
        where: { purchaseId: { in: invoice.remainderPurchases.map((p) => p.id) } },
        include: { invoice: true },
      });
      if (allInstallments.some((i) => i.invoice.isPaid)) {
        throw new BadRequestException(
          'Não é possível reabrir esta fatura: o saldo remanescente já foi processado em uma fatura que já está paga. Reabra primeiro essa fatura.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.creditCardInvoice.update({
        where: { id },
        data: { isPaid: false, paidAmount: null, transactionId: null },
      });

      if (invoice.transactionId) {
        await tx.transaction.delete({ where: { id: invoice.transactionId } });
      }

      for (const purchase of invoice.remainderPurchases) {
        await tx.creditCardInstallment.deleteMany({ where: { purchaseId: purchase.id } });
        await tx.creditCardPurchase.delete({ where: { id: purchase.id } });
      }

      const updated = await tx.creditCardInvoice.findUniqueOrThrow({
        where: { id },
        include: { installments: true, transaction: true, card: true },
      });

      return { ...updated, totalAmount: computeTotal(updated.installments) };
    }, { timeout: 15000 });
  }
}
