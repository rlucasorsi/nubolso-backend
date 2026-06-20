import { z } from 'zod';
import { confirmImportSchema } from '../schemas';

export type ConfirmImportDto = z.infer<typeof confirmImportSchema>;
