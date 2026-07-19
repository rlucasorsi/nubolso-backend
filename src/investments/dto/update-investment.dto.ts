import { z } from 'zod';
import { updateInvestmentSchema } from '../schemas';

export type UpdateInvestmentDto = z.infer<typeof updateInvestmentSchema>;
