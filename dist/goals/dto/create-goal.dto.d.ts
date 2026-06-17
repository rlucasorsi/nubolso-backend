import { z } from 'zod';
import { createGoalSchema } from '../schemas';
export type CreateGoalDto = z.infer<typeof createGoalSchema>;
