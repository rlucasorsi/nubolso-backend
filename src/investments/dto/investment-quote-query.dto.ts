import { z } from 'zod';
import { investmentQuoteQuerySchema } from '../schemas';

export type InvestmentQuoteQueryDto = z.infer<
  typeof investmentQuoteQuerySchema
>;
