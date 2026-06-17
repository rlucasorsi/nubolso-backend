import { z } from 'zod';
import { queryTransactionSchema } from '../schemas';
export type QueryTransactionDto = z.infer<typeof queryTransactionSchema>;
