import { z } from 'zod';
import { resendCodeSchema } from '../schemas';
export type ResendCodeDto = z.infer<typeof resendCodeSchema>;
