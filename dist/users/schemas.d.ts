import { z } from 'zod';
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    currentBalance: z.ZodOptional<z.ZodNumber>;
    balanceStartDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
