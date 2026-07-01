import "server-only";

/**
 * Tiny in-memory rate limiter for the admin auth endpoints
 * (login, forgot-password, reset-password). This is intentionally
 * minimal because the admin surface is single-owner; a production
 * multi-tenant deployment should swap this for a Redis-backed
 * implementation. The shape (`take(key, limit, windowMs)`) is
 * deliberately similar to common Redis rate-limit libraries so a
 * future swap is a localised change.
 *
 * Limitations (intentional, documented):
 *   - State is per-process. On a serverless / multi-instance deploy
 *     (Vercel default) each instance has its own bucket. A determined
 *     attacker could spread attempts across instances. For a single-
 *     owner admin this is acceptable; for a public-facing auth surface
 *     it would not be.
 *   - State is wiped on process restart. Fine for our use case.
 *   - No locking. Under the Node single-threaded event loop this is
 *     safe — a single `take()` call cannot interleave with itself.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets: Map<string, Bucket> = (() => {
  // Reuse the same Map across hot-reloads in dev to preserve state
  // across module reloads.
  const g = globalThis as unknown as { __adminRateLimits?: Map<string, Bucket> };
  if (!g.__adminRateLimits) g.__adminRateLimits = new Map();
  return g.__adminRateLimits;
})();

export interface RateLimitResult {
  ok: boolean;
  /** Suggested retry delay when `ok` is false. */
  retryAfterMs: number;
  /** Remaining quota in the current window. */
  remaining: number;
}

/**
 * Take one token from the bucket identified by `key`. Returns
 * `{ ok: false, retryAfterMs, remaining: 0 }` when the bucket is empty.
 */
export function take(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
      remaining: 0,
    };
  }
  bucket.count += 1;
  return {
    ok: true,
    retryAfterMs: 0,
    remaining: Math.max(0, limit - bucket.count),
  };
}

/** Reset the bucket for a given key. Used after a successful login. */
export function reset(key: string): void {
  buckets.delete(key);
}
