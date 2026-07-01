import "server-only";
import nodemailer, { type SendMailOptions } from "nodemailer";

/**
 * Transactional email helper. The project had no general-purpose
 * `sendEmail` until now — the contact form's SMTP code is currently
 * only used by the admin "smoke test" route (see
 * src/app/api/admin/smtp-test/route.ts). This module centralises the
 * transport setup so password-reset and any future transactional email
 * (login notifications, security alerts) reuse the same configuration.
 *
 * Configuration (env):
 *   SMTP_HOST        — required to send
 *   SMTP_PORT        — default "587"
 *   SMTP_USER        — required to send
 *   SMTP_PASSWORD    — required to send
 *   SMTP_FROM        — required; e.g. "Portfolio <noreply@kamalhosen.dev>"
 *
 * Behaviour:
 *   - The transport is created lazily and cached on `globalThis` to
 *     avoid re-handshaking TLS on every send (a common perf trap with
 *     nodemailer in long-lived server runtimes).
 *   - `sendEmail` returns `{ messageId }` on success and throws on
 *     failure. Callers decide whether to swallow (forgot-password,
 *     where we want to avoid leaking whether the address exists) or
 *     surface (smoke-test) the error.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  messageId: string;
}

type CachedTransport = {
  host: string;
  port: number;
  user: string;
  transport: nodemailer.Transporter;
};

const cache: { current?: CachedTransport } = {};

/**
 * Whether SMTP appears fully configured. The smoke-test route uses this
 * to return a friendly "not configured" message without a stack trace.
 */
export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM,
  );
}

function getTransport(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) {
    throw new Error(
      "[mail] SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD).",
    );
  }
  const port = Number(process.env.SMTP_PORT ?? "587");

  // Reuse the cached transport when the env hasn't changed. This avoids
  // re-opening the SMTP connection on every transactional email.
  if (
    cache.current &&
    cache.current.host === host &&
    cache.current.port === port &&
    cache.current.user === user
  ) {
    return cache.current.transport;
  }
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  cache.current = { host, port, user, transport };
  return transport;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = process.env.SMTP_FROM;
  if (!from) {
    throw new Error("[mail] SMTP_FROM is not set.");
  }
  const transport = getTransport();
  const opts: SendMailOptions = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  };
  const info = await transport.sendMail(opts);
  return { messageId: info.messageId };
}
