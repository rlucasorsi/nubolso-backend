interface CodeEmailOptions {
  name: string;
  code: string;
  title: string;
  subtitle: string;
  expiresInMinutes?: number;
  footerNote?: string;
}

export function codeEmailTemplate({
  name,
  code,
  title,
  subtitle,
  expiresInMinutes = 10,
  footerNote,
}: CodeEmailOptions): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:26px;font-weight:700;color:#18181b;letter-spacing:-0.5px;">nubolso</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

              <!-- Title -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">${title}</p>
              <p style="margin:0 0 32px;font-size:15px;color:#71717a;">Olá, ${name}! ${subtitle}</p>

              <!-- Code block -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#f4f4f5;border-radius:12px;padding:24px 16px;">
                    <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#18181b;font-variant-numeric:tabular-nums;">${code}</span>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;text-align:center;">
                Este código expira em <strong style="color:#71717a;">${expiresInMinutes} minutos</strong>.
              </p>

              ${footerNote ? `
              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr><td style="border-top:1px solid #f4f4f5;"></td></tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;color:#a1a1aa;">${footerNote}</p>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                © ${new Date().getFullYear()} Nubolso. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
