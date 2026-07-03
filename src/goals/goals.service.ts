import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { contributions: { orderBy: { date: 'desc' } } },
      }),
    );
  }

  async create(userId: string, data: CreateGoalDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (user?.plan === 'FREE') {
        const count = await tx.goal.count({ where: { userId } });
        if (count >= FREE_LIMITS.goals) {
          throw new ForbiddenException(
            `Plano gratuito permite até ${FREE_LIMITS.goals} metas. Faça upgrade para o PRO.`,
          );
        }
      }

      return tx.goal.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          targetAmount: data.targetAmount,
          savedAmount: data.savedAmount ?? 0,
          deadline: new Date(data.deadline),
          userId,
        },
        include: { contributions: true },
      });
    });
  }

  async update(userId: string, id: string, data: UpdateGoalDto) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      const {
        contributions,
        deadline,
        savedAmount: savedAmountInput,
        ...rest
      } = data;

      let savedAmount = savedAmountInput;

      if (contributions !== undefined) {
        await tx.goalContribution.deleteMany({ where: { goalId: id } });

        if (contributions.length > 0) {
          await tx.goalContribution.createMany({
            data: contributions.map((c) => ({
              amount: c.amount,
              description: c.description,
              date: new Date(c.date),
              goalId: id,
            })),
          });
        }

        savedAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
      }

      return tx.goal.update({
        where: { id, userId },
        data: {
          ...rest,
          savedAmount,
          deadline: deadline ? new Date(deadline) : undefined,
        },
        include: { contributions: { orderBy: { date: 'desc' } } },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);
      return tx.goal.delete({ where: { id, userId } });
    });
  }

  async addContribution(
    userId: string,
    id: string,
    data: CreateContributionDto,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const goal = await this.findOne(tx, userId, id);

      // Retirada (valor negativo) não pode ser maior que o saldo atual da meta.
      if (data.amount < 0 && Math.abs(data.amount) > goal.savedAmount) {
        throw new BadRequestException(
          'O valor da retirada não pode ser maior que o saldo da meta',
        );
      }

      await tx.goalContribution.create({
        data: {
          amount: data.amount,
          description: data.description ?? 'Aporte Manual',
          date: data.date ? new Date(data.date) : new Date(),
          goalId: id,
        },
      });

      return tx.goal.update({
        where: { id, userId },
        data: { savedAmount: goal.savedAmount + data.amount },
        include: { contributions: { orderBy: { date: 'desc' } } },
      });
    });
  }

  async listContributions(
    userId: string,
    id: string,
    page: number,
    limit: number,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      const [data, total] = await Promise.all([
        tx.goalContribution.findMany({
          where: { goalId: id },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        tx.goalContribution.count({ where: { goalId: id } }),
      ]);

      return { data, page, limit, total, hasMore: page * limit < total };
    });
  }

  async removeContribution(
    userId: string,
    goalId: string,
    contributionId: string,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const goal = await this.findOne(tx, userId, goalId);

      const contribution = await tx.goalContribution.findFirst({
        where: { id: contributionId, goalId },
      });

      if (!contribution) {
        throw new NotFoundException('Contribution not found');
      }

      await tx.goalContribution.delete({ where: { id: contributionId } });

      return tx.goal.update({
        where: { id: goalId, userId },
        data: {
          savedAmount: Math.max(0, goal.savedAmount - contribution.amount),
        },
        include: { contributions: { orderBy: { date: 'desc' } } },
      });
    });
  }

  private async findOne(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const goal = await tx.goal.findFirst({ where: { id, userId } });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }
}
