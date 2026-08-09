import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { verifyPassword } from "@/server/auth/password";
import { createSessionToken } from "@/server/auth/session";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";
import { rateLimitOrResponse } from "@/server/rate-limit/api-rate-limit";

const loginSchema = z.object({
  // Capped length: this value becomes part of an in-memory rate-limit key,
  // so an unbounded string is a trivial way to grow that map.
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
});

// Brute-force protection: this is the one endpoint an attacker can hit
// without already having a session.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 5 * 60_000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const limited = rateLimitOrResponse(`login:${username}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (limited) return limited;

  // Compare username with a fixed-time-ish check; the real protection here
  // is the scrypt+timingSafeEqual password check below.
  const usernameOk = username === env.DASHBOARD_USERNAME;
  const passwordOk = verifyPassword(password, env.DASHBOARD_PASSWORD_HASH);

  if (!usernameOk || !passwordOk) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const token = createSessionToken(username, env.AUTH_SECRET);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
