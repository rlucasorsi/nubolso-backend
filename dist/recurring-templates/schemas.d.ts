import { z } from 'zod';
export declare const createRecurringTemplateSchema: z.ZodObject<{
    description: z.ZodString;
    estimatedAmount: z.ZodNumber;
    type: z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>;
    dayOfMonth: z.ZodNumber;
    categoryId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateRecurringTemplateSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    estimatedAmount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    categoryId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const realizeRecurringTemplateSchema: z.ZodObject<{
    amount: z.ZodNumber;
    date: z.ZodString;
    isPaid: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const skipRecurringTemplateSchema: z.ZodObject<{
    date: z.ZodString;
}, z.core.$strip>;
export type CreateRecurringTemplateDto = z.infer<typeof createRecurringTemplateSchema>;
export type UpdateRecurringTemplateDto = z.infer<typeof updateRecurringTemplateSchema>;
export type RealizeRecurringTemplateDto = z.infer<typeof realizeRecurringTemplateSchema>;
export type SkipRecurringTemplateDto = z.infer<typeof skipRecurringTemplateSchema>;
