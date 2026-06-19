interface CodeEmailOptions {
  name: string;
  code: string;
  title: string;
  subtitle: string;
  expiresInMinutes?: number;
  footerNote?: string;
  logoUrl?: string;
}

const LOGO_BASE64 = 'PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHZlcnNpb249IjEuMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogd2lkdGg9IjE3NCIgaGVpZ2h0PSIxMTYiIHZpZXdCb3g9IjI1MSA4NCAxNzQgMTE2IgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+CjxkZWZzPgogIDxsaW5lYXJHcmFkaWVudCBpZD0ibWFpbkdyYWQiIHgxPSIyNTAwIiB5MT0iMCIgeDI9IjQyNTAiIHkyPSIwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjOTMzM0VBIi8+CiAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM0RjQ2RTUiLz4KICA8L2xpbmVhckdyYWRpZW50PgogIDxsaW5lYXJHcmFkaWVudCBpZD0ic2hhZG93R3JhZCIgeDE9IjI1MDAiIHkxPSIwIiB4Mj0iNDI1MCIgeTI9IjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2RDI4RDkiLz4KICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzM3MzBBMyIvPgogIDwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KCjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUuMDAwMDAwLDM3NC4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9InVybCgjc2hhZG93R3JhZCkiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0zNDI1IDI4MDIgYy00NyAtMTcgLTgzIC00MyAtMTExIC04MyAtMjkgLTQyIC0yOSAtNDMgLTMyIC0yMDggLTIKLTkxIC03IC0xNjkgLTExIC0xNzQgLTYgLTYgLTMyMiAzMTQgLTM3NCAzODAgLTM4IDQ4IC0xMDYgODMgLTE2MSA4MyAtNTcgMAotMTEwIC0yNiAtMTI3IC02MyAtNSAtMTIgLTE3IC0zNCAtMjUgLTQ5IC0xMiAtMjMgLTE2IC0xMDIgLTIwIC00NDMgLTQgLTIyOQotMyAtNDM2IDEgLTQ2MSBsNiAtNDQgMTY1IDAgMTY0IDAgMCAyMjQgYzAgMTU5IDMgMjI3IDExIDIzMiA3IDQgMzggLTIxIDc3Ci02MiAxNzkgLTE4OCAzNTAgLTM1OCAzNzcgLTM3MiAyNiAtMTUgNjkgLTE3IDMyNSAtMTcgMjkyIDAgMjk1IDAgMzQ1IDI0IDExMgo1NiAxNjkgMTQ0IDE2OSAyNjEgMCA4NCAtMjggMTQ4IC05NSAyMTYgbC01MSA1MSAzMSAzNSBjMTI1IDE0MyA3OCAzNTkgLTk3CjQ0NSBsLTU3IDI4IC0yNDUgMiBjLTEzNSAxIC0yNTQgLTEgLTI2NSAtNXogbS02NDcgLTk2IGMxNSAtOCA1MiAtNDAgODIgLTczCjMwIC0zMiAxMzMgLTE0MSAyMzAgLTI0MyA5NyAtMTAyIDE5NiAtMjA2IDIxOSAtMjMyIDI0IC0yNyA0NyAtNDggNTIgLTQ4IDUgMAo5IDExOSA5IDI2NSAwIDI5MiAzIDMxMiA1OCAzMzQgMTYgNyA0NSAxMSA2MyA5IGwzNCAtMyAzIC00MDUgYzIgLTM4OCAxIC00MDYKLTE4IC00MzcgLTIxIC0zNiAtNTUgLTQ5IC05NyAtMzkgLTI3IDcgLTEyNyAxMDUgLTM3NSAzNjggLTU2IDU5IC0xMDYgMTA1Ci0xMTEgMTAxIC02IC0zIC03IC0yIC00IDQgMyA1IC0yMSAzNiAtNTMgNjggbC02MCA1OSAtMiAtMjk5IC0zIC0zMDAgLTUzIC04CmMtMzAgLTUgLTY0IC02IC03OCAtMyBsLTI0IDYgMCA0MDYgYzAgMzQwIDIgNDEwIDE1IDQzNCAyNiA0OSA2NCA2MiAxMTMgMzZ6Cm0xMTk5IC0xOSBjNTggLTQwIDg4IC05OCA4OCAtMTc0IDAgLTUyIC00IC02OCAtMzAgLTEwNCAtNTQgLTc2IC03NyAtODQgLTI1NQotODQgbC0xNTUgMCAtMyAxODUgYy0xIDEwMSAwIDE5MSAzIDE5OCA0IDExIDM0IDEzIDE1OCAxMSAxNDkgLTQgMTU1IC01IDE5NAotMzJ6IG0tMTUxIC00NTcgYzE3MCAwIDE4NSAtNSAyNDggLTgzIDU4IC03MiA0NiAtMTk4IC0yNiAtMjY0IC00OCAtNDUgLTg3Ci01MyAtMjU1IC01MyAtODcgMCAtMTY0IDQgLTE3MiA5IC04IDYgLTExIDE2IC02IDMxIDQgMTMgNyA5MyA3IDE3OSAtMSAxODAgMQoxOTUgMzEgMTg3IDEyIC0zIDkwIC02IDE3MyAtNnoiLz4KPC9nPgoKPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsMzY5LjAwMDAwMCkgc2NhbGUoMC4xMDAwMDAsLTAuMTAwMDAwKSIKZmlsbD0idXJsKCNtYWluR3JhZCkiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0zNDI1IDI4MDIgYy00NyAtMTcgLTgzIC00MyAtMTExIC04MyAtMjkgLTQyIC0yOSAtNDMgLTMyIC0yMDggLTIKLTkxIC03IC0xNjkgLTExIC0xNzQgLTYgLTYgLTMyMiAzMTQgLTM3NCAzODAgLTM4IDQ4IC0xMDYgODMgLTE2MSA4MyAtNTcgMAotMTEwIC0yNiAtMTI3IC02MyAtNSAtMTIgLTE3IC0zNCAtMjUgLTQ5IC0xMiAtMjMgLTE2IC0xMDIgLTIwIC00NDMgLTQgLTIyOQotMyAtNDM2IDEgLTQ2MSBsNiAtNDQgMTY1IDAgMTY0IDAgMCAyMjQgYzAgMTU5IDMgMjI3IDExIDIzMiA3IDQgMzggLTIxIDc3Ci02MiAxNzkgLTE4OCAzNTAgLTM1OCAzNzcgLTM3MiAyNiAtMTUgNjkgLTE3IDMyNSAtMTcgMjkyIDAgMjk1IDAgMzQ1IDI0IDExMgo1NiAxNjkgMTQ0IDE2OSAyNjEgMCA4NCAtMjggMTQ4IC05NSAyMTYgbC01MSA1MSAzMSAzNSBjMTI1IDE0MyA3OCAzNTkgLTk3CjQ0NSBsLTU3IDI4IC0yNDUgMiBjLTEzNSAxIC0yNTQgLTEgLTI2NSAtNXogbS02NDcgLTk2IGMxNSAtOCA1MiAtNDAgODIgLTczCjMwIC0zMiAxMzMgLTE0MSAyMzAgLTI0MyA5NyAtMTAyIDE5NiAtMjA2IDIxOSAtMjMyIDI0IC0yNyA0NyAtNDggNTIgLTQ4IDUgMAo5IDExOSA5IDI2NSAwIDI5MiAzIDMxMiA1OCAzMzQgMTYgNyA0NSAxMSA2MyA5IGwzNCAtMyAzIC00MDUgYzIgLTM4OCAxIC00MDYKLTE4IC00MzcgLTIxIC0zNiAtNTUgLTQ5IC05NyAtMzkgLTI3IDcgLTEyNyAxMDUgLTM3NSAzNjggLTU2IDU5IC0xMDYgMTA1Ci0xMTEgMTAxIC02IC0zIC03IC0yIC00IDQgMyA1IC0yMSAzNiAtNTMgNjggbC02MCA1OSAtMiAtMjk5IC0zIC0zMDAgLTUzIC04CmMtMzAgLTUgLTY0IC02IC03OCAtMyBsLTI0IDYgMCA0MDYgYzAgMzQwIDIgNDEwIDE1IDQzNCAyNiA0OSA2NCA2MiAxMTMgMzZ6Cm0xMTk5IC0xOSBjNTggLTQwIDg4IC05OCA4OCAtMTc0IDAgLTUyIC00IC02OCAtMzAgLTEwNCAtNTQgLTc2IC03NyAtODQgLTI1NQotODQgbC0xNTUgMCAtMyAxODUgYy0xIDEwMSAwIDE5MSAzIDE5OCA0IDExIDM0IDEzIDE1OCAxMSAxNDkgLTQgMTU1IC01IDE5NAotMzJ6IG0tMTUxIC00NTcgYzE3MCAwIDE4NSAtNSAyNDggLTgzIDU4IC03MiA0NiAtMTk4IC0yNiAtMjY0IC00OCAtNDUgLTg3Ci01MyAtMjU1IC01MyAtODcgMCAtMTY0IDQgLTE3MiA5IC04IDYgLTExIDE2IC02IDMxIDQgMTMgNyA5MyA3IDE3OSAtMSAxODAgMQoxOTUgMzEgMTg3IDEyIC0zIDkwIC02IDE3MyAtNnoiLz4KPC9nPgo8L3N2Zz4K';

