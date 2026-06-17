import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const createRecurringTemplateSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  estimatedAmount: z.number().positive('Valor deve ser positivo'),
  type: transactionType,
  dayOfMonth: z.number().int().min(1).max(31),
  categoryId: z.string().uuid().optional(),
});

export const updateRecurringTemplateSchema = z.object({
  description: z.string().min(1).optional(),
  estimatedAmount: z.number().positive().optional(),
  type: transactionType.optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

export const realizeRecurringTemplateSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: isoDate,
  isPaid: z.boolean().optional(),
});

export const skipRecurringTemplateSchema = z.object({
  date: isoDate,
});

export type CreateRecurringTemplateDto = z.infer<typeof createRecurringTemplateSchema>;
export type UpdateRecurringTemplateDto = z.infer<typeof updateRecurringTemplateSchema>;
export type RealizeRecurringTemplateDto = z.infer<typeof realizeRecurringTemplateSchema>;
export type SkipRecurringTemplateDto = z.infer<typeof skipRecurringTemplateSchema>;
