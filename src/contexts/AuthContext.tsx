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
import { assertSupabaseEnv, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
  is_active: boolean;
  forcePasswordChange: boolean;
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

function setSessionCookie(value: string) {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = `blumark_session=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    document.cookie = "blumark_session=; path=/; max-age=0; SameSite=Lax";
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── buildUser ─────────────────────────────────────────────────────────────────
// Returns AuthUser on a successful profile read, or `null` when the row could
// not be located.  Never falls back to a default `employee` role — callers must
// surface a profile-load error and not grant any implicit access.

type ProfileRow = {
  id?: string | null;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  avatar?: string | null;
  department?: string | null;
  is_active?: boolean | null;
};

type ExtRow = {
  avatar_url?: string | null;
  force_password_change?: boolean | null;
};

async function fetchProfileRow(authUserId: string, email: string): Promise<ProfileRow | null> {
  const SAFE_COLS = "id, name, role, email, avatar, department, is_active";

  // Prefer id-based lookup (matches Supabase auth.uid()), fall back to email.
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
  };
}

// ── resolveCurrentUserProfile ─────────────────────────────────────────────────
// Single source of truth for the current authenticated user + profile.
// Retries on missing profile (covers post-signup race where the row arrives a
// few hundred ms after the session).  Never returns a fallback employee user.

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
      // profile-error: auth session is valid but the profile row could not be
      // read.  Surface a recoverable error and clear the user — the redirect
      // effect deliberately keeps them on-page so the retry banner is visible.
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

    // Hard timeout: if auth bootstrap exceeds 5s, unblock the UI so the page
    // never hangs on a spinner.  The user can retry from /auth.
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
            // Defer to next tick so Supabase has propagated the session
            // through its cookie/storage adapters before we read profile.
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

    // The /owner area is a fully independent surface with its own auth pipeline
    // (middleware.ts → OwnerGuard → /owner/login). The client AuthContext must
    // never redirect anywhere inside it — otherwise an owner route could bounce
    // to /auth or the client dashboard, which is exactly the bug this guards
    // against. Owner authentication is handled exclusively by OwnerGuard.
    if (pathname === "/owner" || pathname.startsWith("/owner/")) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isAuthPg = pathname === "/auth" || pathname.startsWith("/auth/");

    // When the auth session is valid but the profile failed to load, keep the
    // user on the current page so the error banner + retry is visible instead
    // of bouncing them to /auth (which would hide the recoverable error).
    if (!user && !isPublic && !profileLoadError) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && pathname === "/auth") {
      router.replace("/dashboard");
    } else if (user?.forcePasswordChange && pathname !== "/settings" && !isAuthPg) {
      router.replace("/settings?tab=account");
    }
  }, [user, loading, pathname, profileLoadError, router]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

      const res = await resolveCurrentUserProfile();
      if (res.kind !== "ok") {
        // Session is live but profile couldn't be loaded — back out cleanly.
        await supabase.auth.signOut().catch(() => {});
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
        await supabase.auth.signOut().catch(() => {});
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
        router.replace("/settings?tab=account");
        return { ok: true };
      }

      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      router.replace(redirect && redirect.startsWith("/") ? redirect : "/dashboard");
      return { ok: true };
    },
    [router],
  );

  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] signOut failed:", err);
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setProfileLoadError(null);
        setSessionCookie("");
        setLoggingOut(false);
      }
      router.replace("/auth");
    }
  }, [loggingOut, router]);

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
