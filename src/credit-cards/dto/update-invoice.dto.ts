import { z } from 'zod';
import { updateInvoiceSchema } from '../schemas';

export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
