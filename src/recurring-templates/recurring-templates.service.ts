import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';
import { RealizeBatchRecurringTemplateDto } from './schemas';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';

@Injectable()
export class RecurringTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const templates = await tx.recurringTemplate.findMany({
        where: { userId },
        include: {
          category: true,
          _count: { select: { instances: { where: { isSkipped: false } } } },
        },
        orderBy: { dayOfMonth: 'asc' },
      });

      return templates.map(({ _count, ...t }) => ({
        ...t,
        occurrenceCount: _count.instances,
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

      return tx.recurringTemplate.create({
        data: { ...data, userId },
        include: { category: true },
      });
    });
  }

  async update(userId: string, id: string, data: UpdateRecurringTemplateDto) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      return tx.recurringTemplate.update({
        where: { id, userId },
        data,
        include: { category: true },
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
    return this.prisma.withUser(userId, async (tx) => {
      const template = await this.findOne(tx, userId, id);
      const date = new Date(data.date);

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

      if (template.totalOccurrences) {
        const realizedCount = await tx.transaction.count({
          where: { templateId: id, isSkipped: false },
        });
        if (realizedCount >= template.totalOccurrences) {
          await tx.recurringTemplate.update({
            where: { id, userId },
            data: { isActive: false },
          });
        }
      }

      return transaction;
    });
  }

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
    });

    if (!template) {
      throw new NotFoundException('Recurring template not found');
    }

    return template;
  }
}
