import nodemailer, { type Transporter } from "nodemailer";

/**
 * Provider-agnostic mailer.
 *
 * Configure via environment variables (works with Gmail, Resend, SendGrid,
 * Mailgun, Postmark, or any SMTP server):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_SECURE   ("true" for port 465, otherwise STARTTLS)
 *   SMTP_FROM     (e.g. "UniShare <no-reply@unishare.app>")
 *
 * If SMTP is not configured, emails are logged to the console (with the link)
 * so the flow is fully usable in development without an email account.
 */

let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[mailer] SMTP not configured — emails will be logged to the console. " +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASS to send real email.",
    );
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });
  console.log(`[mailer] SMTP ready via ${host}:${port}`);
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(msg: MailMessage): Promise<void> {
  const from =
    process.env.SMTP_FROM || "UniShare <no-reply@unishare.local>";
  const tx = getTransporter();

  if (!tx) {
    // Dev fallback: surface the message (and any link) in the server log.
    console.log(
      `\n──────── ✉️  EMAIL (dev fallback, not actually sent) ────────\n` +
        `To:      ${msg.to}\n` +
        `Subject: ${msg.subject}\n` +
        `${msg.text || msg.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n` +
        `────────────────────────────────────────────────────────────\n`,
    );
    return;
  }

  await tx.sendMail({ from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text });
  console.log(`[mailer] Sent "${msg.subject}" to ${msg.to}`);
}

export function buildPasswordResetEmail(name: string, link: string): MailMessage {
  const safeName = name || "there";
  return {
    to: "",
    subject: "Reset your UniShare password",
    text:
      `Hi ${safeName},\n\n` +
      `We received a request to reset your UniShare password. ` +
      `Open the link below to choose a new one (it expires in 1 hour):\n\n${link}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
          <div style="width:32px;height:32px;border-radius:8px;background:#4f46e5;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:bold">U</div>
          <span style="font-size:18px;font-weight:bold">UniShare</span>
        </div>
        <h1 style="font-size:20px;margin:0 0 12px">Reset your password</h1>
        <p style="font-size:14px;line-height:1.6;color:#4b5563">Hi ${safeName}, we received a request to reset your UniShare password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
        <a href="${link}" style="display:inline-block;margin:20px 0;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">Reset password</a>
        <p style="font-size:12px;line-height:1.6;color:#9ca3af">Or paste this link into your browser:<br/><span style="color:#4f46e5;word-break:break-all">${link}</span></p>
        <p style="font-size:12px;line-height:1.6;color:#9ca3af;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
  };
}
