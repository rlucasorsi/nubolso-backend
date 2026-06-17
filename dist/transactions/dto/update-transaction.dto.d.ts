import { z } from 'zod';
import { updateTransactionSchema } from '../schemas';
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
