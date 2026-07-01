import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { connect, AdminUserModel, PasswordResetTokenModel } from "@/lib/db";
import { sendEmail, isSmtpConfigured } from "@/lib/mail";
import { take } from "@/lib/auth-rate-limit";

export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

const TOKEN_TTL_MS = 60 * 60_000; // 1 hour
const EMAIL_RATE_LIMIT = 3;
const IP_RATE_LIMIT = 10;
const WINDOW_MS = 15 * 60_000;

/**
 * POST /api/admin/forgot-password
 *
 * Body: { email }
 *
 * Always returns `{ ok: true }` (with the same response time
 * envelope) regardless of whether the email matches an admin. This
 * prevents account enumeration. If the address is a real, active
 * admin, we generate a token, persist its hash, and email the link.
 *
 * Rate limit: 3 per email / 15 min and 10 per IP / 15 min.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    // Malformed input — pretend it succeeded to avoid leaking
    // validation behaviour.
    return NextResponse.json({ ok: true });
  }
  const { email } = parsed.data;

  const ip = readClientIp(request);
  const rlEmail = take(`forgot:${email}`, EMAIL_RATE_LIMIT, WINDOW_MS);
  const rlIp = ip
    ? take(`forgot-ip:${ip}`, IP_RATE_LIMIT, WINDOW_MS)
    : { ok: true, retryAfterMs: 0, remaining: IP_RATE_LIMIT };
  if (!rlEmail.ok || !rlIp.ok) {
    return NextResponse.json({ ok: true });
  }

  // If SMTP is not configured, we cannot send the email — log a hint
  // for the operator and return ok. This is the documented
  // degradation: forgot-password is only useful when SMTP works.
  if (!isSmtpConfigured()) {
    console.warn(
      "[forgot-password] SMTP not configured; cannot deliver reset link.",
    );
    return NextResponse.json({ ok: true });
  }

  await connect();
  const user = await AdminUserModel.findOne({ email, isActive: true }).lean();
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Generate a 32-byte random token. The plaintext goes in the email;
  // only its sha256 hash is stored.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  await PasswordResetTokenModel.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    usedAt: null,
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (request.nextUrl.origin || "http://localhost:3000");
  const link = `${siteUrl.replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(token)}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your admin password",
      text: `A password reset was requested for ${user.email}.\n\nIf you made this request, open the link below within the next hour to set a new password:\n\n${link}\n\nIf you did not make this request, you can safely ignore this email.`,
      html: renderResetEmail({ link, email: user.email }),
    });
  } catch (err) {
    // Swallow SMTP errors so the response is indistinguishable from
    // the "unknown address" case. The operator will see the error in
    // server logs.
    console.error("[forgot-password] failed to send email", err);
  }

  return NextResponse.json({ ok: true });
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function readClientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return null;
}

function renderResetEmail({ link, email }: { link: string; email: string }): string {
  // Keep the HTML inline and self-contained — no external assets, no
  // remote stylesheets. The recipient may be reading it in a mail
  // client with restricted CSS.
  return `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f6f6f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;">
    <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:600;">Reset your password</h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.5;color:#444;">
      A password reset was requested for <strong>${escapeHtml(email)}</strong>.
    </p>
    <p style="margin:0 0 24px 0;font-size:14px;line-height:1.5;color:#444;">
      Click the button below within the next hour to set a new password.
    </p>
    <p style="margin:0 0 24px 0;">
      <a href="${escapeAttr(link)}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500;">
        Reset password
      </a>
    </p>
    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#666;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 24px 0;font-size:12px;line-height:1.5;color:#1c1c1c;word-break:break-all;">
      ${escapeHtml(link)}
    </p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#666;">
      If you did not make this request, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
