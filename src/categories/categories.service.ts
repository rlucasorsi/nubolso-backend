import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, data: { name: string; color?: string; type: TransactionType }) {
    return this.prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.category.delete({
      where: { id, userId },
    });
  }
}
