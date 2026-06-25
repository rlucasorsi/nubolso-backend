import { z } from 'zod';
import { createRecurringTemplateSchema } from '../schemas';

export type CreateRecurringTemplateDto = z.infer<
  typeof createRecurringTemplateSchema
>;
