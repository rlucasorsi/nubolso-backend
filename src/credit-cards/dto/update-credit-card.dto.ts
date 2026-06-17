import { z } from 'zod';
import { updateCreditCardSchema } from '../schemas';

export type UpdateCreditCardDto = z.infer<typeof updateCreditCardSchema>;
