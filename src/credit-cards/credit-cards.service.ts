import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreditCard, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { computeInvoiceDates } from './utils/date-helpers';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';

@Injectable()
export class CreditCardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.creditCard.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    );
  }

  async findOne(userId: string, id: string) {
    return this.prisma.withUser(userId, (tx) =>
      this.findOneInTx(tx, userId, id),
    );
  }

  async create(userId: string, data: CreateCreditCardDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (user?.plan === 'FREE') {
        const count = await tx.creditCard.count({
          where: { userId, isActive: true },
        });
        if (count >= FREE_LIMITS.creditCards) {
          throw new ForbiddenException(
            `Plano gratuito permite até ${FREE_LIMITS.creditCards} cartão ativo. Faça upgrade para o PRO.`,
          );
        }
      }

      return tx.creditCard.create({ data: { ...data, userId } });
    });
  }

  async update(userId: string, id: string, data: UpdateCreditCardDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const card = await this.findOneInTx(tx, userId, id);

      const updated = await tx.creditCard.update({
        where: { id, userId },
        data,
      });

      // Changing the default payment day shifts paymentDate for non-overridden
      // future invoices only; per-invoice overrides and past/paid invoices stay put.
      if (
        data.paymentDay !== undefined &&
        data.paymentDay !== card.paymentDay
      ) {
        await this.propagatePaymentDayChange(tx, updated);
      }

      return updated;
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOneInTx(tx, userId, id);

      return tx.creditCard.update({
        where: { id, userId },
        data: { isActive: false },
      });
    });
  }

  private async findOneInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const card = await tx.creditCard.findFirst({ where: { id, userId } });

    if (!card) {
      throw new NotFoundException('Credit card not found');
    }

    return card;
  }

  private async propagatePaymentDayChange(
    tx: Prisma.TransactionClient,
    card: CreditCard,
  ) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const invoices = await tx.creditCardInvoice.findMany({
      where: {
        cardId: card.id,
        isPaid: false,
        paymentDateOverridden: false,
        paymentDate: { gte: today },
      },
    });

    for (const invoice of invoices) {
      const { paymentDate } = computeInvoiceDates(
        card,
        invoice.referenceYear,
        invoice.referenceMonth,
      );
      await tx.creditCardInvoice.update({
        where: { id: invoice.id },
        data: { paymentDate },
      });
    }
  }
}