export function codeEmailTemplate({
  name,
  code,
  title,
  subtitle,
  expiresInMinutes = 10,
  footerNote,
  logoUrl,
}: CodeEmailOptions): string {
  const logoSrc = logoUrl ?? `data:image/svg+xml;base64,${LOGO_BASE64}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#09090b;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <img src="${logoSrc}" width="80" height="53" alt="Nubolso" style="display:block;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1c1a24;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

              <!-- Purple gradient accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:linear-gradient(135deg,#9d7cff,#7c3aed);height:3px;line-height:3px;font-size:3px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card content -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 40px 36px;">
                <tr>
                  <td>

                    <!-- Title -->
                    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#f8fafc;line-height:1.3;">${title}</p>
                    <p style="margin:0 0 36px;font-size:15px;color:#a78bfa;line-height:1.5;">Olá, ${name}! ${subtitle}</p>

                    <!-- Code block -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center" style="background-color:#14121b;border-radius:12px;padding:28px 16px;border:1px solid rgba(157,124,255,0.25);">
                          <span style="font-size:42px;font-weight:700;letter-spacing:14px;color:#9d7cff;font-variant-numeric:tabular-nums;display:inline-block;padding-left:14px;">${code}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry notice -->
                    <p style="margin:20px 0 0;font-size:13px;color:#71717a;text-align:center;line-height:1.5;">
                      Este código expira em <span style="color:#a78bfa;font-weight:500;">${expiresInMinutes} minutos</span>.
                    </p>

                    ${footerNote ? `
                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.08);height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:20px 0 0;font-size:12px;color:#52525b;line-height:1.5;">${footerNote}</p>
                    ` : ''}

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#3f3f46;line-height:1.5;">
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