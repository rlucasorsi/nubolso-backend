import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { SimulatePurchaseDto } from './dto/simulate-purchase.dto';
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
