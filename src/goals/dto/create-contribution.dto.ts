import { z } from 'zod';
import { createContributionSchema } from '../schemas';

export type CreateContributionDto = z.infer<typeof createContributionSchema>;
