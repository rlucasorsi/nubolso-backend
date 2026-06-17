import { z } from 'zod';
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>;
}, z.core.$strip>;
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
