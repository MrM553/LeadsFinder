import { NextResponse } from "next/server";
import { getSession } from "./get-session";

/** Every API route handler that touches lead data must call this first. */
export async function requireApiSession(): Promise<
  { session: { username: string }; response: null } | { session: null; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
