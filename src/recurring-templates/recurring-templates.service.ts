import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringTemplateDto } from './dto/create-recurring-template.dto';
import { UpdateRecurringTemplateDto } from './dto/update-recurring-template.dto';
import { RealizeRecurringTemplateDto } from './dto/realize-recurring-template.dto';
import { SkipRecurringTemplateDto } from './dto/skip-recurring-template.dto';

@Injectable()
export class RecurringTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const templates = await this.prisma.recurringTemplate.findMany({
      where: { userId },
      include: {
        category: true,
        _count: { select: { instances: { where: { isSkipped: false } } } },
      },
      orderBy: { dayOfMonth: 'asc' },
    });

    return templates.map(({ _count, ...t }) => ({
      ...t,
      occurrenceCount: _count.instances,
    }));
  }

  async create(userId: string, data: CreateRecurringTemplateDto) {
    return this.prisma.recurringTemplate.create({
      data: { ...data, userId },
      include: { category: true },
    });
  }

  async update(userId: string, id: string, data: UpdateRecurringTemplateDto) {
    await this.findOne(userId, id);

    return this.prisma.recurringTemplate.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.recurringTemplate.delete({
      where: { id },
    });
  }

  async realize(userId: string, id: string, data: RealizeRecurringTemplateDto) {
    const template = await this.findOne(userId, id);
    const date = new Date(data.date);

    const transaction = await this.prisma.transaction.upsert({
      where: {
        templateId_date: {
          templateId: id,
          date,
        },
      },
      create: {
        description: template.description,
        amount: data.amount,
        type: template.type,
        date,
        isPaid: data.isPaid ?? false,
        templateId: id,
        categoryId: template.categoryId,
        userId,
      },
      update: {
        amount: data.amount,
        isPaid: data.isPaid ?? undefined,
      },
      include: {
        category: true,
      },
    });

    if (template.totalOccurrences) {
      const realizedCount = await this.prisma.transaction.count({
        where: { templateId: id, isSkipped: false },
      });
      if (realizedCount >= template.totalOccurrences) {
        await this.prisma.recurringTemplate.update({
          where: { id },
          data: { isActive: false },
        });
      }
    }

    return transaction;
  }

  // Marks (or creates) the instance for this templateId+date as "skipped":
  // it stops generating a virtual estimate AND is hidden from balance totals,
  // while remaining visible (as "Ignorado") so the user can reverse it later
  // by deleting it (which restores the regular estimate behavior).
  async skip(userId: string, id: string, data: SkipRecurringTemplateDto) {
    const template = await this.findOne(userId, id);
    const date = new Date(data.date);

    return this.prisma.transaction.upsert({
      where: {
        templateId_date: {
          templateId: id,
          date,
        },
      },
      create: {
        description: template.description,
        amount: template.estimatedAmount,
        type: template.type,
        date,
        isPaid: false,
        isSkipped: true,
        templateId: id,
        categoryId: template.categoryId,
        userId,
      },
      update: {
        isSkipped: true,
        isPaid: false,
      },
      include: {
        category: true,
      },
    });
  }

  private async findOne(userId: string, id: string) {
    const template = await this.prisma.recurringTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new NotFoundException('Recurring template not found');
    }

    return template;
  }
}
