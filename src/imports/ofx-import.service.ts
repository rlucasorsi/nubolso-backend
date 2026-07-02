import {
  BadRequestException,
  ForbiddenException,
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

// Limite de negócio (gera erro amigável); o parser tem seu próprio limite
// mais alto (HARD_PARSE_LIMIT) só para conter CPU em arquivo adversarial.
const MAX_TRANSACTIONS_PER_IMPORT = 5_000;

// Tamanho dos lotes para queries com IN(...) e createMany — evita uma única
// query gigante (limite de parâmetros do driver, tempo de lock no Postgres).
const DB_CHUNK_SIZE = 500;

// Janela de tolerância do matching difuso (ver fuzzy-match.util.ts).
const FUZZY_WINDOW_DAYS = 2;

// $transaction maior que o default (5s) para lotes grandes não estourarem
// timeout no meio da confirmação/rollback.
const BATCH_TRANSACTION_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

@Injectable()
export class OfxImportService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(userId: string, file: Express.Multer.File | undefined) {
    // File validation and OFX parsing happen before the DB transaction to avoid
    // holding a connection while doing CPU-bound work.
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

    if (parsed.transactions.length > MAX_TRANSACTIONS_PER_IMPORT) {
      throw new BadRequestException(
        `Arquivo contém ${parsed.transactions.length} transações, acima do limite de ${MAX_TRANSACTIONS_PER_IMPORT} por import. Divida o período do extrato em arquivos menores.`,
      );
    }

    return this.prisma.withUser(
      userId,
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { plan: true },
        });

        if (user?.plan === 'FREE') {
          throw new ForbiddenException(
            'Importação de extratos OFX é um recurso exclusivo do plano PRO. Faça upgrade para utilizar.',
          );
        }

        await this.validateAccountBinding(
          tx,
          userId,
          parsed.bankId,
          parsed.acctId,
        );

        const fitIds = parsed.transactions
          .map((t) => t.fitId)
          .filter((id): id is string => !!id);
        const existingFitIds = new Set(
          await this.findExistingFitIds(tx, userId, fitIds),
        );

        // Janela de busca limitada ao período do extrato (±FUZZY_WINDOW_DAYS) em
        // vez de toda a história do usuário: mantém o matching difuso em O(n)
        // sobre um conjunto pequeno, mesmo para contas com anos de lançamentos.
        const { minDate, maxDate } = this.dateRangeWithMargin(
          parsed.transactions,
        );
        const manualTransactions = await tx.transaction.findMany({
          where: { userId, fitId: null, date: { gte: minDate, lte: maxDate } },
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

        const batch = await tx.importBatch.create({
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
          },
        });

        for (const itemsChunk of chunk(itemsData, DB_CHUNK_SIZE)) {
          await tx.importBatchItem.createMany({
            data: itemsChunk.map((item) => ({ ...item, batchId: batch.id })),
          });
        }

        const batchWithItems = await this.findBatchOrThrow(
          tx,
          userId,
          batch.id,
        );
        return { ...batchWithItems, parseErrors: parsed.errors };
      },
      BATCH_TRANSACTION_OPTIONS,
    );
  }

  async findAllBatches(userId: string) {
    return this.prisma.withUser(userId, (tx) =>
      tx.importBatch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findBatchDetail(userId: string, batchId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const batch = await this.findBatchOrThrow(tx, userId, batchId);

      const matchedIds = batch.items
        .map((i) => i.matchedTransactionId)
        .filter((id): id is string => !!id);

      const matchedTransactions = matchedIds.length
        ? await tx.transaction.findMany({
            where: { id: { in: matchedIds }, userId },
            select: {
              id: true,
              description: true,
              amount: true,
              date: true,
            },
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
    });
  }

  async confirm(
    userId: string,
    batchId: string,
    decisions: ConfirmImportDto['decisions'],
  ) {
    return this.prisma.withUser(
      userId,
      async (tx) => {
        const batch = await this.findBatchOrThrow(tx, userId, batchId);

        if (batch.status !== 'PENDING_REVIEW') {
          throw new BadRequestException('Este lote já foi processado');
        }

        const decisionMap = new Map(decisions.map((d) => [d.itemId, d.action]));

        const toImport = batch.items.filter((item) => {
          if (item.status === 'DUPLICATE_EXACT') return false;
          const action = decisionMap.get(item.id) ?? item.decision ?? 'SKIP';
          return action === 'IMPORT';
        });

        let importedCount = 0;

        for (const itemsChunk of chunk(toImport, DB_CHUNK_SIZE)) {
          const result = await tx.transaction.createMany({
            data: itemsChunk.map((item) => ({
              description: item.description,
              amount: item.amount,
              type: item.type,
              date: item.date,
              isPaid: true,
              userId,
              fitId: item.fitId,
              importBatchId: batch.id,
            })),
            skipDuplicates: true,
          });
          importedCount += result.count;
        }

        return tx.importBatch.update({
          where: { id: batch.id, userId },
          data: { status: 'CONFIRMED', importedCount, confirmedAt: new Date() },
          include: { items: true },
        });
      },
      BATCH_TRANSACTION_OPTIONS,
    );
  }

  async rollback(userId: string, batchId: string) {
    return this.prisma.withUser(
      userId,
      async (tx) => {
        const batch = await this.findBatchOrThrow(tx, userId, batchId);

        if (batch.status !== 'CONFIRMED') {
          throw new BadRequestException(
            'Apenas lotes confirmados podem ser desfeitos',
          );
        }

        await tx.transaction.deleteMany({
          where: { importBatchId: batchId, userId },
        });

        return tx.importBatch.update({
          where: { id: batchId, userId },
          data: { status: 'ROLLED_BACK', importedCount: 0 },
        });
      },
      BATCH_TRANSACTION_OPTIONS,
    );
  }

  async cancel(userId: string, batchId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const batch = await this.findBatchOrThrow(tx, userId, batchId);

      if (batch.status !== 'PENDING_REVIEW') {
        throw new BadRequestException(
          'Apenas lotes pendentes de revisão podem ser cancelados',
        );
      }

      return tx.importBatch.update({
        where: { id: batchId, userId },
        data: { status: 'CANCELED' },
      });
    });
  }

  private async findExistingFitIds(
    tx: Prisma.TransactionClient,
    userId: string,
    fitIds: string[],
  ): Promise<string[]> {
    if (fitIds.length === 0) return [];

    const results = await Promise.all(
      chunk(fitIds, DB_CHUNK_SIZE).map((idsChunk) =>
        tx.transaction.findMany({
          where: { userId, fitId: { in: idsChunk } },
          select: { fitId: true },
        }),
      ),
    );

    return results.flat().map((t) => t.fitId as string);
  }

  private dateRangeWithMargin(transactions: { date: Date }[]): {
    minDate: Date;
    maxDate: Date;
  } {
    const marginMs = FUZZY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const timestamps = transactions.map((t) => t.date.getTime());
    return {
      minDate: new Date(Math.min(...timestamps) - marginMs),
      maxDate: new Date(Math.max(...timestamps) + marginMs),
    };
  }

  private async findBatchOrThrow(
    tx: Prisma.TransactionClient,
    userId: string,
    batchId: string,
  ) {
    const batch = await tx.importBatch.findFirst({
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
    tx: Prisma.TransactionClient,
    userId: string,
    bankId: string | null,
    acctId: string | null,
  ): Promise<void> {
    if (!acctId) return;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { ofxBankId: true, ofxAcctId: true },
    });

    if (!user?.ofxAcctId) {
      await tx.user.update({
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
