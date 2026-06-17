"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryTransactionSchema = exports.updateTransactionSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
const transactionType = zod_1.z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
const isoDate = zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
exports.createTransactionSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    type: transactionType,
    date: isoDate,
    isPaid: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid('categoryId inválido').optional(),
});
exports.updateTransactionSchema = zod_1.z.object({
    description: zod_1.z.string().min(1).optional(),
    amount: zod_1.z.number().positive().optional(),
    type: transactionType.optional(),
    date: isoDate.optional(),
    isPaid: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid().optional(),
});
exports.queryTransactionSchema = zod_1.z.object({
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    type: transactionType.optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    isPaid: zod_1.z
        .preprocess((val) => {
        if (val === 'true')
            return true;
        if (val === 'false')
            return false;
        return val;
    }, zod_1.z.boolean())
        .optional(),
});
//# sourceMappingURL=schemas.js.map