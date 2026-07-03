import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RecurringTemplatesService } from './recurring-templates.service';
import { PrismaService } from '../prisma/prisma.service';

const CARD = {
  id: 'card-1',
  name: 'Nubank',
  isActive: true,
  closingDay: 5,
  dueDay: 10,
  paymentDay: 10,
  userId: 'user-1',
};

const CARD_TEMPLATE = {
  id: 'tpl-1',
  description: 'Netflix',
  estimatedAmount: 39.9,
  type: 'EXPENSE',
  dayOfMonth: 15,
  isActive: true,
  categoryId: null,
  userId: 'user-1',
  endDate: null,
  totalOccurrences: null,
  creditCardId: CARD.id,
  creditCard: { id: CARD.id, name: CARD.name, isActive: true },
};

function buildPrismaMock() {
  const tx = {
    creditCardPurchase: {
      create: jest.fn().mockResolvedValue({ id: 'purchase-1' }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'purchase-1', installments: [] }),
    },
    creditCardInvoice: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    creditCardInstallment: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    transaction: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };

  // second findMany call (after createMany) must return the created invoice
  tx.creditCardInvoice.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      { id: 'invoice-1', referenceYear: 2026, referenceMonth: 8 },
    ]);

  const prisma = {
    recurringTemplate: {
      findFirst: jest.fn().mockResolvedValue(CARD_TEMPLATE),
      update: jest.fn(),
    },
    creditCard: {
      findFirst: jest.fn().mockResolvedValue(CARD),
      findUniqueOrThrow: jest.fn().mockResolvedValue(CARD),
    },
    creditCardPurchase: {
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    transaction: {
      upsert: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
  };

  return { prisma, tx };
}

describe('RecurringTemplatesService — realize de template vinculado a cartão', () => {
  let service: RecurringTemplatesService;
  let prisma: ReturnType<typeof buildPrismaMock>['prisma'];
  let tx: ReturnType<typeof buildPrismaMock>['tx'];

  beforeEach(async () => {
    ({ prisma, tx } = buildPrismaMock());
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringTemplatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RecurringTemplatesService);
  });

  it('cria uma compra de 1 parcela na fatura do ciclo correto', async () => {
    await service.realize('user-1', 'tpl-1', {
      amount: 39.9,
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    expect(tx.creditCardPurchase.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: 'Netflix',
        totalAmount: 39.9,
        installmentsCount: 1,
        cardId: 'card-1',
        templateId: 'tpl-1',
      }) as Record<string, unknown>,
    });
    // dia 15 >= fechamento (5) -> fatura de agosto
    expect(tx.creditCardInstallment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          number: 1,
          totalCount: 1,
          amount: 39.9,
          invoiceId: 'invoice-1',
        }),
      ],
    });
    expect(prisma.transaction.upsert).not.toHaveBeenCalled();
  });

  it('remove um skip anterior da mesma ocorrência ao realizar', async () => {
    const date = new Date('2026-07-15T00:00:00.000Z');
    await service.realize('user-1', 'tpl-1', { amount: 39.9, date });

    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({
      where: { templateId: 'tpl-1', date, isSkipped: true },
    });
  });

  it('é idempotente: retorna a compra existente sem criar outra', async () => {
    prisma.creditCardPurchase.findUnique.mockResolvedValue({
      id: 'purchase-1',
      installments: [],
    });

    const result = await service.realize('user-1', 'tpl-1', {
      amount: 39.9,
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    expect(result).toEqual({ id: 'purchase-1', installments: [] });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita realize quando o cartão está inativo', async () => {
    prisma.recurringTemplate.findFirst.mockResolvedValue({
      ...CARD_TEMPLATE,
      creditCard: { ...CARD_TEMPLATE.creditCard, isActive: false },
    });

    await expect(
      service.realize('user-1', 'tpl-1', {
        amount: 39.9,
        date: new Date('2026-07-15T00:00:00.000Z'),
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('desativa o template quando purchases atingem totalOccurrences', async () => {
    prisma.recurringTemplate.findFirst.mockResolvedValue({
      ...CARD_TEMPLATE,
      totalOccurrences: 2,
    });
    prisma.creditCardPurchase.count.mockResolvedValue(2);

    await service.realize('user-1', 'tpl-1', {
      amount: 39.9,
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    expect(prisma.recurringTemplate.update).toHaveBeenCalledWith({
      where: { id: 'tpl-1', userId: 'user-1' },
      data: { isActive: false },
    });
  });

  it('update rejeita vincular cartão a template de receita', async () => {
    prisma.recurringTemplate.findFirst.mockResolvedValue({
      ...CARD_TEMPLATE,
      type: 'INCOME',
      creditCardId: null,
      creditCard: null,
    });

    await expect(
      service.update('user-1', 'tpl-1', { creditCardId: CARD.id }),
    ).rejects.toThrow(BadRequestException);
  });
});
