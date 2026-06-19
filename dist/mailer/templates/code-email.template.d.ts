interface CodeEmailOptions {
    name: string;
    code: string;
    title: string;
    subtitle: string;
    expiresInMinutes?: number;
    footerNote?: string;
}
export declare function codeEmailTemplate({ name, code, title, subtitle, expiresInMinutes, footerNote, }: CodeEmailOptions): string;
export {};
