import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { getPeriodForDate } from '../common/period.util';

const APPROACHING_THRESHOLD = 0.8;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

@Injectable()
export class NotificationsBudgetCronService {
  private readonly logger = new Logger(NotificationsBudgetCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  /** Runs every day at 08:15 UTC, shortly after the main notifications job. */
  @Cron('15 8 * * *')
  async runDailyBudgetCheck() {
    this.logger.log('Running daily budget check job');

    const users = await this.prisma.user.findMany({
      select: { id: true, cashflowStartDay: true },
    });

    await Promise.allSettled(
      users.map((user) =>
        this.processUserBudgets(user.id, user.cashflowStartDay),
      ),
    );

    this.logger.log('Daily budget check job completed');
  }

  private async processUserBudgets(userId: string, cashflowStartDay: number) {
    const period = getPeriodForDate(todayStr(), cashflowStartDay);
    const periodStartDate = new Date(period.startDate);

    // Orçamento é escopado ao ciclo (periodStart) — só considera o que foi
    // definido explicitamente para o período atual, sem herdar de ciclos passados.
    const budgets = await this.prisma.categoryBudget.findMany({
      where: { userId, periodStart: periodStartDate },
      include: { category: true },
    });
    if (budgets.length === 0) return;

    const endExclusive = new Date(period.endDate);
    endExclusive.setDate(endExclusive.getDate() + 1);

    const sums = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        isSkipped: false,
        categoryId: { in: budgets.map((b) => b.categoryId) },
        type: { in: ['EXPENSE', 'INVESTMENT'] },
        date: { gte: periodStartDate, lt: endExclusive },
      },
      _sum: { amount: true },
    });
    const spentByCategory = new Map(
      sums.map((s) => [s.categoryId, s._sum.amount ?? 0]),
    );

    for (const budget of budgets) {
      const spent = spentByCategory.get(budget.categoryId) ?? 0;
      const categoryName = budget.category.name;
      const reached = spent >= budget.amount;

      // GOAL (ex.: Investimento): atingir a meta é bom — avisa uma vez, sem
      // alerta de "quase lá" (não há motivo pra preocupação nesse caso).
      if (budget.category.budgetDirection === 'GOAL') {
        if (reached) {
          await this.notify(
            userId,
            budget.categoryId,
            'goal-reached',
            period.startDate,
            {
              title: `Meta de ${categoryName} atingida!`,
              body: `Você já alcançou R$ ${spent.toFixed(2)} de uma meta de R$ ${budget.amount.toFixed(2)} neste ciclo.`,
            },
          );
        }
        continue;
      }

      // LIMIT (ex.: Gasolina): estourar é ruim.
      if (reached) {
        await this.notify(userId, budget.categoryId, 'over', period.startDate, {
          title: `Orçamento de ${categoryName} estourado`,
          body: `Você já gastou R$ ${spent.toFixed(2)} de um orçamento de R$ ${budget.amount.toFixed(2)} neste ciclo.`,
        });
      } else if (spent >= budget.amount * APPROACHING_THRESHOLD) {
        await this.notify(
          userId,
          budget.categoryId,
          'approaching',
          period.startDate,
          {
            title: `Orçamento de ${categoryName} quase no limite`,
            body: `Você já usou ${Math.round((spent / budget.amount) * 100)}% do orçamento de R$ ${budget.amount.toFixed(2)} neste ciclo.`,
          },
        );
      }
    }
  }

  private async notify(
    userId: string,
    categoryId: string,
    status: 'over' | 'approaching' | 'goal-reached',
    periodStartDate: string,
    { title, body }: { title: string; body: string },
  ) {
    const dedupeKey = `BUDGET_WARNING:${categoryId}:${status}:${periodStartDate}`;

    const { isNew } = await this.notificationsService.createIfNew({
      userId,
      type: 'BUDGET_WARNING',
      title,
      body,
      data: { url: '/orcamento', categoryId },
      dedupeKey,
    });

    if (isNew) {
      await this.pushService.sendToUser(userId, {
        title,
        body,
        data: { url: '/orcamento' },
        tag: dedupeKey,
      });
    }
  }
}
