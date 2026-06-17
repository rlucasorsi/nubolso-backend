import { z } from 'zod';
import { registerSchema } from '../schemas';

export type RegisterDto = z.infer<typeof registerSchema>;
