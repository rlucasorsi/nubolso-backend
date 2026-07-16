import { z } from 'zod';
import { advanceInvoicePaymentSchema } from '../schemas';

export type AdvanceInvoicePaymentDto = z.infer<
  typeof advanceInvoicePaymentSchema
>;
