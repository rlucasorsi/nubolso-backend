import { z } from 'zod';
export declare const createGoalSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
    targetAmount: z.ZodNumber;
    savedAmount: z.ZodOptional<z.ZodNumber>;
    deadline: z.ZodString;
}, z.core.$strip>;
export declare const updateGoalSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    targetAmount: z.ZodOptional<z.ZodNumber>;
    savedAmount: z.ZodOptional<z.ZodNumber>;
    deadline: z.ZodOptional<z.ZodString>;
    contributions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        amount: z.ZodNumber;
        date: z.ZodString;
        description: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const createContributionSchema: z.ZodObject<{
    amount: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const listContributionsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;
export type CreateContributionDto = z.infer<typeof createContributionSchema>;
export type ListContributionsQueryDto = z.infer<typeof listContributionsQuerySchema>;
