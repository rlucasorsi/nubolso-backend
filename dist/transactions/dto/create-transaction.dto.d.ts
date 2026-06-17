import { z } from 'zod';
import { createTransactionSchema } from '../schemas';
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
