import { z } from 'zod';
import { googleAuthSchema } from '../schemas';

export type GoogleAuthDto = z.infer<typeof googleAuthSchema>;
