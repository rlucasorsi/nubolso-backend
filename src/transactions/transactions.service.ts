import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const {
      startDate,
      endDate,
      type,
      tipoDespesa,
      categoryId,
      isPaid,
      page,
      limit,
    } = query;

    const where: Prisma.TransactionWhereInput = {
      userId,
      type,
      categoryId,
      isPaid,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // O filtro por tipo de despesa só se aplica a despesas: 'none' = sem
    // classificação (nulo), fixa/variavel = igualdade.
    if (tipoDespesa) {
      where.type = 'EXPENSE';
      where.tipoDespesa = tipoDespesa === 'none' ? null : tipoDespesa;
    }

    const skip = (page - 1) * limit;

    return this.prisma.withUser(userId, async (tx) => {
      const [data, total] = await Promise.all([
        tx.transaction.findMany({
          where,
          include: { category: true },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
        }),
        tx.transaction.count({ where }),
      ]);

      return { data, total, page, limit, hasMore: skip + data.length < total };
    });
  }

  async create(userId: string, data: CreateTransactionDto) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.validateDate(tx, userId, data.date);

      return tx.transaction.create({
        data: {
          description: data.description ?? '',
          amount: data.amount,
          type: data.type,
          // Classificação só vale para despesas; demais tipos ficam null.
          tipoDespesa:
            data.type === 'EXPENSE' ? (data.tipoDespesa ?? null) : null,
          date: new Date(data.date),
          isPaid: data.isPaid ?? false,
          userId,
          categoryId: data.categoryId,
        },
        include: { category: true },
      });
    });
  }

  async update(userId: string, id: string, data: UpdateTransactionDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await this.findOne(tx, userId, id);

      if (data.date) {
        await this.validateDate(tx, userId, data.date);
      }

      // Resolve tipoDespesa contra o tipo efetivo pós-update: se não for despesa,
      // zera; se for, aplica o valor enviado (undefined = mantém o atual).
      const effectiveType = data.type ?? existing.type;
      const tipoDespesa = effectiveType === 'EXPENSE' ? data.tipoDespesa : null;

      return tx.transaction.update({
        where: { id, userId },
        data: {
          ...data,
          tipoDespesa,
          date: data.date ? new Date(data.date) : undefined,
        },
        include: { category: true },
      });
    });
  }

  async togglePaid(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const transaction = await this.findOne(tx, userId, id);

      return tx.transaction.update({
        where: { id, userId },
        data: { isPaid: !transaction.isPaid },
        include: { category: true },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      await this.findOne(tx, userId, id);

      return tx.transaction.delete({ where: { id, userId } });
    });
  }

  private async findOne(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const transaction = await tx.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  private async validateDate(
    tx: Prisma.TransactionClient,
    userId: string,
    date: string,
  ) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balanceStartDate: true },
    });

    if (user?.balanceStartDate && new Date(date) < user.balanceStartDate) {
      throw new BadRequestException(
        'A data do lançamento não pode ser anterior à data inicial do saldo',
      );
    }
  }
}
