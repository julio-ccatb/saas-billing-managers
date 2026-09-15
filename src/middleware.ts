import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NextAuth v5 session cookie (secure in prod, standard in dev)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value ??
    request.cookies.get("next-auth.session-token")?.value ??
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuthenticated = Boolean(sessionToken);

  // Paths that require authentication
  const isDashboardPath =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/settings");

  const isPortalProtected = pathname.startsWith("/portal") && pathname !== "/portal/login";

  if (isDashboardPath && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isPortalProtected && !isAuthenticated) {
    const portalLoginUrl = new URL("/portal/login", request.url);
    portalLoginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(portalLoginUrl);
  }

  // If already logged in and visiting auth pages
  if (pathname === "/portal/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (pathname === "/auth/signin" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, including NextAuth and tRPC)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
