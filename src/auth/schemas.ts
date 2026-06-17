import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
});

export const resendCodeSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
  code: z.string().length(6, 'Código deve ter 6 caracteres'),
  newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Token é obrigatório'),
});
