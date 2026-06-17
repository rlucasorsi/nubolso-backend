import { z } from 'zod';
import { realizeRecurringTemplateSchema } from '../schemas';

export type RealizeRecurringTemplateDto = z.infer<typeof realizeRecurringTemplateSchema>;
