import { z } from 'zod';
import { updateUserSchema } from '../schemas';

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
