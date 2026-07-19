import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { CreateInvestmentMovementDto } from './dto/create-investment-movement.dto';

function defaultDescription(type: string) {
  return (
    {
      CONTRIBUTION: 'Aporte',
      YIELD: 'Provento',
      ADJUSTMENT: 'Ajuste de saldo',
    }[type] ?? 'Movimento'
  );
}

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.investment.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        include: { movements: { orderBy: { date: 'desc' } } },
      }),
    );
  }

  async create(userId: string, data: CreateInvestmentDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const investment = await tx.investment.create({
        data: {
          name: data.name,
          type: data.type,
          ticker: data.ticker,
          cdiPercentage: data.cdiPercentage,
          institution: data.institution,
          currentBalance: data.currentBalance ?? 0,
          userId,
        },
      });

      // Saldo inicial declarado na criação vira um movimento CONTRIBUTION
      // "seed", pra manter o histórico consistente com currentBalance.
      if (data.currentBalance && data.currentBalance > 0) {
        await tx.investmentMovement.create({
          data: {
            investmentId: investment.id,
            type: 'CONTRIBUTION',
            amount: data.currentBalance,
            date: new Date(),
            description: 'Saldo inicial',
          },
        });
      }

      return tx.investment.findUniqueOrThrow({
        where: { id: investment.id },
        include: { movements: { orderBy: { date: 'desc' } } },
      });
    });
  }

  async update(userId: string, id: string, data: UpdateInvestmentDto) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);
      return tx.investment.update({
        where: { id, userId },
        data,
        include: { movements: { orderBy: { date: 'desc' } } },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const investment = await this.findOne(tx, userId, id);
      // onDelete: Cascade em InvestmentMovement.investmentId cuida do histórico.
      await tx.investment.delete({ where: { id, userId } });
      return investment;
    });
  }

  async addMovement(
    userId: string,
    id: string,
    data: CreateInvestmentMovementDto,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const investment = await this.findOne(tx, userId, id);

      if (
        data.type === 'CONTRIBUTION' &&
        data.amount < 0 &&
        Math.abs(data.amount) > investment.currentBalance
      ) {
        throw new BadRequestException(
          'O valor da retirada não pode ser maior que o saldo do investimento',
        );
      }

      await tx.investmentMovement.create({
        data: {
          investmentId: id,
          type: data.type,
          amount: data.amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description ?? defaultDescription(data.type),
          shareQuantity: data.shareQuantity ?? null,
          pricePerShare: data.pricePerShare ?? null,
        },
      });

      // YIELD (provento) não altera o saldo da posição — é rendimento
      // recebido, não parte do valor investido. Só CONTRIBUTION e ADJUSTMENT
      // alteram currentBalance.
      const balanceDelta = data.type === 'YIELD' ? 0 : data.amount;

      return tx.investment.update({
        where: { id, userId },
        data: { currentBalance: investment.currentBalance + balanceDelta },
        include: { movements: { orderBy: { date: 'desc' } } },
      });
    });
  }

  async listMovements(userId: string, id: string, page: number, limit: number) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      const [data, total] = await Promise.all([
        tx.investmentMovement.findMany({
          where: { investmentId: id },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        tx.investmentMovement.count({ where: { investmentId: id } }),
      ]);

      return { data, page, limit, total, hasMore: page * limit < total };
    });
  }

  async removeMovement(
    userId: string,
    investmentId: string,
    movementId: string,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const investment = await this.findOne(tx, userId, investmentId);

      const movement = await tx.investmentMovement.findFirst({
        where: { id: movementId, investmentId },
      });
      if (!movement) throw new NotFoundException('Movimento não encontrado');

      await tx.investmentMovement.delete({ where: { id: movementId } });

      const balanceDelta = movement.type === 'YIELD' ? 0 : movement.amount;

      return tx.investment.update({
        where: { id: investmentId, userId },
        data: {
          currentBalance: Math.max(0, investment.currentBalance - balanceDelta),
        },
        include: { movements: { orderBy: { date: 'desc' } } },
      });
    });
  }

  private async findOne(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const investment = await tx.investment.findFirst({ where: { id, userId } });
    if (!investment) throw new NotFoundException('Investment not found');
    return investment;
  }
}
