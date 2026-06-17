import { z } from 'zod';
import { listContributionsQuerySchema } from '../schemas';

export type ListContributionsQueryDto = z.infer<typeof listContributionsQuerySchema>;
