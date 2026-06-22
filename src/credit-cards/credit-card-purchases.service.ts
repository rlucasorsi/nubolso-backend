import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { SimulatePurchaseDto } from './dto/simulate-purchase.dto';
import type { AdvanceInstallmentsDto } from './dto/advance-installments.dto';
import {
  computeInvoiceDates,
  distributeAmounts,
  getInstallmentInvoiceMonth,
} from './utils/date-helpers';
import {
  InstallmentPlanItem,
  resolveInvoicesAndCreateInstallments,
} from './utils/invoice-batch';
import { CreditCard } from '@prisma/client';

@Injectable()
export class CreditCardPurchasesService {
  constructor(private prisma: PrismaService) {}

  buildInstallmentPlan(
    card: CreditCard,
    dto: {
      totalAmount: number;
      installmentsCount: number;
      purchaseDate: string;
      strategy?: 'FIRST' | 'LAST';
    },
  ): InstallmentPlanItem[] {
    const purchaseDate = new Date(dto.purchaseDate);
    const amounts = distributeAmounts(dto.totalAmount, dto.installmentsCount, dto.strategy);

    return amounts.map((amount, idx) => {
      const number = idx + 1;
      const { year, month } = getInstallmentInvoiceMonth(
        purchaseDate,
        card.closingDay,
        number,
      );
      const dates = computeInvoiceDates(card, year, month);

      return {
        number,
        totalCount: dto.installmentsCount,
        amount,
        referenceYear: year,
        referenceMonth: month,
        ...dates,
      };
    });
  }

