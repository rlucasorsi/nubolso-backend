import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertCategoryBudgetDto } from './schemas';

@Injectable()
export class CategoryBudgetsService {
  constructor(private prisma: PrismaService) {}

  async findByPeriod(userId: string, periodStart: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.categoryBudget.findMany({
        where: { userId, periodStart: new Date(periodStart) },
      }),
    );
  }

  async upsert(userId: string, data: UpsertCategoryBudgetDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const category = await tx.category.findFirst({
        where: { id: data.categoryId, userId },
      });
      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }

      const periodStart = new Date(data.periodStart);
      return tx.categoryBudget.upsert({
        where: {
          categoryId_periodStart: { categoryId: data.categoryId, periodStart },
        },
        create: {
          userId,
          categoryId: data.categoryId,
          periodStart,
          amount: data.amount,
        },
        update: { amount: data.amount },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.categoryBudget.findFirst({
        where: { id, userId },
      });
      if (!existing) {
        throw new NotFoundException('Orçamento não encontrado');
      }
      return tx.categoryBudget.delete({ where: { id } });
    });
  }
}
