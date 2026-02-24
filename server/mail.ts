import nodemailer from "nodemailer";
import { storage } from "./storage";

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const config = await storage.getMailConfig();

  if (!config.smtpHost || !config.smtpFrom) {
    console.error("Mail server not configured");
    return false;
  }

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: config.smtpUser
      ? { user: config.smtpUser, pass: config.smtpPassword }
      : undefined,
  });

  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: toEmail,
      subject: "ContaEdu - Recuperación de contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">ContaEdu</h2>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            Este enlace expirará en 2 horas. Si no solicitaste este cambio, ignora este mensaje.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">ContaEdu - Simulador Contable Educativo</p>
        </div>
      `,
    });
    return true;
  } catch (err: any) {
    console.error("Error sending email:", err.message);
    return false;
  }
}
