import { z } from 'zod';
import { anticipateInstallmentsSchema } from '../schemas';

export type AnticipateInstallmentsDto = z.infer<typeof anticipateInstallmentsSchema>;
