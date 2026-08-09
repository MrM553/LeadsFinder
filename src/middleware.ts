import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

/**
 * Cheap presence-only redirect for UX. The real authorization check (full
 * HMAC signature + expiry verification) happens server-side in getSession()
 * on every protected page/route — this middleware is not the security
 * boundary, just a fast redirect.
 *
 * Deliberately using the deprecated `middleware.ts` convention (not the
 * newer `proxy.ts`) instead of Next.js 16's default: `proxy.ts` always runs
 * on the Node.js runtime with no way to opt out, and OpenNext's Cloudflare
 * adapter does not yet support Node-runtime middleware — confirmed by an
 * actual failed build during Milestone 7, not a guess. `middleware.ts` still
 * supports `runtime = "edge"`, which this needs anyway (see get-session.ts's
 * split-out constants.ts for why). Revisit when either Next.js allows Edge
 * `proxy.ts` again or OpenNext adds Node-runtime middleware support.
 */
export const runtime = "experimental-edge";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (hasSession) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// API routes are excluded — they enforce auth themselves via getSession()
// and return a proper 401 JSON response instead of an HTML redirect.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
