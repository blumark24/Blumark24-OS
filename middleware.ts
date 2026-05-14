import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/employees",
  "/tasks",
  "/clients",
  "/finance",
  "/reports",
  "/automation",
  "/assistant",
  "/settings",
  "/profile",
];

// Public prefixes that are always allowed
const PUBLIC_PREFIXES = ["/_next/", "/favicon.ico", "/api/", "/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static, favicon, API and auth paths and the root path
  if (
    pathname === "/" ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
  ) {
    // If an authenticated user hits /auth, redirect them to dashboard
    if (
      pathname.startsWith("/auth")
    ) {
      // check auth below and handle redirect there
    }
    return NextResponse.next();
  }

  // Only enforce auth on explicitly protected prefixes
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // If not a protected route, allow
  if (!isProtected) return NextResponse.next();

  // Check Supabase native session cookie (sb-<project-ref>-auth-token)
  const cookies = request.cookies.getAll();
  const hasSupabaseCookie = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Check our lightweight session signal set by AuthContext
  const hasSessionMarker = request.cookies.get("blumark_session")?.value === "1";

  const isAuthenticated = hasSupabaseCookie || hasSessionMarker;

  if (!isAuthenticated) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
