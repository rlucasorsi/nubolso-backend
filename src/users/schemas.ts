import { z } from 'zod';

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  currentBalance: z.number().optional(),
  balanceStartDate: isoDate.optional(),
  greenThreshold: z.number().min(0).optional(),
  yellowThreshold: z.number().min(0).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
