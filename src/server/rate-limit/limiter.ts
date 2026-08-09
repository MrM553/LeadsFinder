/**
 * Simple in-memory fixed-window rate limiter. Good enough for a low-traffic,
 * single-instance/single-user internal tool — not a distributed limiter.
 * (On Cloudflare Workers this resets per isolate; revisit with a Durable
 * Object or KV-backed limiter if this ever needs to be airtight under
 * multiple concurrent isolates.)
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Test-only: clears all buckets. */
export function _resetRateLimitsForTests(): void {
  buckets.clear();
}
