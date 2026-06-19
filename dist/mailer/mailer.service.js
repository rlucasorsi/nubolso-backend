"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
const code_email_template_js_1 = require("./templates/code-email.template.js");
let MailerService = MailerService_1 = class MailerService {
    logger = new common_1.Logger(MailerService_1.name);
    resend;
    from;
    constructor() {
        const apiKey = process.env.RESEND_API_KEY;
        this.from = process.env.RESEND_FROM || 'Nubolso <no-reply@nubolso.com>';
        this.resend = apiKey ? new resend_1.Resend(apiKey) : null;
    }
    async sendVerificationCode(to, name, code) {
        const safeName = this.escapeHtml(name);
        await this.send(to, 'Confirme seu e-mail - Nubolso', (0, code_email_template_js_1.codeEmailTemplate)({
            name: safeName,
            code,
            title: 'Confirme seu e-mail',
            subtitle: 'Use o código abaixo para ativar sua conta.',
        }));
    }
    async sendPasswordResetCode(to, name, code) {
        const safeName = this.escapeHtml(name);
        await this.send(to, 'Redefinição de senha - Nubolso', (0, code_email_template_js_1.codeEmailTemplate)({
            name: safeName,
            code,
            title: 'Redefinição de senha',
            subtitle: 'Use o código abaixo para criar uma nova senha.',
            footerNote: 'Se você não solicitou essa redefinição, ignore este e-mail. Sua senha permanece a mesma.',
        }));
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    async send(to, subject, html) {
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
};
exports.MailerService = MailerService;
exports.MailerService = MailerService = MailerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailerService);
//# sourceMappingURL=mailer.service.js.map