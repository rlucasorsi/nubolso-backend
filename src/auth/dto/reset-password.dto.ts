import { z } from 'zod';
import { resetPasswordSchema } from '../schemas';

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
