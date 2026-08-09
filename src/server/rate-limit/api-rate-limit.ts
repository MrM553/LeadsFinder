import { NextResponse } from "next/server";
import { checkRateLimit } from "./limiter";

/** Returns a 429 response if the key is over its limit, otherwise null (caller proceeds). */
export function rateLimitOrResponse(key: string, limit: number, windowMs: number): NextResponse | null {
  const result = checkRateLimit(key, limit, windowMs);
  if (result.allowed) return null;

  const retryAfterSeconds = Math.ceil((result.retryAfterMs ?? 0) / 1000);
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
