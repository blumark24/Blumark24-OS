"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  isCustomerWorkspacePath,
  isPlatformOwnerEmail,
  MISSING_ORGANIZATION_ERROR_MSG,
} from "@/lib/tenant/customerWorkspaceRoutes";

// PR5-C: dev-only auth routing diagnostics. Never logs tokens or passwords;
// only the route, role label, organizationId presence, and redirect target.
const IS_DEV_AUTH = process.env.NODE_ENV !== "production";
function authDebug(event: string, info: Record<string, unknown>): void {
  if (!IS_DEV_AUTH) return;
  // eslint-disable-next-line no-console
  console.debug(`[Auth/PR5-C] ${event}`, info);
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
  is_active: boolean;
  forcePasswordChange: boolean;
  organizationId?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loggingOut: boolean;
  profileLoadError: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  clearForcePasswordChange: () => Promise<void>;
}

// The entire /owner subtree (including /owner/login) is handled by its own
// early-return below, so it is intentionally absent from this client list.
const PUBLIC_PATHS = ["/", "/auth", "/demo"];
const PROFILE_RETRY_DELAYS_MS = [0, 250, 700, 1500];
const PROFILE_LOAD_ERROR_MSG = "حدث خطأ أثناء تحميل الملف الشخصي — حاول مجدداً";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  loggingOut: false,
  profileLoadError: null,
  login: async () => ({ ok: false }),
  logout: async () => {},
  refreshCurrentUser: async () => {},
  clearForcePasswordChange: async () => {},
});

// PR5-D: customer-scoped middleware marker. Distinct from
// `blumark_owner_session` set by /owner/login so a customer logout never
// clears the owner edge marker, and vice versa.
function setSessionCookie(value: string) {
  if (typeof document === "undefined") return;
  const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
  if (value) {
    document.cookie = `blumark_customer_session=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureAttr}`;
  } else {
    document.cookie = `blumark_customer_session=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
    // Best-effort cleanup of the pre-PR5-D shared marker. Safe to clear
    // because anyone hitting customer logout intends to drop their own
    // customer-side authentication.
    document.cookie = `blumark_session=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ProfileRow = {
  id?: string | null;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  avatar?: string | null;
  department?: string | null;
  is_active?: boolean | null;
  organization_id?: string | null;
};

type ExtRow = {
  avatar_url?: string | null;
  force_password_change?: boolean | null;
};

async function fetchProfileRow(authUserId: string, email: string): Promise<ProfileRow | null> {
  const SAFE_COLS =
    "id, name, role, email, avatar, department, is_active, organization_id";

  const { data: byId, error: idErr } = await supabase
    .from("profiles")
    .select(SAFE_COLS)
    .eq("id", authUserId)
    .maybeSingle();
  if (idErr) console.warn("[Auth] profiles by id error:", idErr.message);
  if (byId) return byId as ProfileRow;

  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;

  const { data: byEmail, error: emailErr } = await supabase
    .from("profiles")
    .select(SAFE_COLS)
    .ilike("email", normalized)
    .maybeSingle();
  if (emailErr) console.warn("[Auth] profiles by email error:", emailErr.message);
  return (byEmail as ProfileRow) ?? null;
}

async function fetchExtendedColumns(authUserId: string): Promise<ExtRow | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, force_password_change")
      .eq("id", authUserId)
      .maybeSingle();
    return (data as ExtRow | null) ?? null;
  } catch {
    return null;
  }
}

async function buildUserFromProfile(
  authUserId: string,
  email: string,
  profile: ProfileRow,
): Promise<AuthUser> {
  const ext = await fetchExtendedColumns(authUserId);
  return {
    id:                  authUserId,
    email:               profile.email ?? email,
    name:                profile.name ?? (email ? email.split("@")[0] : ""),
    role:                profile.role ?? "",
    department:          profile.department ?? undefined,
    avatar:              ext?.avatar_url ?? profile.avatar ?? undefined,
    is_active:           profile.is_active !== false,
    forcePasswordChange: ext?.force_password_change === true,
    organizationId:      profile.organization_id ?? null,
  };
}

type ResolveResult =
  | { kind: "no-session"; user: null }
  | { kind: "ok"; user: AuthUser }
  | { kind: "profile-error"; user: null };

