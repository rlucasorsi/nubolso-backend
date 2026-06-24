import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { computeInvoiceDates } from './utils/date-helpers';
import { CreditCard } from '@prisma/client';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';

@Injectable()
export class CreditCardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, userId },
    });

    if (!card) {
      throw new NotFoundException('Credit card not found');
    }

    return card;
  }

  async create(userId: string, data: CreateCreditCardDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === 'FREE') {
      const count = await this.prisma.creditCard.count({
        where: { userId, isActive: true },
      });
      if (count >= FREE_LIMITS.creditCards) {
        throw new ForbiddenException(
          `Plano gratuito permite até ${FREE_LIMITS.creditCards} cartão ativo. Faça upgrade para o PRO.`,
        );
      }
    }

    return this.prisma.creditCard.create({
      data: { ...data, userId },
    });
  }

  async update(userId: string, id: string, data: UpdateCreditCardDto) {
    const card = await this.findOne(userId, id);

    const updated = await this.prisma.creditCard.update({
      where: { id, userId },
      data,
    });

    // Changing the default payment day shifts paymentDate for non-overridden
    // future invoices only; per-invoice overrides and past/paid invoices stay put.
    if (data.paymentDay !== undefined && data.paymentDay !== card.paymentDay) {
      await this.propagatePaymentDayChange(updated);
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.creditCard.update({
      where: { id, userId },
      data: { isActive: false },
    });
  }

  private async propagatePaymentDayChange(card: CreditCard) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const invoices = await this.prisma.creditCardInvoice.findMany({
      where: {
        cardId: card.id,
        isPaid: false,
        paymentDateOverridden: false,
        paymentDate: { gte: today },
      },
    });

    await Promise.all(
      invoices.map((invoice) => {
        const { paymentDate } = computeInvoiceDates(
          card,
          invoice.referenceYear,
          invoice.referenceMonth,
        );
        return this.prisma.creditCardInvoice.update({
          where: { id: invoice.id },
          data: { paymentDate },
        });
      }),
    );
  }
}
