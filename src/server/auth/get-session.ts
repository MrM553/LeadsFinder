import { cookies } from "next/headers";
import { verifySessionToken } from "./session";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "./constants";

export { SESSION_COOKIE_NAME };

export async function getSession(): Promise<{ username: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token, env.AUTH_SECRET);
}
