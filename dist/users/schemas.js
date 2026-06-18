"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
const isoDate = zod_1.z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Data inválida' });
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    currentBalance: zod_1.z.number().optional(),
    balanceStartDate: isoDate.optional(),
    greenThreshold: zod_1.z.number().min(0).optional(),
    yellowThreshold: zod_1.z.number().min(0).optional(),
});
//# sourceMappingURL=schemas.js.map