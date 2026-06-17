import { z } from 'zod';
import { createPurchaseSchema } from '../schemas';

export type SimulatePurchaseDto = z.infer<typeof createPurchaseSchema>;
