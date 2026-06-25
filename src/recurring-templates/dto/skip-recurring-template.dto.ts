import { z } from 'zod';
import { skipRecurringTemplateSchema } from '../schemas';

export type SkipRecurringTemplateDto = z.infer<
  typeof skipRecurringTemplateSchema
>;
