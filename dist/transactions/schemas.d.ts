import { z } from 'zod';
export declare const createTransactionSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    type: z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>;
    date: z.ZodString;
    isPaid: z.ZodOptional<z.ZodBoolean>;
    categoryId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateTransactionSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>>;
    date: z.ZodOptional<z.ZodString>;
    isPaid: z.ZodOptional<z.ZodBoolean>;
    categoryId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const queryTransactionSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        INCOME: "INCOME";
        EXPENSE: "EXPENSE";
        SPENDING: "SPENDING";
    }>>;
    categoryId: z.ZodOptional<z.ZodString>;
    isPaid: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDto = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionDto = z.infer<typeof queryTransactionSchema>;
