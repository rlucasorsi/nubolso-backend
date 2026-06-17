import { z } from 'zod';
import { createCreditCardSchema } from '../schemas';

export type CreateCreditCardDto = z.infer<typeof createCreditCardSchema>;
