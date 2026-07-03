import { z } from 'zod';

const transactionType = z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
const isoDate = z
  .string()
  .refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' })
  .transform((s) => new Date(s));

const endConditionRefine = (data: {
  endDate?: Date | string | null;
  totalOccurrences?: number | null;
}) => !(data.endDate && data.totalOccurrences);

export const createRecurringTemplateSchema = z
  .object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    estimatedAmount: z.number().positive('Valor deve ser positivo'),
    type: transactionType,
    dayOfMonth: z.number().int().min(1).max(31),
    categoryId: z.string().uuid().optional(),
    creditCardId: z.string().uuid().optional(),
    endDate: isoDate.optional(),
    totalOccurrences: z.number().int().positive().optional(),
  })
  .refine(endConditionRefine, {
    message: 'Informe apenas data final ou número de ocorrências, não ambos',
  })
  .refine((data) => !(data.creditCardId && data.type === 'INCOME'), {
    message: 'Recorrentes de receita não podem ser vinculados a cartão',
  });

export const updateRecurringTemplateSchema = z
  .object({
    description: z.string().min(1).optional(),
    estimatedAmount: z.number().positive().optional(),
    type: transactionType.optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    categoryId: z.string().uuid().optional(),
    creditCardId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
    endDate: isoDate.optional().nullable(),
    totalOccurrences: z.number().int().positive().optional().nullable(),
  })
  .refine(endConditionRefine, {
    message: 'Informe apenas data final ou número de ocorrências, não ambos',
  });

export const realizeRecurringTemplateSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  date: isoDate,
  isPaid: z.boolean().optional(),
});

export const skipRecurringTemplateSchema = z.object({
  date: isoDate,
});

export const realizeBatchRecurringTemplateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        amount: z.number().positive('Valor deve ser positivo'),
        date: isoDate,
        isPaid: z.boolean().optional(),
      }),
    )
    .min(1),
});

export type CreateRecurringTemplateDto = z.infer<
  typeof createRecurringTemplateSchema
>;
export type UpdateRecurringTemplateDto = z.infer<
  typeof updateRecurringTemplateSchema
>;
export type RealizeRecurringTemplateDto = z.infer<
  typeof realizeRecurringTemplateSchema
>;
export type SkipRecurringTemplateDto = z.infer<
  typeof skipRecurringTemplateSchema
>;
export type RealizeBatchRecurringTemplateDto = z.infer<
  typeof realizeBatchRecurringTemplateSchema
>;
