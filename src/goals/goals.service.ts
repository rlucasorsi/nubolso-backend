import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { FREE_LIMITS } from '../billing/constants/plan-limits.constant';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { contributions: { orderBy: { date: 'desc' } } },
    });
  }

  async create(userId: string, data: CreateGoalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === 'FREE') {
      const count = await this.prisma.goal.count({ where: { userId } });
      if (count >= FREE_LIMITS.goals) {
        throw new ForbiddenException(
          `Plano gratuito permite até ${FREE_LIMITS.goals} metas. Faça upgrade para o PRO.`,
        );
      }
    }

    return this.prisma.goal.create({
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
  }

  async update(userId: string, id: string, data: UpdateGoalDto) {
    await this.findOne(userId, id);

    const {
      contributions,
      deadline,
      savedAmount: savedAmountInput,
      ...rest
    } = data;

    return this.prisma.$transaction(async (tx) => {
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
    await this.findOne(userId, id);

    return this.prisma.goal.delete({ where: { id, userId } });
  }

  async addContribution(
    userId: string,
    id: string,
    data: CreateContributionDto,
  ) {
    const goal = await this.findOne(userId, id);

    return this.prisma.$transaction(async (tx) => {
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
    await this.findOne(userId, id);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.goalContribution.findMany({
        where: { goalId: id },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.goalContribution.count({ where: { goalId: id } }),
    ]);

    return {
      data,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async removeContribution(
    userId: string,
    goalId: string,
    contributionId: string,
  ) {
    const goal = await this.findOne(userId, goalId);

    const contribution = await this.prisma.goalContribution.findFirst({
      where: { id: contributionId, goalId },
    });

    if (!contribution) {
      throw new NotFoundException('Contribution not found');
    }

    await this.prisma.goalContribution.delete({
      where: { id: contributionId },
    });

    return this.prisma.goal.update({
      where: { id: goalId, userId },
      data: {
        savedAmount: Math.max(0, goal.savedAmount - contribution.amount),
      },
      include: { contributions: { orderBy: { date: 'desc' } } },
    });
  }

  private async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }
}
