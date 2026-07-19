import { z } from 'zod';
import { createInvestmentMovementSchema } from '../schemas';

export type CreateInvestmentMovementDto = z.infer<
  typeof createInvestmentMovementSchema
>;
