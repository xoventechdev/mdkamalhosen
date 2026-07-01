/**
 * HMAC-signed session token for the admin area. Token format:
 * `<base64url-payload>.<base64url-sig>`.
 *
 * The payload carries the admin's `userId` and the `sessionVersion`
 * that was current at sign time. `requireAdmin()` re-reads the user
 * from MongoDB on every request and rejects cookies whose
 * `sessionVersion` no longer matches — this is the "log out everywhere"
 * lever. Bumping `sessionVersion` invalidates every live session for
 * that admin in one shot.
 *
 * The signature is the only thing standing between an attacker and a
 * forged cookie. Rotating `ADMIN_SESSION_SECRET` invalidates every
 * session in one shot (a more aggressive but coarser lever than
 * bumping a single user's `sessionVersion`).
 *
 * Runtime note: this module is imported from `src/middleware.ts`,
 * which Next.js runs on the Edge runtime. Edge does NOT expose
 * `require("node:crypto")`, so we use the Web Crypto API
 * (`globalThis.crypto.subtle.sign("HMAC", …)`) which is available in
 * both Node 20+ and Edge. The sign/verify paths are async because
 * `subtle.sign` returns a Promise.
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
  /** Admin user id (MongoDB ObjectId hex string). */
  userId: string;
  /** Admin email (informational; the DB row is the source of truth). */
  email: string;
  /** Session version captured at sign time. */
  sessionVersion: number;
  /** Absolute expiry in seconds since epoch. */
  exp: number;
};

// -----------------------------------------------------------------------
// Base64url helpers — pure JS, no runtime dependency.
// -----------------------------------------------------------------------
function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] as number;
    bin += String.fromCharCode(b);
  }
  return btoa(bin).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlEncodeString(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
}

function b64urlDecodeToString(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const bin = atob(padded + "=".repeat(pad));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i) as number;
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Returns true if the runtime has `globalThis.crypto.subtle`.
 * Both the Edge runtime and Node 20+ have it; if it ever vanishes,
 * we'd rather fail loud than silently fall back to an unsigned token.
 */
function subtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) {
    throw new Error(
      "[admin-session] Web Crypto subtle API is unavailable in this runtime.",
    );
  }
  return c.subtle;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return subtle().importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Timing-safe equality over two base64url strings of equal length. */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ (b.charCodeAt(i) as number);
  }
  return mismatch === 0;
}

/**
 * Build a signed token. The caller is responsible for providing the
 * current `sessionVersion` from the AdminUser document.
 *
 * Async because HMAC via Web Crypto returns a Promise.
 */
export async function signSession(
  payload: Pick<AdminPayload, "userId" | "email" | "sessionVersion">,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const full: AdminPayload = { ...payload, exp };
  const payloadB64 = b64urlEncodeString(JSON.stringify(full));

  const key = await importHmacKey(SECRET());
  const sigBuf = await subtle().sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = b64urlEncode(sigBuf);

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a token and return its payload, or null if invalid / expired.
 * Uses timing-safe equality for the signature comparison. Does NOT
 * consult the database; callers (requireAdmin / middleware) must
 * cross-check `sessionVersion` against the user row.
 */
export async function verifySession(
  token: string | undefined | null,
): Promise<AdminPayload | null> {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot >= token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let expected = "";
  try {
    const key = await importHmacKey(SECRET());
    const sigBuf = await subtle().sign("HMAC", key, new TextEncoder().encode(payloadB64));
    expected = b64urlEncode(sigBuf);
  } catch {
    return null;
  }

  if (!timingSafeEqualString(expected, sigB64)) return null;

  let payload: AdminPayload;
  try {
    payload = JSON.parse(b64urlDecodeToString(payloadB64));
  } catch {
    return null;
  }

  if (
    typeof payload?.userId !== "string" ||
    typeof payload?.email !== "string" ||
    typeof payload?.sessionVersion !== "number" ||
    typeof payload?.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return payload;
}

/** Cookie options. */
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
export const SESSION_TTL = SESSION_TTL_SECONDS;
