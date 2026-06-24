import nodemailer from 'nodemailer';
import { config } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.smtpHost && config.smtpPort) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: config.smtpUser && config.smtpPass
        ? { user: config.smtpUser, pass: config.smtpPass }
        : undefined,
    });
  }

  return transporter;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const baseUrl = config.appUrl;
  const link = `${baseUrl}/api/auth/verify?token=${token}`;

  const subject = 'Verify your email — Luminary Blog';
  const text = `Welcome to Luminary!\n\nClick this link to verify your email:\n${link}\n\nThis link expires in 24 hours.`;
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:system-ui,sans-serif;padding:24px;background:#fafafa;border-radius:12px">
      <div style="width:36px;height:36px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:18px;margin-bottom:20px">L</div>
      <h1 style="font-size:20px;margin:0 0 8px">Welcome to Luminary</h1>
      <p style="color:#555;margin:0 0 20px;line-height:1.5">Click the button below to verify your email address and start publishing.</p>
      <a href="${link}" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Verify Email</a>
      <p style="color:#999;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
    </div>
  `;

  const t = getTransporter();
  if (t) {
    await t.sendMail({ from: config.emailFrom, to, subject, text, html });
  } else {
    console.log('--- Email (no SMTP configured) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verification link: ${link}`);
    console.log('-----------------------------------');
  }
}
