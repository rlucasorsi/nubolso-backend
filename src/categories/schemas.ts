import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'SPENDING']);

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional(),
  type: transactionType,
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
