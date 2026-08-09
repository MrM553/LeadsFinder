import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionToken(username: string, secret: string): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expires}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string, secret: string): { username: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [username, expiresStr, signature] = parts;

  const expected = sign(`${username}.${expiresStr}`, secret);
  const provided = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
    return null;
  }

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return null;

  return { username };
}
