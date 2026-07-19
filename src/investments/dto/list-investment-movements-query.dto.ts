import { z } from 'zod';
import { listInvestmentMovementsQuerySchema } from '../schemas';

export type ListInvestmentMovementsQueryDto = z.infer<
  typeof listInvestmentMovementsQuerySchema
>;
