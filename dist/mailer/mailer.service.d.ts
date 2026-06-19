export declare class MailerService {
    private readonly logger;
    private readonly resend;
    private readonly from;
    constructor();
    sendVerificationCode(to: string, name: string, code: string): Promise<void>;
    sendPasswordResetCode(to: string, name: string, code: string): Promise<void>;
    private escapeHtml;
    private send;
}
