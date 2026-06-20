import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { parseOfx } from './ofx-parser.util';
import { findFuzzyMatch } from './fuzzy-match.util';
import { ConfirmImportDto } from './dto/confirm-import.dto';

const MAX_OFX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(ofx|qfx)$/i;

@Injectable()
export class OfxImportService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(userId: string, file: Express.Multer.File | undefined) {
    this.validateFile(file);

    let parsed: ReturnType<typeof parseOfx>;
    try {
      parsed = parseOfx(file!.buffer);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }

    if (parsed.transactions.length === 0) {
      throw new BadRequestException(
        'Nenhuma transação encontrada no arquivo OFX',
      );
    }

    await this.validateAccountBinding(userId, parsed.bankId, parsed.acctId);

    const fitIds = parsed.transactions
      .map((t) => t.fitId)
      .filter((id): id is string => !!id);
    const existingFitIds = new Set(
      fitIds.length
        ? (
            await this.prisma.transaction.findMany({
              where: { userId, fitId: { in: fitIds } },
              select: { fitId: true },
            })
          ).map((t) => t.fitId)
        : [],
    );

    const manualTransactions = await this.prisma.transaction.findMany({
      where: { userId, fitId: null },
      select: { id: true, amount: true, date: true, description: true },
    });

    let newCount = 0;
    let duplicateExactCount = 0;
    let possibleDuplicateCount = 0;

    const itemsData = parsed.transactions.map((t) => {
      if (t.fitId && existingFitIds.has(t.fitId)) {
        duplicateExactCount++;
        return {
          fitId: t.fitId,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date,
          status: 'DUPLICATE_EXACT' as const,
          matchedTransactionId: null,
          similarityScore: null,
          decision: 'SKIP' as const,
        };
      }

      const match = findFuzzyMatch(t, manualTransactions);
      if (match) {
        possibleDuplicateCount++;
        return {
          fitId: t.fitId,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date,
          status: 'POSSIBLE_DUPLICATE' as const,
          matchedTransactionId: match.id,
          similarityScore: match.similarityScore,
          decision: 'SKIP' as const,
        };
      }

      newCount++;
      return {
        fitId: t.fitId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        status: 'NEW' as const,
        matchedTransactionId: null,
        similarityScore: null,
        decision: 'IMPORT' as const,
      };
    });

    const batch = await this.prisma.importBatch.create({
      data: {
        userId,
        fileName: file!.originalname,
        bankId: parsed.bankId,
        acctId: parsed.acctId,
        status: 'PENDING_REVIEW',
        totalCount: parsed.transactions.length,
        newCount,
        duplicateExactCount,
        possibleDuplicateCount,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    return { ...batch, parseErrors: parsed.errors };
  }

  async findAllBatches(userId: string) {
    return this.prisma.importBatch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBatchDetail(userId: string, batchId: string) {
    const batch = await this.findBatchOrThrow(userId, batchId);

    const matchedIds = batch.items
      .map((i) => i.matchedTransactionId)
      .filter((id): id is string => !!id);

    const matchedTransactions = matchedIds.length
      ? await this.prisma.transaction.findMany({
          where: { id: { in: matchedIds } },
          select: { id: true, description: true, amount: true, date: true },
        })
      : [];

    const matchedById = new Map(matchedTransactions.map((t) => [t.id, t]));

    return {
      ...batch,
      items: batch.items.map((item) => ({
        ...item,
        matchedTransaction: item.matchedTransactionId
          ? (matchedById.get(item.matchedTransactionId) ?? null)
          : null,
      })),
    };
  }

  async confirm(
    userId: string,
    batchId: string,
    decisions: ConfirmImportDto['decisions'],
  ) {
    const batch = await this.findBatchOrThrow(userId, batchId);

    if (batch.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Este lote já foi processado');
    }

    const decisionMap = new Map(decisions.map((d) => [d.itemId, d.action]));

    return this.prisma.$transaction(async (tx) => {
      let importedCount = 0;

      for (const item of batch.items) {
        if (item.status === 'DUPLICATE_EXACT') continue;

        const action = decisionMap.get(item.id) ?? item.decision ?? 'SKIP';
        if (action !== 'IMPORT') continue;

        try {
          await tx.transaction.create({
            data: {
              description: item.description,
              amount: item.amount,
              type: item.type,
              date: item.date,
              isPaid: true,
              userId,
              fitId: item.fitId,
              importBatchId: batch.id,
            },
          });
          importedCount++;
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            continue;
          }
          throw err;
        }
      }

      return tx.importBatch.update({
        where: { id: batch.id },
        data: { status: 'CONFIRMED', importedCount, confirmedAt: new Date() },
        include: { items: true },
      });
    });
  }

  async rollback(userId: string, batchId: string) {
    const batch = await this.findBatchOrThrow(userId, batchId);

    if (batch.status !== 'CONFIRMED') {
      throw new BadRequestException(
        'Apenas lotes confirmados podem ser desfeitos',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { importBatchId: batchId, userId },
      });

      return tx.importBatch.update({
        where: { id: batchId },
        data: { status: 'ROLLED_BACK', importedCount: 0 },
      });
    });
  }

  async cancel(userId: string, batchId: string) {
    const batch = await this.findBatchOrThrow(userId, batchId);

    if (batch.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        'Apenas lotes pendentes de revisão podem ser cancelados',
      );
    }

    return this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'CANCELED' },
    });
  }

  private async findBatchOrThrow(userId: string, batchId: string) {
    const batch = await this.prisma.importBatch.findFirst({
      where: { id: batchId, userId },
      include: { items: true },
    });

    if (!batch) {
      throw new NotFoundException('Lote de importação não encontrado');
    }

    return batch;
  }

  private validateFile(file: Express.Multer.File | undefined): void {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }
    if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
      throw new BadRequestException(
        'Formato de arquivo inválido. Envie um arquivo .ofx ou .qfx',
      );
    }
    if (file.size > MAX_OFX_FILE_SIZE) {
      throw new BadRequestException('Arquivo muito grande (máximo 5MB)');
    }
  }

  private async validateAccountBinding(
    userId: string,
    bankId: string | null,
    acctId: string | null,
  ): Promise<void> {
    if (!acctId) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ofxBankId: true, ofxAcctId: true },
    });

    if (!user?.ofxAcctId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { ofxBankId: bankId, ofxAcctId: acctId },
      });
      return;
    }

    const bankMismatch =
      !!bankId && !!user.ofxBankId && user.ofxBankId !== bankId;
    if (user.ofxAcctId !== acctId || bankMismatch) {
      throw new BadRequestException(
        'Este arquivo OFX pertence a uma conta bancária diferente da usada no primeiro import. Verifique se o arquivo está correto.',
      );
    }
  }
}
