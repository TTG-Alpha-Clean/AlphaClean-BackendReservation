// src/config/email.ts
import nodemailer from 'nodemailer';

// Configuração do transporter do Nodemailer
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // App Password do Gmail
    },
  });
};

// Template de email para reset de senha
export const getPasswordResetEmailTemplate = (
  userName: string,
  resetLink: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - AlphaClean</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Container Principal -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">

              <!-- Header com Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #022744 0%, #034a7a 100%); padding: 40px; text-align: center;">
                  <div style="display: inline-block; background-color: #8BC34A; width: 80px; height: 80px; border-radius: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: #022744; font-size: 36px; font-weight: bold;">AC</span>
                  </div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">AlphaClean</h1>
                  <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Estética Automotiva</p>
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding: 48px 40px;">
                  <h2 style="margin: 0 0 16px 0; color: #022744; font-size: 24px; font-weight: 600;">Recuperação de Senha</h2>

                  <p style="margin: 0 0 24px 0; color: #597891; font-size: 16px; line-height: 1.6;">
                    Olá, <strong style="color: #022744;">${userName}</strong>!
                  </p>

                  <p style="margin: 0 0 24px 0; color: #597891; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir a senha da sua conta no AlphaClean.
                    Se você não fez essa solicitação, pode ignorar este email com segurança.
                  </p>

                  <p style="margin: 0 0 32px 0; color: #597891; font-size: 16px; line-height: 1.6;">
                    Para redefinir sua senha, clique no botão abaixo:
                  </p>

                  <!-- Botão -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 0 0 32px 0;">
                        <a href="${resetLink}"
                           style="display: inline-block; background: linear-gradient(135deg, #8BC34A 0%, #7CB342 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 195, 74, 0.3);">
                          Redefinir Senha
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Link alternativo -->
                  <div style="background-color: #f5f7fa; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                    <p style="margin: 0 0 8px 0; color: #597891; font-size: 14px; font-weight: 600;">
                      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="margin: 0; word-break: break-all;">
                      <a href="${resetLink}" style="color: #034a7a; font-size: 14px; text-decoration: none;">
                        ${resetLink}
                      </a>
                    </p>
                  </div>

                  <!-- Aviso de expiração -->
                  <div style="border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>⚠️ Importante:</strong> Este link expira em <strong>1 hora</strong>.
                      Após esse período, será necessário solicitar um novo link de recuperação.
                    </p>
                  </div>

                  <p style="margin: 0; color: #597891; font-size: 14px; line-height: 1.6;">
                    Se você não solicitou a recuperação de senha, recomendamos que altere sua senha
                    imediatamente por segurança.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f5f7fa; padding: 32px 40px; text-align: center; border-top: 1px solid #e6edf3;">
                  <p style="margin: 0 0 8px 0; color: #597891; font-size: 14px;">
                    Este é um email automático, por favor não responda.
                  </p>
                  <p style="margin: 0 0 16px 0; color: #597891; font-size: 14px;">
                    Dúvidas? Entre em contato conosco.
                  </p>
                  <p style="margin: 0; color: #97a6ba; font-size: 12px;">
                    © ${new Date().getFullYear()} AlphaClean - Estética Automotiva. Todos os direitos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Função para enviar email de reset de senha
export const sendPasswordResetEmail = async (
  to: string,
  userName: string,
  resetToken: string
): Promise<void> => {
  const transporter = createEmailTransporter();

  // URL do frontend (ajuste conforme necessário)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/redefinir-senha?token=${resetToken}`;

  const mailOptions = {
    from: {
      name: 'AlphaClean',
      address: process.env.EMAIL_USER!,
    },
    to,
    subject: 'Recuperação de Senha - AlphaClean',
    html: getPasswordResetEmailTemplate(userName, resetLink),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação enviado para: ${to}`);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Falha ao enviar email de recuperação');
  }
};
