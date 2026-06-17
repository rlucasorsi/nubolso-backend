"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInvoiceSchema = exports.payInvoiceSchema = exports.createPurchaseSchema = exports.updateCreditCardSchema = exports.createCreditCardSchema = void 0;
const zod_1 = require("zod");
const isoDate = zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
const dayRange = zod_1.z.number().int().min(1).max(31);
exports.createCreditCardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome do cartão é obrigatório'),
    closingDay: dayRange,
    dueDay: dayRange,
    paymentDay: dayRange,
});
exports.updateCreditCardSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    closingDay: dayRange.optional(),
    dueDay: dayRange.optional(),
    paymentDay: dayRange.optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createPurchaseSchema = zod_1.z.object({
    cardId: zod_1.z.string().uuid('cardId inválido'),
    description: zod_1.z.string().optional(),
    totalAmount: zod_1.z.number().positive('Valor deve ser positivo'),
    installmentsCount: zod_1.z.number().int().min(1).max(48),
    purchaseDate: isoDate,
});
exports.payInvoiceSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    paymentDate: isoDate.optional(),
    remainderInstallments: zod_1.z.number().int().min(1).max(48).optional(),
    interestRate: zod_1.z.number().min(0).max(100).optional(),
    installmentAmount: zod_1.z.number().positive().optional(),
});
exports.updateInvoiceSchema = zod_1.z.object({
    paymentDate: isoDate,
});
//# sourceMappingURL=schemas.js.map