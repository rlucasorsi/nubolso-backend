"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const goalContributionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    amount: zod_1.z.number(),
    date: zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' }),
    description: zod_1.z.string().min(1),
});
//# sourceMappingURL=goal-contribution.dto.js.map