import { z } from 'zod';
import { createInvestmentSchema } from '../schemas';

export type CreateInvestmentDto = z.infer<typeof createInvestmentSchema>;
