import { z } from 'zod';

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });

const goalContributionSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  date: isoDate,
  description: z.string().min(1),
});

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  color: z.string().optional(),
  targetAmount: z.number().positive('Valor deve ser positivo'),
  savedAmount: z.number().min(0).optional(),
  deadline: isoDate,
});

export const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  targetAmount: z.number().positive().optional(),
  savedAmount: z.number().min(0).optional(),
  deadline: isoDate.optional(),
  contributions: z.array(goalContributionSchema).optional(),
});

export const createContributionSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  date: isoDate.optional(),
});

export const listContributionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(5).optional(),
});

export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;
export type CreateContributionDto = z.infer<typeof createContributionSchema>;
export type ListContributionsQueryDto = z.infer<typeof listContributionsQuerySchema>;
