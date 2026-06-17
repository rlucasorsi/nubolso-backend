import { z } from 'zod';
import { updateGoalSchema } from '../schemas';

export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;
