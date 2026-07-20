import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']);
const expenseType = z.enum(['fixa', 'variavel']);
const isoDate = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const createTransactionSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  type: transactionType,
  // Só se aplica a despesas; o service força null para os demais tipos.
  tipoDespesa: expenseType.nullable().optional(),
  date: isoDate,
  isPaid: z.boolean().optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: transactionType.optional(),
  tipoDespesa: expenseType.nullable().optional(),
  date: isoDate.optional(),
  isPaid: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
  templateId: z.string().uuid().nullable().optional(),
});

export const queryTransactionSchema = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  type: transactionType.optional(),
  // 'none' filtra despesas sem classificação (tipoDespesa nulo).
  tipoDespesa: z.enum(['fixa', 'variavel', 'none']).optional(),
  categoryId: z.string().uuid().optional(),
  isPaid: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(),
  // 'all' (padrão, preserva comportamento pré-existente p/ quem não filtra) não
  // filtra; 'main' exclui ignorados; 'ignored' traz só os ignorados. Vários
  // consumidores (ex.: motor de fluxo de caixa) dependem de ver os ignorados
  // mesmo sem passar `view` explicitamente, para não regenerar a estimativa
  // virtual daquela ocorrência.
  view: z.enum(['main', 'ignored', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionDto = z.infer<typeof queryTransactionSchema>;
