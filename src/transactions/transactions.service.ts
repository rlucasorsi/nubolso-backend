import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: QueryTransactionDto) {
    const { startDate, endDate, type, categoryId, isPaid } = query;

    return this.prisma.transaction.findMany({
      where: {
        userId,
        type,
        categoryId,
        isPaid,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
      take: 2000,
    });
  }

  async create(userId: string, data: CreateTransactionDto) {
    await this.validateDate(userId, data.date);

    return this.prisma.transaction.create({
      data: {
        description: data.description ?? '',
        amount: data.amount,
        type: data.type,
        date: new Date(data.date),
        isPaid: data.isPaid ?? false,
        userId,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async update(userId: string, id: string, data: UpdateTransactionDto) {
    await this.findOne(userId, id);

    if (data.date) {
      await this.validateDate(userId, data.date);
    }

    return this.prisma.transaction.update({
      where: { id, userId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  private async validateDate(userId: string, date: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balanceStartDate: true },
    });

    if (user?.balanceStartDate && new Date(date) < user.balanceStartDate) {
      throw new BadRequestException(
        'A data do lançamento não pode ser anterior à data inicial do saldo',
      );
    }
  }

  async togglePaid(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);

    return this.prisma.transaction.update({
      where: { id, userId },
      data: { isPaid: !transaction.isPaid },
      include: {
        category: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.transaction.delete({
      where: { id, userId },
    });
  }

  private async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
