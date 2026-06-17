import { z } from 'zod';
declare const goalContributionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    date: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
export type GoalContributionDto = z.infer<typeof goalContributionSchema>;
export {};
