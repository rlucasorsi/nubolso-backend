import { z } from 'zod';
export declare const createCreditCardSchema: z.ZodObject<{
    name: z.ZodString;
    closingDay: z.ZodNumber;
    dueDay: z.ZodNumber;
    paymentDay: z.ZodNumber;
}, z.core.$strip>;
export declare const updateCreditCardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    closingDay: z.ZodOptional<z.ZodNumber>;
    dueDay: z.ZodOptional<z.ZodNumber>;
    paymentDay: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createPurchaseSchema: z.ZodObject<{
    cardId: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    totalAmount: z.ZodNumber;
    installmentsCount: z.ZodNumber;
    purchaseDate: z.ZodString;
    strategy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        FIRST: "FIRST";
        LAST: "LAST";
    }>>>;
}, z.core.$strip>;
export declare const payInvoiceSchema: z.ZodObject<{
    amount: z.ZodNumber;
    paymentDate: z.ZodOptional<z.ZodString>;
    remainderInstallments: z.ZodOptional<z.ZodNumber>;
    interestRate: z.ZodOptional<z.ZodNumber>;
    installmentAmount: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateInvoiceSchema: z.ZodObject<{
    paymentDate: z.ZodString;
}, z.core.$strip>;
export type CreateCreditCardDto = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardDto = z.infer<typeof updateCreditCardSchema>;
export type CreatePurchaseDto = z.infer<typeof createPurchaseSchema>;
export type PayInvoiceDto = z.infer<typeof payInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
