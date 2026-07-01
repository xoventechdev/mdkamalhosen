import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-signed session token for the admin area. Replaces Supabase auth after
 * the Mongo migration. Token format: `<base64url-payload>.<base64url-sig>`.
 *
 * Payload is a tiny JSON object with the admin email and an absolute
 * expiry epoch (seconds). No DB lookup is needed to verify — the signature
 * alone is the source of truth. Rotating `ADMIN_SESSION_SECRET` invalidates
 * all live sessions at once.
 */

const SECRET = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "[admin-session] ADMIN_SESSION_SECRET missing or too short (min 32 chars).",
    );
  }
  return s;
};

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

export type AdminPayload = {
  /** Admin email (allow-listed; not security-critical, just informational). */
  email: string;
  /** Absolute expiry in seconds since epoch. */
  exp: number;
};

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return b
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(pad), "base64");
}

function sign(payloadB64: string): string {
  return b64url(
    createHmac("sha256", SECRET()).update(payloadB64).digest(),
  );
}

/** Build a signed token from a payload. */
export function signSession(payload: Omit<AdminPayload, "exp">, ttlSeconds = SESSION_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const full: AdminPayload = { ...payload, exp };
  const payloadB64 = b64url(JSON.stringify(full));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a token and return its payload, or null if invalid / expired.
 * Uses timing-safe equality for the signature comparison.
 */
export function verifySession(token: string | undefined | null): AdminPayload | null {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot >= token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const expected = sign(payloadB64);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sigB64, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: AdminPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload?.email !== "string" ||
    typeof payload?.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return payload;
}

/** Cookie options aligned with what Supabase was producing. */
export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
