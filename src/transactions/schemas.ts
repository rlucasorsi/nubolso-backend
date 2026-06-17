import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const createTransactionSchema = z.object({
  description: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  type: transactionType,
  date: isoDate,
  isPaid: z.boolean().optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: transactionType.optional(),
  date: isoDate.optional(),
  isPaid: z.boolean().optional(),
  categoryId: z.string().uuid().optional(),
});

export const queryTransactionSchema = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  type: transactionType.optional(),
  categoryId: z.string().uuid().optional(),
  isPaid: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionDto = z.infer<typeof queryTransactionSchema>;
