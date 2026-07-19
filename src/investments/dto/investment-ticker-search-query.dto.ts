import { z } from 'zod';
import { investmentTickerSearchQuerySchema } from '../schemas';

export type InvestmentTickerSearchQueryDto = z.infer<
  typeof investmentTickerSearchQuerySchema
>;
