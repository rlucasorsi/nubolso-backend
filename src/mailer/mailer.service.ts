import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { codeEmailTemplate } from './templates/code-email.template.js';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  private readonly logoUrl: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM || 'Nubolso <no-reply@nubolso.com>';
    this.resend = apiKey ? new Resend(apiKey) : null;
    const appUrl = process.env.APP_URL;
    this.logoUrl = appUrl ? `${appUrl}/public/logo.svg` : undefined;
  }

  async sendVerificationCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Confirme seu e-mail - Nubolso',
      codeEmailTemplate({
        name: safeName,
        code,
        title: 'Confirme seu e-mail',
        subtitle: 'Use o código abaixo para ativar sua conta.',
        logoUrl: this.logoUrl,
      }),
    );
  }

  async sendSupportRequest(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const to =
      process.env.SUPPORT_EMAIL || this.from.replace(/^.*<(.+)>$/, '$1');
    const safeName = this.escapeHtml(data.name);
    const safeEmail = this.escapeHtml(data.email);
    const safeSubject = this.escapeHtml(data.subject);
    const safeMessage = this.escapeHtml(data.message).replace(/\n/g, '<br>');

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a1a1a">Nova mensagem de suporte</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;font-weight:bold;width:100px">Nome:</td><td>${safeName}</td></tr>
          <tr><td style="padding:8px 0;font-weight:bold">E-mail:</td><td>${safeEmail}</td></tr>
          <tr><td style="padding:8px 0;font-weight:bold">Assunto:</td><td>${safeSubject}</td></tr>
        </table>
        <hr style="margin:16px 0">
        <p style="white-space:pre-wrap">${safeMessage}</p>
      </div>`;

    await this.send(to, `[Suporte] ${data.subject}`, html);
  }

  async sendPasswordResetCode(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const safeName = this.escapeHtml(name);
    await this.send(
      to,
      'Redefinição de senha - Nubolso',
      codeEmailTemplate({
        name: safeName,
        code,
        title: 'Redefinição de senha',
        subtitle: 'Use o código abaixo para criar uma nova senha.',
        footerNote:
          'Se você não solicitou essa redefinição, ignore este e-mail. Sua senha permanece a mesma.',
        logoUrl: this.logoUrl,
      }),
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
