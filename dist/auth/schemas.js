"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendCodeSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    email: zod_1.z.string().email('E-mail inválido'),
    password: passwordSchema,
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    password: zod_1.z.string().min(1, 'Senha é obrigatória'),
});
exports.verifyEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    code: zod_1.z.string().length(6, 'Código deve ter 6 caracteres'),
});
exports.resendCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('E-mail inválido'),
    code: zod_1.z.string().length(6, 'Código deve ter 6 caracteres'),
    newPassword: passwordSchema,
});
exports.googleAuthSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1, 'Token é obrigatório'),
});
//# sourceMappingURL=schemas.js.map