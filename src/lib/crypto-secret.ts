import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * Server-only helpers for storing short-lived secrets at rest
 * (currently: AI provider API keys in the `ai_settings` collection).
 *
 * Design notes:
 *   - The master key is derived from `ADMIN_SESSION_SECRET` via scrypt
 *     with a fixed application salt. That gives us 256-bit AES keys
 *     without requiring admins to set up a separate KMS secret.
 *   - We use AES-256-GCM authenticated encryption. The output is a
 *     `iv:tag:ciphertext` hex blob so a single string fits in the
 *     MongoDB document and is easy to debug.
 *   - The plaintext key is NEVER returned from these helpers to any
 *     client-facing server action — callers receive only `keyMask`.
 *
 * Failure mode: if `ADMIN_SESSION_SECRET` is missing or too short, every
 * call throws synchronously. This is intentional — we'd rather break
 * the build than store plaintext keys.
 */

const SALT = "ai-settings-v1";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getMasterKey(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or too short (need >= 16 chars). " +
        "Set it in your environment — it's used to encrypt AI provider keys at rest.",
    );
  }
  // scrypt: 32-byte key, 16384 cost. Synchronous on purpose — these
  // helpers are called from server actions that already have async I/O.
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypts a plaintext string with AES-256-GCM. Returns a single string
 * of the form `iv:tag:ciphertext` (all hex). Safe to store in MongoDB.
 */
export function encryptSecret(plain: string): string {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("encryptSecret: plaintext must be a non-empty string");
  }
  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/**
 * Decrypts a blob produced by `encryptSecret`. Throws if the auth tag
 * does not validate — meaning either tampering or wrong key.
 */
export function decryptSecret(blob: string): string {
  if (typeof blob !== "string" || !blob.includes(":")) {
    throw new Error("decryptSecret: malformed ciphertext blob");
  }
  const parts = blob.split(":");
  if (parts.length !== 3) throw new Error("decryptSecret: malformed ciphertext blob");
  const ivHex = parts[0]!;
  const tagHex = parts[1]!;
  const encHex = parts[2]!;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
    throw new Error("decryptSecret: iv or tag length wrong");
  }
  const key = getMasterKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

/**
 * Returns a UI-safe preview of a secret — first 4 chars + a fixed mask.
 * Used to confirm to the admin which key is stored without revealing it.
 */
export function maskSecret(plain: string | null | undefined): string {
  if (!plain) return "";
  if (plain.length <= 4) return "••••";
  return plain.slice(0, 4) + "••••••••";
}