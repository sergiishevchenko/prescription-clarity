import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = process.env.SESSION_COOKIE_NAME || "SESSION_ID";
  const sessionToken = request.cookies.get(cookieName)?.value;

  // Public routes: if already logged in, redirect away from auth pages
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    if (
      (pathname.startsWith("/login") || pathname.startsWith("/register")) &&
      sessionToken
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Skip auth check for API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for protected routes - just check if session cookie exists
  // Full session validation happens in the API routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
