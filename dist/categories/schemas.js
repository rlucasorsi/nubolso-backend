"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const transactionType = zod_1.z.enum(['INCOME', 'EXPENSE', 'SPENDING']);
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    color: zod_1.z.string().optional(),
    type: transactionType,
});
//# sourceMappingURL=schemas.js.map