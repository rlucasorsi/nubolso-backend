"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listContributionsQuerySchema = exports.createContributionSchema = exports.updateGoalSchema = exports.createGoalSchema = void 0;
const zod_1 = require("zod");
const isoDate = zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
const goalContributionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    amount: zod_1.z.number(),
    date: isoDate,
    description: zod_1.z.string().min(1),
});
exports.createGoalSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().min(1, 'Ícone é obrigatório'),
    color: zod_1.z.string().optional(),
    targetAmount: zod_1.z.number().positive('Valor deve ser positivo'),
    savedAmount: zod_1.z.number().min(0).optional(),
    deadline: isoDate,
});
exports.updateGoalSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    targetAmount: zod_1.z.number().positive().optional(),
    savedAmount: zod_1.z.number().min(0).optional(),
    deadline: isoDate.optional(),
    contributions: zod_1.z.array(goalContributionSchema).optional(),
});
exports.createContributionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    description: zod_1.z.string().optional(),
    date: isoDate.optional(),
});
exports.listContributionsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(5).optional(),
});
//# sourceMappingURL=schemas.js.map