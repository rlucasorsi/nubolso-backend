import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM || 'Nubolso <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendVerificationCode(to: string, name: string, code: string): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Confirme seu e-mail - Nubolso',
      `<p>Olá, ${safeName}!</p><p>Seu código de confirmação é:</p><h2>${code}</h2><p>Esse código expira em 10 minutos.</p>`,
    );
  }

  async sendPasswordResetCode(to: string, name: string, code: string): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Redefinição de senha - Nubolso',
      `<p>Olá, ${safeName}!</p><p>Use o código abaixo para redefinir sua senha:</p><h2>${code}</h2><p>Esse código expira em 10 minutos. Se você não solicitou essa redefinição, ignore este e-mail.</p>`,
    );
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[DEV] E-mail para ${to} - ${subject}\n${html}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${error.message}`);
      throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }
  }
}
