import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PROTECTED_CATEGORY_NAME } from './default-categories';
import { CreateCategoryDto, UpdateCategoryDto } from './schemas';

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

  async create(userId: string, data: CreateCategoryDto) {
    return this.prisma.withUser(userId, (tx) =>
      tx.category.create({ data: { ...data, userId } }),
    );
  }

  async update(userId: string, id: string, data: UpdateCategoryDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await this.findOne(tx, userId, id);
      this.assertNotProtected(existing, 'editada');
      return tx.category.update({ where: { id, userId }, data });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await this.findOne(tx, userId, id);
      this.assertNotProtected(existing, 'excluída');
      return tx.category.delete({ where: { id, userId } });
    });
  }

  private async findOne(
    tx: Prisma.TransactionClient,
    userId: string,
    id: string,
  ) {
    const category = await tx.category.findFirst({ where: { id, userId } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return category;
  }

  // "Outros" (padrão) não pode ser editada nem excluída.
  private assertNotProtected(category: Category, action: string) {
    if (category.isDefault && category.name === PROTECTED_CATEGORY_NAME) {
      throw new BadRequestException(
        `A categoria "${PROTECTED_CATEGORY_NAME}" não pode ser ${action}.`,
      );
    }
  }
}
