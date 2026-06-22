import { z } from 'zod';
import { advanceInstallmentsSchema } from '../schemas';

export type AdvanceInstallmentsDto = z.infer<typeof advanceInstallmentsSchema>;
