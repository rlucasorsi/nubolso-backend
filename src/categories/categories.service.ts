import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async create(
    userId: string,
    data: { name: string; color?: string; type: TransactionType },
  ) {
    return this.prisma.withUser(userId, (tx) =>
      tx.category.create({ data: { ...data, userId } }),
    );
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.category.delete({ where: { id, userId } }),
    );
  }
}
