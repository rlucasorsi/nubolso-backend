import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']);
const budgetDirection = z.enum(['LIMIT', 'GOAL']);

const hexColor = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    'Cor inválida (use HEX, ex: #22c55e)',
  );

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: transactionType,
  color: hexColor.optional(),
  icon: z.string().max(50).optional(),
  includeInBalanceBase: z.boolean().optional(),
  budgetDirection: budgetDirection.optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: transactionType.optional(),
  color: hexColor.optional(),
  icon: z.string().max(50).optional(),
  includeInBalanceBase: z.boolean().optional(),
  budgetDirection: budgetDirection.optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
