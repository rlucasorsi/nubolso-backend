import { z } from 'zod';

const goalContributionSchema = z.object({
  id: z.string().optional(),
  amount: z.number(),
  date: z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' }),
  description: z.string().min(1),
});

export type GoalContributionDto = z.infer<typeof goalContributionSchema>;
