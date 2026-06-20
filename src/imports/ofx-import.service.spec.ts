import { BadRequestException } from '@nestjs/common';
import { OfxImportService } from './ofx-import.service';
import { PrismaService } from '../prisma/prisma.service';
import * as ofxParser from './ofx-parser.util';

describe('OfxImportService - limite de transações por import', () => {
  it('rejeita arquivos com mais transações do que o limite de negócio', async () => {
    const prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      transaction: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const service = new OfxImportService(prisma);

    jest.spyOn(ofxParser, 'parseOfx').mockReturnValue({
      bankId: '001',
      acctId: '123',
      transactions: Array.from({ length: 5_001 }, (_, i) => ({
        fitId: String(i),
        date: new Date('2024-01-01T00:00:00Z'),
        amount: 10,
        type: 'EXPENSE' as const,
        description: 'Transação',
      })),
      errors: [],
    });

    const file = {
      buffer: Buffer.from(''),
      originalname: 'extrato.ofx',
      size: 1,
    } as Express.Multer.File;

    await expect(service.upload('user-1', file)).rejects.toThrow(
      BadRequestException,
    );
  });
});
