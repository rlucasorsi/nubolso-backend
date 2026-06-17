import { z } from 'zod';
import { updateRecurringTemplateSchema } from '../schemas';
export type UpdateRecurringTemplateDto = z.infer<typeof updateRecurringTemplateSchema>;