async function resolveCurrentUserProfile(): Promise<ResolveResult> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { kind: "no-session", user: null };

  const email = authUser.email ?? "";

  for (let attempt = 0; attempt < PROFILE_RETRY_DELAYS_MS.length; attempt++) {
    if (PROFILE_RETRY_DELAYS_MS[attempt] > 0) {
      await delay(PROFILE_RETRY_DELAYS_MS[attempt]);
    }
    const profile = await fetchProfileRow(authUser.id, email);
    if (profile) {
      const built = await buildUserFromProfile(authUser.id, email, profile);
      return { kind: "ok", user: built };
    }
  }

  console.error("[Auth] profile row not found after retries for", authUser.id, email);
  return { kind: "profile-error", user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,             setUser]             = useState<AuthUser | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [loggingOut,       setLoggingOut]       = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const applyResolved = useCallback((res: ResolveResult) => {
    if (!mountedRef.current) return;
    if (res.kind === "ok") {
      setUser(res.user);
      setProfileLoadError(null);
      setSessionCookie("1");
    } else if (res.kind === "no-session") {
      setUser(null);
      setProfileLoadError(null);
      setSessionCookie("");
    } else {
      setUser(null);
      setProfileLoadError(PROFILE_LOAD_ERROR_MSG);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const res = await resolveCurrentUserProfile();
    applyResolved(res);
  }, [applyResolved]);

  useEffect(() => {
    mountedRef.current = true;

    const fallbackTimer = setTimeout(() => {
      if (mountedRef.current) {
        console.warn("[AuthContext] bootstrap timed out after 5s — unblocking UI");
        setLoading(false);
      }
    }, 5_000);

    (async () => {
      try {
        const res = await resolveCurrentUserProfile();
        applyResolved(res);
      } catch (err) {
        console.error("[AuthContext] bootstrap failed:", err);
        if (mountedRef.current) {
          setUser(null);
          setProfileLoadError(null);
          setSessionCookie("");
        }
      } finally {
        clearTimeout(fallbackTimer);
        if (mountedRef.current) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      switch (event) {
        case "SIGNED_OUT":
          setUser(null);
          setProfileLoadError(null);
          setSessionCookie("");
          return;
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          if (session?.user) {
            setTimeout(() => {
              if (mountedRef.current) void refreshCurrentUser();
            }, 0);
          }
          return;
        default:
          return;
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [applyResolved, refreshCurrentUser]);

  useEffect(() => {
    if (loading) return;

    // The /owner subtree (including /owner/login) is gated by OwnerGuard +
    // middleware; AuthContext deliberately never touches routing while the
    // user is inside it, so a logged-in non-owner can still reach
    // /owner/login to switch accounts without being bounced.
    if (pathname === "/owner" || pathname.startsWith("/owner/")) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isAuthPg = pathname === "/auth" || pathname.startsWith("/auth/");
    const isOwner  = isPlatformOwnerEmail(user?.email);

    if (!user && !isPublic && !profileLoadError) {
      authDebug("no-session-on-protected-route", { route: pathname, target: "/auth" });
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user && pathname === "/auth") {
      const target = isOwner ? "/owner" : "/dashboard";
      authDebug("authenticated-on-auth-page", {
        route: pathname,
        role: user.role,
        isOwner,
        hasOrg: !!user.organizationId,
        target,
      });
      router.replace(target);
      return;
    }

    if (user && isCustomerWorkspacePath(pathname)) {
      // PR5-C rule 1: platform owner may only enter the Customer Workspace
      // when they also carry a real organization_id (e.g. an internal-org
      // membership). Without one, send them home to /owner instead of
      // dropping them into an empty tenant view.
      if (isOwner) {
        if (!user.organizationId) {
          authDebug("owner-on-customer-workspace-no-org", {
            route: pathname,
            role: user.role,
            hasOrg: false,
            target: "/owner",
          });
          router.replace("/owner");
          return;
        }
        // Owner WITH an organization context — allow access. Diagnostic only.
        authDebug("owner-on-customer-workspace-with-org", {
          route: pathname,
          role: user.role,
          hasOrg: true,
        });
      } else if (!user.organizationId) {
        // PR5-C rule 6: missing tenant binding is a routing dead end, not a
        // silent bounce loop — surface the Arabic error on /auth and stop.
        authDebug("non-owner-missing-org", {
          route: pathname,
          role: user.role,
          target: "/auth",
        });
        setProfileLoadError(MISSING_ORGANIZATION_ERROR_MSG);
        router.replace("/auth");
        return;
      }
    }

    if (user?.forcePasswordChange && pathname !== "/settings" && !isAuthPg) {
      authDebug("force-password-change", { route: pathname, target: "/settings?tab=account" });
      router.replace("/settings?tab=account");
    }
  }, [user, loading, pathname, profileLoadError, router]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

      const res = await resolveCurrentUserProfile();
      if (res.kind !== "ok") {
        // PR5-D: scope="local" so signOut only drops the customer-client
        // session; a parallel owner-client session in the same browser is
        // untouched.
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (mountedRef.current) {
          setUser(null);
          setSessionCookie("");
          setProfileLoadError(res.kind === "profile-error" ? PROFILE_LOAD_ERROR_MSG : null);
        }
        return {
          ok: false,
          error: res.kind === "profile-error" ? PROFILE_LOAD_ERROR_MSG : "تعذّر استكمال تسجيل الدخول",
        };
      }

      if (res.user.is_active === false) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (mountedRef.current) {
          setUser(null);
          setSessionCookie("");
          setProfileLoadError(null);
        }
        return { ok: false, error: "الحساب غير نشط" };
      }

      if (mountedRef.current) {
        setUser(res.user);
        setProfileLoadError(null);
        setSessionCookie("1");
      }

      if (res.user.forcePasswordChange) {
        authDebug("login-force-password-change", {
          route: "/auth",
          role: res.user.role,
          isOwner: isPlatformOwnerEmail(res.user.email),
          target: "/settings?tab=account",
        });
        router.replace("/settings?tab=account");
        return { ok: true };
      }

      // PR5-D rule: /auth signs in via the customer client only. If those
      // credentials happen to be a platform-owner email, we must NOT leave
      // a customer-client session behind for the owner — instead, drop
      // the just-created customer session and bounce the user to the
      // dedicated /owner/login, where they will authenticate into the
      // separate owner client (storageKey "blumark_owner_auth").
      if (isPlatformOwnerEmail(res.user.email)) {
        authDebug("login-owner-bounced-to-owner-login", {
          route: "/auth",
          role: res.user.role,
          isOwner: true,
          target: "/owner/login",
        });
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (mountedRef.current) {
          setUser(null);
          setProfileLoadError(null);
          setSessionCookie("");
        }
        router.replace("/owner/login");
        return { ok: true };
      }

      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      // PR5-C rule 4: customers may only ever land in the Customer Workspace
      // after /auth. An `/owner...` redirect param is ignored to prevent a
      // customer from being deep-linked into the Owner Panel.
      const safeRedirect =
        redirect
        && redirect.startsWith("/")
        && redirect !== "/owner"
        && !redirect.startsWith("/owner/")
          ? redirect
          : null;
      const target = safeRedirect ?? "/dashboard";
      if (isCustomerWorkspacePath(target) && !res.user.organizationId) {
        authDebug("login-customer-missing-org", {
          route: "/auth",
          role: res.user.role,
          isOwner: false,
          hasOrg: false,
          target: "/auth",
        });
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        if (mountedRef.current) {
          setUser(null);
          setProfileLoadError(MISSING_ORGANIZATION_ERROR_MSG);
          setSessionCookie("");
        }
        router.replace("/auth");
        return { ok: false, error: MISSING_ORGANIZATION_ERROR_MSG };
      }
      authDebug("login-customer-routed", {
        route: "/auth",
        role: res.user.role,
        isOwner: false,
        hasOrg: !!res.user.organizationId,
        target,
      });
      router.replace(target);
      return { ok: true };
    },
    [router],
  );

  const logout = useCallback(async () => {
    if (loggingOut) return;
    // PR5-C rule 5: capture the owner-ness of the session BEFORE clearing
    // it, then run exactly one signOut, then route to the matching login
    // page. The /owner area has its own OwnerLogoutButton which already
    // routes to /owner/login — this branch only fires when an owner
    // happens to call logout() from the customer-facing surface.
    const wasOwner = isPlatformOwnerEmail(user?.email);
    const logoutTarget = wasOwner ? "/owner/login" : "/auth";
    authDebug("logout", {
      route: pathname,
      role: user?.role ?? null,
      isOwner: wasOwner,
      hasOrg: !!user?.organizationId,
      target: logoutTarget,
    });
    setLoggingOut(true);
    try {
      // PR5-D: scope="local" only clears the customer-client session
      // storage; any parallel owner-client session in the same browser
      // remains valid and unaffected.
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.error("[Auth] signOut failed:", err);
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setProfileLoadError(null);
        setSessionCookie("");
        setLoggingOut(false);
      }
      router.replace(logoutTarget);
    }
  }, [loggingOut, router, user, pathname]);

  const clearForcePasswordChange = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch("/api/auth/clear-force-pw", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch { /* ignore */ }
    setUser((prev) => (prev ? { ...prev, forcePasswordChange: false } : null));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loggingOut,
        profileLoadError,
        login,
        logout,
        refreshCurrentUser,
        clearForcePasswordChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
