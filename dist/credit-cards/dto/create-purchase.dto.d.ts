import { z } from 'zod';
import { createPurchaseSchema } from '../schemas';
export type CreatePurchaseDto = z.infer<typeof createPurchaseSchema>;
