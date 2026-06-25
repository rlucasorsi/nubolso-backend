import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        // Null out FK references that lack cascade before deleting the targets
        await tx.creditCardInstallment.updateMany({
          where: { invoice: { userId: id } },
          data: { advanceId: null, isAnticipated: false },
        });
        await tx.creditCardInvoice.updateMany({
          where: { userId: id },
          data: { transactionId: null },
        });
        await tx.transaction.updateMany({
          where: { userId: id },
          data: { importBatchId: null, templateId: null },
        });

        // Delete in dependency order (children before parents)
        await tx.installmentAdvance.deleteMany({ where: { userId: id } });
        await tx.creditCardInstallment.deleteMany({
          where: { invoice: { userId: id } },
        });
        await tx.creditCardPurchase.deleteMany({ where: { userId: id } });
        await tx.creditCardInvoice.deleteMany({ where: { userId: id } });
        await tx.creditCard.deleteMany({ where: { userId: id } });
        await tx.importBatch.deleteMany({ where: { userId: id } }); // items cascade
        await tx.transaction.deleteMany({ where: { userId: id } });
        await tx.recurringTemplate.deleteMany({ where: { userId: id } });
        await tx.category.deleteMany({ where: { userId: id } });
        await tx.goal.deleteMany({ where: { userId: id } }); // contributions cascade
        await tx.user.delete({ where: { id } });
      },
      { timeout: 30000 },
    );
  }

  async exportData(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        transactions: { include: { category: true } },
        recurringTemplates: true,
        categories: true,
        goals: true,
        creditCards: {
          include: {
            invoices: {
              include: {
                installments: { include: { purchase: true } },
                advances: true,
              },
            },
          },
        },
        importBatches: true,
      },
    });

    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, verificationCode, passwordResetCode, ...safeUser } =
      user;
    return { exportedAt: new Date().toISOString(), ...safeUser };
  }
}
