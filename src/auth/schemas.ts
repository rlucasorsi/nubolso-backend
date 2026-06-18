import { z } from 'zod';
import { isDisposableDomain } from './disposable-domains.js';

const emailSchema = z
  .string()
  .email('E-mail inválido')
  .transform((v) => v.toLowerCase().trim())
  .refine((v) => !isDisposableDomain(v), 'E-mail temporário não é permitido');

const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos um número');

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.toLowerCase().trim()),
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
});

export const resendCodeSchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.toLowerCase().trim()),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido').transform((v) => v.toLowerCase().trim()),
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
  newPassword: passwordSchema,
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Token é obrigatório'),
});
