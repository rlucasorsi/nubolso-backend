import { z } from 'zod';
import { payInvoiceSchema } from '../schemas';
export type PayInvoiceDto = z.infer<typeof payInvoiceSchema>;
