import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, CreditCard, RecurringTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';
import { RealizeBatchRecurringTemplateDto } from './schemas';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';
import {
  computeInvoiceDates,
  getBaseInvoiceMonth,
} from '../credit-cards/utils/date-helpers';
import {
  InstallmentPlanItem,
  resolveInvoicesAndCreateInstallments,
} from '../credit-cards/utils/invoice-batch';

const CREDIT_CARD_SELECT = {
  select: { id: true, name: true, isActive: true },
} as const;

@Injectable()
export class RecurringTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const templates = await tx.recurringTemplate.findMany({
        where: { userId },
        include: {
          category: true,
          creditCard: CREDIT_CARD_SELECT,
          _count: {
            select: {
              instances: { where: { isSkipped: false } },
              purchases: true,
            },
          },
        },
        orderBy: { dayOfMonth: 'asc' },
      });

      return templates.map(({ _count, ...t }) => ({
        ...t,
        occurrenceCount: _count.instances + _count.purchases,
      }));
    });
  }

  async create(userId: string, data: CreateRecurringTemplateDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (user?.plan === 'FREE') {
        const count = await tx.recurringTemplate.count({
          where: { userId, isActive: true },
        });
        if (count >= FREE_LIMITS.recurringTemplates) {
          throw new ForbiddenException(
            `Plano gratuito permite até ${FREE_LIMITS.recurringTemplates} recorrentes ativos. Faça upgrade para o PRO.`,
          );
        }
      }

      if (data.creditCardId) {
        await this.validateCreditCard(tx, userId, data.creditCardId);
      }

      return tx.recurringTemplate.create({
        data: { ...data, userId },
        include: { category: true, creditCard: CREDIT_CARD_SELECT },
      });
    });
  }

  async update(userId: string, id: string, data: UpdateRecurringTemplateDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const template = await this.findOne(tx, userId, id);

      if (data.creditCardId) {
        await this.validateCreditCard(tx, userId, data.creditCardId);
      }

      // O update pode não trazer type/creditCardId; a regra "receita não vincula
      // cartão" precisa valer para o estado resultante do merge.
      const effectiveType = data.type ?? template.type;
      const effectiveCreditCardId =
        data.creditCardId === undefined
          ? template.creditCardId
          : data.creditCardId;
      if (effectiveType === 'INCOME' && effectiveCreditCardId) {
        throw new BadRequestException(
          'Recorrentes de receita não podem ser vinculados a cartão',
        );
      }

      return tx.recurringTemplate.update({
        where: { id, userId },
        data,
        include: { category: true, creditCard: CREDIT_CARD_SELECT },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      return tx.recurringTemplate.delete({ where: { id, userId } });
    });
  }

  async realize(userId: string, id: string, data: RealizeRecurringTemplateDto) {
    return this.prisma.withUser(
      userId,
      async (tx) => {
        const template = await this.findOne(tx, userId, id);
        const date = new Date(data.date);

        if (template.creditCardId) {
          const result = await this.realizeAsCardPurchase(
            tx,
            userId,
            template,
            template.creditCard!,
            date,
            data.amount,
          );
          await this.deactivateIfCompleted(tx, userId, template);
          return result;
        }

        const transaction = await tx.transaction.upsert({
          where: { templateId_date: { templateId: id, date } },
          create: {
            description: template.description,
            amount: data.amount,
            type: template.type,
            date,
            isPaid: data.isPaid ?? false,
            templateId: id,
            categoryId: template.categoryId,
            userId,
          },
          update: {
            amount: data.amount,
            isPaid: data.isPaid ?? undefined,
          },
          include: { category: true },
        });

        await this.deactivateIfCompleted(tx, userId, template);

        return transaction;
      },
      // Timeout maior cobre o caminho de cartão (compra + parcelas + fatura)
      { timeout: 15000 },
    );
  }

  // "Realizar" um recorrente vinculado a cartão materializa a ocorrência como
  // uma compra de 1 parcela na fatura do ciclo correspondente, em vez de uma
  // Transaction avulsa (o fluxo de caixa passa a enxergá-la via fatura). Roda
  // dentro da transação RLS de `realize`, então reutiliza o `tx` recebido.
  private async realizeAsCardPurchase(
    tx: Prisma.TransactionClient,
    userId: string,
    template: RecurringTemplate,
    card: Pick<CreditCard, 'id' | 'name' | 'isActive'>,
    date: Date,
    amount: number,
  ) {
    if (!card.isActive) {
      throw new BadRequestException('Este cartão está inativo');
    }

    // Dedupe por (templateId, purchaseDate): se a ocorrência já foi materializada,
    // devolve a compra existente sem criar outra.
    const existing = await this.findCardOccurrence(tx, template.id, date);
    if (existing) return existing;

    const fullCard = await tx.creditCard.findUniqueOrThrow({
      where: { id: card.id },
    });
    const { year, month } = getBaseInvoiceMonth(date, fullCard.closingDay);
    const plan: InstallmentPlanItem[] = [
      {
        number: 1,
        totalCount: 1,
        amount,
        referenceYear: year,
        referenceMonth: month,
        ...computeInvoiceDates(fullCard, year, month),
      },
    ];

    const purchase = await tx.creditCardPurchase.create({
      data: {
        description: template.description,
        totalAmount: amount,
        installmentsCount: 1,
        purchaseDate: date,
        cardId: fullCard.id,
        userId,
        templateId: template.id,
      },
    });

    await resolveInvoicesAndCreateInstallments(tx, {
      cardId: fullCard.id,
      userId,
      purchaseId: purchase.id,
      plan,
    });

    // Realizar supersede um skip anterior da mesma ocorrência
    await tx.transaction.deleteMany({
      where: { templateId: template.id, date, isSkipped: true },
    });

    return tx.creditCardPurchase.findUnique({
      where: { id: purchase.id },
      include: { installments: { include: { invoice: true } } },
    });
  }

  private findCardOccurrence(
    tx: Prisma.TransactionClient,
    templateId: string,
    date: Date,
  ) {
    return tx.creditCardPurchase.findUnique({
      where: { templateId_purchaseDate: { templateId, purchaseDate: date } },
      include: { installments: { include: { invoice: true } } },
    });
  }

  // Conta ocorrências realizadas nos dois formatos (Transaction para templates
  // comuns, CreditCardPurchase para templates de cartão) — um template pode ter
  // histórico misto após vincular/desvincular o cartão.
  private async deactivateIfCompleted(
    tx: Prisma.TransactionClient,
    userId: string,
    template: RecurringTemplate,
  ) {
    if (!template.totalOccurrences) return;

    const [transactionCount, purchaseCount] = await Promise.all([
      tx.transaction.count({
        where: { templateId: template.id, isSkipped: false },
      }),
      tx.creditCardPurchase.count({ where: { templateId: template.id } }),
    ]);

    if (transactionCount + purchaseCount >= template.totalOccurrences) {
      await tx.recurringTemplate.update({
        where: { id: template.id, userId },
        data: { isActive: false },
      });
    }
  }

  private async validateCreditCard(
    tx: Prisma.TransactionClient,
    userId: string,
    creditCardId: string,
  ) {
    const card = await tx.creditCard.findFirst({
      where: { id: creditCardId, userId },
    });
    if (!card) throw new NotFoundException('Credit card not found');
    if (!card.isActive)
      throw new BadRequestException('Este cartão está inativo');
    return card;
  }

  // Marks (or creates) the instance for this templateId+date as "skipped":
  // it stops generating a virtual estimate AND is hidden from balance totals,
  // while remaining visible (as "Ignorado") so the user can reverse it later
  // by deleting it (which restores the regular estimate behavior).
  async skip(userId: string, id: string, data: SkipRecurringTemplateDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const template = await this.findOne(tx, userId, id);
      const date = new Date(data.date);

      return tx.transaction.upsert({
        where: { templateId_date: { templateId: id, date } },
        create: {
          description: template.description,
          amount: template.estimatedAmount,
          type: template.type,
          date,
          isPaid: false,
          isSkipped: true,
          templateId: id,
          categoryId: template.categoryId,
          userId,
        },
        update: { isSkipped: true, isPaid: false },
        include: { category: true },
      });
    });
  }

  async realizeBatch(userId: string, data: RealizeBatchRecurringTemplateDto) {
    const results = await Promise.allSettled(
      data.items.map((item) =>
        this.realize(userId, item.id, {
          amount: item.amount,
          date: item.date,
          isPaid: item.isPaid,
        }),
      ),
    );

    const fulfilled = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<unknown>).value);

    const failedCount = results.filter((r) => r.status === 'rejected').length;

    return { realized: fulfilled, failedCount };
  }

  private async findOne(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const template = await tx.recurringTemplate.findFirst({
      where: { id, userId },
      include: { creditCard: CREDIT_CARD_SELECT },
    });

    if (!template) {
      throw new NotFoundException('Recurring template not found');
    }

    return template;
  }
}
