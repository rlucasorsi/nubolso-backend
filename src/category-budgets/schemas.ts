import { z } from 'zod';

const dateString = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const queryCategoryBudgetSchema = z.object({
  periodStart: dateString,
});

export const upsertCategoryBudgetSchema = z.object({
  categoryId: z.string().uuid('categoryId inválido'),
  periodStart: dateString,
  amount: z.number().positive('Valor deve ser positivo'),
});

export type QueryCategoryBudgetDto = z.infer<typeof queryCategoryBudgetSchema>;
export type UpsertCategoryBudgetDto = z.infer<
  typeof upsertCategoryBudgetSchema
>;
