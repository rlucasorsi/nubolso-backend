import { z } from 'zod';
import { verifyEmailSchema } from '../schemas';
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
