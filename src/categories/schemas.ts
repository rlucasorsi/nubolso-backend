import { z } from 'zod';

const hexColor = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    'Cor inválida (use HEX, ex: #22c55e)',
  );

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: hexColor.optional(),
  icon: z.string().max(50).optional(),
  includeInBalanceBase: z.boolean().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  color: hexColor.optional(),
  icon: z.string().max(50).optional(),
  includeInBalanceBase: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
