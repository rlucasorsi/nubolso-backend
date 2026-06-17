import { z } from 'zod';
import { loginSchema } from '../schemas';

export type LoginDto = z.infer<typeof loginSchema>;
