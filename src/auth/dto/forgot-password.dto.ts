import { z } from 'zod';
import { forgotPasswordSchema } from '../schemas';

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