  async create(userId: string, dto: CreatePurchaseDto) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: dto.cardId, userId },
    });
    if (!card) throw new NotFoundException('Credit card not found');
    if (!card.isActive)
      throw new BadRequestException('Este cartão está inativo');

    const plan = this.buildInstallmentPlan(card, dto);

    return this.prisma.$transaction(
      async (tx) => {
        const purchase = await tx.creditCardPurchase.create({
          data: {
            description: dto.description ?? '',
            totalAmount: dto.totalAmount,
            installmentsCount: dto.installmentsCount,
            purchaseDate: new Date(dto.purchaseDate),
            cardId: card.id,
            userId,
          },
        });

        await resolveInvoicesAndCreateInstallments(tx, {
          cardId: card.id,
          userId,
          purchaseId: purchase.id,
          plan,
        });

        return tx.creditCardPurchase.findUnique({
          where: { id: purchase.id },
          include: { installments: { include: { invoice: true } } },
        });
      },
      { timeout: 15000 },
    );
  }

  async createCredit(userId: string, dto: CreatePurchaseDto) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: dto.cardId, userId },
    });
    if (!card) throw new NotFoundException('Credit card not found');
    if (!card.isActive)
      throw new BadRequestException('Este cartão está inativo');

    // Amounts are negated so installments reduce the invoice total
    const plan = this.buildInstallmentPlan(card, {
      ...dto,
      totalAmount: -dto.totalAmount,
    });

    return this.prisma.$transaction(
      async (tx) => {
        const purchase = await tx.creditCardPurchase.create({
          data: {
            description: dto.description ?? '',
            totalAmount: dto.totalAmount,
            installmentsCount: dto.installmentsCount,
            purchaseDate: new Date(dto.purchaseDate),
            isCredit: true,
            cardId: card.id,
            userId,
          },
        });

        await resolveInvoicesAndCreateInstallments(tx, {
          cardId: card.id,
          userId,
          purchaseId: purchase.id,
          plan,
        });

        return tx.creditCardPurchase.findUnique({
          where: { id: purchase.id },
          include: { installments: { include: { invoice: true } } },
        });
      },
      { timeout: 15000 },
    );
  }

  async advanceInstallments(
    userId: string,
    purchaseId: string,
    dto: AdvanceInstallmentsDto,
  ) {
    const purchase = await this.prisma.creditCardPurchase.findFirst({
      where: { id: purchaseId, userId },
      include: {
        card: true,
        installments: {
          include: { invoice: true },
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!purchase) throw new NotFoundException('Compra não encontrada');

    const pendingInstallments = purchase.installments.filter(
      (i) => !i.invoice.isPaid,
    );

    if (pendingInstallments.length === 0) {
      throw new BadRequestException('Não há parcelas pendentes para adiantar');
    }

    let targetYear: number;
    let targetMonth: number;

    if (dto.targetYear !== undefined && dto.targetMonth !== undefined) {
      targetYear = dto.targetYear;
      targetMonth = dto.targetMonth;

      const inPending = pendingInstallments.find(
        (i) =>
          i.invoice.referenceYear === targetYear &&
          i.invoice.referenceMonth === targetMonth,
      );

      if (!inPending) {
        const targetInv = await this.prisma.creditCardInvoice.findUnique({
          where: {
            cardId_referenceYear_referenceMonth: {
              cardId: purchase.cardId,
              referenceYear: targetYear,
              referenceMonth: targetMonth,
            },
          },
        });
        if (targetInv?.isPaid) {
          throw new BadRequestException('A fatura de destino já está paga');
        }
      }
    } else {
      const sorted = [...pendingInstallments].sort((a, b) => {
        const diff = a.invoice.referenceYear - b.invoice.referenceYear;
        return diff !== 0 ? diff : a.invoice.referenceMonth - b.invoice.referenceMonth;
      });
      targetYear = sorted[0].invoice.referenceYear;
      targetMonth = sorted[0].invoice.referenceMonth;
    }

    const toMove = pendingInstallments.filter(
      (i) =>
        !(
          i.invoice.referenceYear === targetYear &&
          i.invoice.referenceMonth === targetMonth
        ),
    );

    if (toMove.length === 0) {
      throw new BadRequestException(
        'Todas as parcelas pendentes já estão na fatura de destino',
      );
    }

    const toMoveIds = toMove.map((i) => i.id);
    const vacatedInvoiceIds = [...new Set(toMove.map((i) => i.invoiceId))];

    return this.prisma.$transaction(
      async (tx) => {
        let targetInvoice = await tx.creditCardInvoice.findUnique({
          where: {
            cardId_referenceYear_referenceMonth: {
              cardId: purchase.cardId,
              referenceYear: targetYear,
              referenceMonth: targetMonth,
            },
          },
        });

        if (!targetInvoice) {
          const dates = computeInvoiceDates(purchase.card, targetYear, targetMonth);
          targetInvoice = await tx.creditCardInvoice.create({
            data: {
              referenceYear: targetYear,
              referenceMonth: targetMonth,
              ...dates,
              cardId: purchase.cardId,
              userId,
            },
          });
        }

        await tx.creditCardInstallment.updateMany({
          where: { id: { in: toMoveIds } },
          data: { invoiceId: targetInvoice.id },
        });

        await tx.creditCardInvoice.deleteMany({
          where: {
            id: { in: vacatedInvoiceIds },
            installments: { none: {} },
            isPaid: false,
          },
        });

        return tx.creditCardPurchase.findUnique({
          where: { id: purchaseId },
          include: {
            installments: {
              include: { invoice: true },
              orderBy: { number: 'asc' },
            },
          },
        });
      },
      { timeout: 15000 },
    );
  }

  async remove(userId: string, id: string) {
    const purchase = await this.prisma.creditCardPurchase.findFirst({
      where: { id, userId },
      include: { installments: { include: { invoice: true } } },
    });

    if (!purchase) throw new NotFoundException('Compra não encontrada');

    const hasPaidInvoice = purchase.installments.some((i) => i.invoice.isPaid);
    if (hasPaidInvoice) {
      throw new BadRequestException(
        'Não é possível excluir uma compra com parcelas em faturas já pagas',
      );
    }

    const hasAnticipated = purchase.installments.some((i) => i.isAnticipated);
    if (hasAnticipated) {
      throw new BadRequestException(
        'Não é possível excluir uma compra com parcelas antecipadas',
      );
    }

    const invoiceIds = [...new Set(purchase.installments.map((i) => i.invoiceId))];

    await this.prisma.creditCardPurchase.delete({ where: { id, userId } });

    // Remove invoices que ficaram sem parcelas
    await this.prisma.creditCardInvoice.deleteMany({
      where: { id: { in: invoiceIds }, installments: { none: {} } },
    });
  }

  async simulate(userId: string, dto: SimulatePurchaseDto) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: dto.cardId, userId },
    });
    if (!card) throw new NotFoundException('Credit card not found');

    const plan = this.buildInstallmentPlan(card, dto);

    const installments = await Promise.all(
      plan.map(async (item) => {
        const existingInvoice = await this.prisma.creditCardInvoice.findUnique({
          where: {
            cardId_referenceYear_referenceMonth: {
              cardId: card.id,
              referenceYear: item.referenceYear,
              referenceMonth: item.referenceMonth,
            },
          },
          include: { installments: true },
        });

        const invoiceCurrentTotal = existingInvoice
          ? existingInvoice.installments.reduce((sum, i) => sum + i.amount, 0)
          : 0;

        return {
          number: item.number,
          totalCount: item.totalCount,
          amount: item.amount,
          referenceYear: item.referenceYear,
          referenceMonth: item.referenceMonth,
          paymentDate: item.paymentDate.toISOString().split('T')[0],
          invoiceExists: !!existingInvoice,
          invoiceCurrentTotal,
          invoiceProjectedTotal: invoiceCurrentTotal + item.amount,
        };
      }),
    );

    const impactedInvoices = installments.map((i) => ({
      referenceYear: i.referenceYear,
      referenceMonth: i.referenceMonth,
      paymentDate: i.paymentDate,
      currentTotal: i.invoiceCurrentTotal,
      projectedTotal: i.invoiceProjectedTotal,
      delta: i.amount,
    }));

    return { installments, impactedInvoices };
  }
}
