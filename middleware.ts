import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
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
  "/admin-recovery",
];
const APP_HOME_PATH = "/clients";

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function hasAuthSession(request: NextRequest) {
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  const hasSessionMarker = request.cookies.get("blumark_session")?.value === "1";

  return hasSupabaseCookie || hasSessionMarker;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = hasAuthSession(request);

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(APP_HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  // Allow /auth/* sub-paths (e.g. /auth/reset-password) through regardless of auth state
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth",
    "/auth/:path*",
    "/dashboard/:path*",
    "/employees/:path*",
    "/tasks/:path*",
    "/clients/:path*",
    "/finance/:path*",
    "/reports/:path*",
    "/automation/:path*",
    "/assistant/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/admin-recovery/:path*",
  ],
};
