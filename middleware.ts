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
  "/strategy",
  "/ai",
  "/owner",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

// PR5-D: Owner Panel and Customer Workspace now run on isolated Supabase
// auth clients, each persisting its session under a distinct localStorage
// key. To keep middleware in step with that isolation, the single
// `blumark_session` edge marker has been split into two surface-scoped
// cookies. Either surface logging out only clears its own cookie, so the
// other surface's middleware still sees the visitor as authenticated.
//
// localStorage is never visible to middleware, so these marker cookies
// remain the authoritative edge-level "is signed in?" signal. The real
// identity check (owner email allowlist, organization_id binding) still
// lives in OwnerGuard and AuthContext on the client.
//
// Legacy: any stale `blumark_session=1` from a pre-PR5-D session is
// honored as a customer marker for one release window so already-logged-in
// users are not silently kicked to /auth on deploy.
function hasOwnerSession(request: NextRequest): boolean {
  return request.cookies.get("blumark_owner_session")?.value === "1";
}

function hasCustomerSession(request: NextRequest): boolean {
  if (request.cookies.get("blumark_customer_session")?.value === "1") return true;
  if (request.cookies.get("blumark_session")?.value === "1") return true;
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
  return hasSupabaseCookie;
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
    "/strategy/:path*",
    "/ai/:path*",
    "/owner/:path*",
  ],
};
