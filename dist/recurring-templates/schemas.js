"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipRecurringTemplateSchema = exports.realizeRecurringTemplateSchema = exports.updateRecurringTemplateSchema = exports.createRecurringTemplateSchema = void 0;
const zod_1 = require("zod");
const transactionType = zod_1.z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
const isoDate = zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
exports.createRecurringTemplateSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Descrição é obrigatória'),
    estimatedAmount: zod_1.z.number().positive('Valor deve ser positivo'),
    type: transactionType,
    dayOfMonth: zod_1.z.number().int().min(1).max(31),
    categoryId: zod_1.z.string().uuid().optional(),
});
exports.updateRecurringTemplateSchema = zod_1.z.object({
    description: zod_1.z.string().min(1).optional(),
    estimatedAmount: zod_1.z.number().positive().optional(),
    type: transactionType.optional(),
    dayOfMonth: zod_1.z.number().int().min(1).max(31).optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.realizeRecurringTemplateSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    date: isoDate,
    isPaid: zod_1.z.boolean().optional(),
});
exports.skipRecurringTemplateSchema = zod_1.z.object({
    date: isoDate,
});
//# sourceMappingURL=schemas.js.map