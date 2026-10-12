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
  "/org",
  "/virtual-office",
  "/strategy",
  "/ai",
  "/owner",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

// Owner Panel and Customer Workspace use isolated Supabase browser clients
// whose sessions are persisted under separate localStorage keys.
// Middleware cannot read localStorage, so it must only use the dedicated
// surface marker cookies as a navigation/session hint.
//
// IMPORTANT: these marker cookies are NOT the authorization boundary.
// Real authorization remains enforced by Supabase/RLS, AuthContext/OwnerGuard,
// and protected server APIs (for example verifyOwnerBearer on owner routes).
// Requiring an "sb-*-auth-token" cookie here would break valid sessions because
// the current browser clients do not persist Supabase auth into cookies.
//
// Legacy: a stale `blumark_session=1` from the pre-split session model is
// still accepted for the customer surface during the compatibility window.
function hasOwnerSession(request: NextRequest): boolean {
  return request.cookies.get("blumark_owner_session")?.value === "1";
}

function hasCustomerSession(request: NextRequest): boolean {
  return (
    request.cookies.get("blumark_customer_session")?.value === "1" ||
    request.cookies.get("blumark_session")?.value === "1"
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname === "/auth") {
    if (hasCustomerSession(request)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Allow /auth/* sub-paths (e.g. /auth/reset-password) through regardless of auth state
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Owner login page is always accessible — it IS the auth boundary for /owner
  if (pathname === "/owner/login") {
    return NextResponse.next();
  }

  // /owner and all its sub-paths gate on the owner-only marker cookie,
  // never the customer marker. A customer logging out cannot kick an owner
  // out of the Owner Panel, and vice versa.
  if (pathname === "/owner" || pathname.startsWith("/owner/")) {
    if (!hasOwnerSession(request)) {
      return NextResponse.redirect(new URL("/owner/login", request.url));
    }
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasCustomerSession(request)) {
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
    "/org/:path*",
    "/virtual-office/:path*",
    "/strategy/:path*",
    "/ai/:path*",
    "/owner/:path*",
  ],
};
