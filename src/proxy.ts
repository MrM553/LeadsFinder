import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";

/**
 * Cheap presence-only redirect for UX. The real authorization check (full
 * HMAC signature + expiry verification) happens server-side in getSession()
 * on every protected page/route — this proxy is not the security boundary,
 * just a fast redirect.
 */
export function proxy(request: NextRequest) {
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
