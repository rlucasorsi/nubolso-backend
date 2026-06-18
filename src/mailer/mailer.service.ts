import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter | null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    this.transporter =
      SMTP_HOST && SMTP_USER && SMTP_PASS
        ? nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
          })
        : null;
  }

  async sendVerificationCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Confirme seu e-mail - CashFlow',
      `<p>Olá, ${safeName}!</p><p>Seu código de confirmação é:</p><h2>${code}</h2><p>Esse código expira em 10 minutos.</p>`,
    );
  }

  async sendPasswordResetCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Redefinição de senha - CashFlow',
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
    if (!this.transporter) {
      this.logger.warn(`[DEV] E-mail para ${to} - ${subject}\n${html}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  }
}
