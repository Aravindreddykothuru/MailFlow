import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendOptions {
  etherealUser: string;
  etherealPass: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  messageId: string;
  previewUrl?: string;
  isRealDelivery: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Sends an email using either configured real SMTP (Gmail, Resend, SendGrid, Amazon SES)
 * or falls back to Ethereal SMTP test account with browser preview URL.
 */
export async function sendViaEthereal(options: SendOptions): Promise<SendResult> {
  const { etherealUser, etherealPass, from, to, subject, html } = options;

  // 1. If RESEND_API_KEY is configured, dispatch via HTTPS REST API (Port 443 — never blocked on cloud)
  if (config.RESEND_API_KEY) {
    const fromAddress = config.SMTP_FROM_EMAIL
      ? `"${config.SMTP_FROM_NAME}" <${config.SMTP_FROM_EMAIL}>`
      : `MailFlow <onboarding@resend.dev>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
      }),
    });

    const data = (await res.json()) as { id?: string; error?: { message?: string; name?: string } };
    if (!res.ok || data.error) {
      throw new Error(`Resend API delivery error: ${data.error?.message || res.statusText}`);
    }

    logger.info(
      { to, subject, messageId: data.id, deliveryType: 'RESEND_HTTPS_API' },
      'Real email dispatched successfully via Resend HTTPS API',
    );

    return {
      messageId: data.id || `resend_${Date.now()}`,
      isRealDelivery: true,
    };
  }

  // 2. If SMTP is configured, dispatch via Nodemailer SMTP
  const isRealSmtp = Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
  const isGmail = config.SMTP_HOST.toLowerCase().includes('gmail');
  const isSecure = config.SMTP_PORT === 465 || config.SMTP_SECURE === true;

  let transporter: nodemailer.Transporter;

  if (isRealSmtp) {
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: isSecure,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    }
  } else {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealUser,
        pass: etherealPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  const fromAddress = isRealSmtp && config.SMTP_FROM_EMAIL
    ? `"${config.SMTP_FROM_NAME}" <${config.SMTP_FROM_EMAIL}>`
    : from;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ''), // Plain-text fallback stripped of tags
  });

  const rawPreviewUrl = nodemailer.getTestMessageUrl(info);
  const previewUrl = rawPreviewUrl ? String(rawPreviewUrl) : undefined;

  logger.info(
    {
      to,
      subject,
      messageId: info.messageId,
      deliveryType: isRealSmtp ? 'REAL_SMTP' : 'ETHEREAL_TEST',
      ...(previewUrl ? { previewUrl } : {}),
    },
    isRealSmtp ? 'Real email dispatched successfully' : 'Email sent via Ethereal test inbox',
  );

  return {
    messageId: info.messageId,
    previewUrl,
    isRealDelivery: isRealSmtp,
  };
}


// ─── Account provisioning ─────────────────────────────────────────────────────

export interface EtherealAccount {
  user: string;
  pass: string;
  /** The "From" address to use in outbound emails. */
  fromEmail: string;
  fromName: string;
}

/**
 * Creates a new Ethereal test account.
 * Called once when a new User logs in and has no Sender row yet.
 * The returned credentials are stored in the Sender row for reuse.
 */
export async function createEtherealAccount(
  displayName: string,
): Promise<EtherealAccount> {
  const account = await nodemailer.createTestAccount();

  logger.info(
    { user: account.user, displayName },
    'Ethereal test account created',
  );

  return {
    user: account.user,
    pass: account.pass,
    fromEmail: account.user,
    fromName: displayName,
  };
}
