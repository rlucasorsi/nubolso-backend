import { z } from 'zod';

const isoDate = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
const dayRange = z.number().int().min(1).max(31);

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  closingDay: dayRange,
  dueDay: dayRange,
  paymentDay: dayRange,
});

export const updateCreditCardSchema = z.object({
  name: z.string().min(1).optional(),
  closingDay: dayRange.optional(),
  dueDay: dayRange.optional(),
  paymentDay: dayRange.optional(),
  isActive: z.boolean().optional(),
});

export const createPurchaseSchema = z.object({
  cardId: z.string().uuid('cardId inválido'),
  description: z.string().optional(),
  totalAmount: z.number().positive('Valor deve ser positivo'),
  installmentsCount: z.number().int().min(1).max(48),
  purchaseDate: isoDate,
  strategy: z.enum(['FIRST', 'LAST']).optional().default('LAST'),
});

export const payInvoiceSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  paymentDate: isoDate.optional(),
  remainderInstallments: z.number().int().min(1).max(48).optional(),
  interestRate: z.number().min(0).max(100).optional(),
  installmentAmount: z.number().positive().optional(),
});

export const updateInvoiceSchema = z.object({
  paymentDate: isoDate,
});

export const anticipateInstallmentsSchema = z.object({
  purchaseId: z.string().uuid('purchaseId inválido'),
  installmentsCount: z.number().int().min(1),
  paidAmount: z.number().positive('Valor deve ser positivo'),
});

export const advanceInstallmentsSchema = z
  .object({
    targetYear: z.number().int().min(2020).max(2100).optional(),
    targetMonth: z.number().int().min(1).max(12).optional(),
  })
  .refine(
    (d) => (d.targetYear === undefined) === (d.targetMonth === undefined),
    { message: 'Forneça targetYear e targetMonth juntos, ou nenhum dos dois' },
  );

export type CreateCreditCardDto = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardDto = z.infer<typeof updateCreditCardSchema>;
export type CreatePurchaseDto = z.infer<typeof createPurchaseSchema>;
export type PayInvoiceDto = z.infer<typeof payInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type AnticipateInstallmentsDto = z.infer<typeof anticipateInstallmentsSchema>;
export type AdvanceInstallmentsDto = z.infer<typeof advanceInstallmentsSchema>;
