"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  forcePasswordChange: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  clearForcePasswordChange: () => Promise<void>;
}

const PUBLIC_PATHS = ["/", "/auth", "/demo"];
const APP_HOME_PATH = "/clients";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
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

// ── buildUser ─────────────────────────────────────────────────────────────────
// Always queries guaranteed base columns (SAFE_COLS) to avoid 400 errors for
// optional migration-dependent columns (avatar_url, force_password_change).
// Extended columns are fetched separately in a silent try/catch so that missing
// columns degrade gracefully to safe defaults instead of logging 400 errors.

async function buildUser(id: string, email: string): Promise<AuthUser> {
  type SafeRow = { name?: string | null; role?: string | null; avatar?: string | null; email?: string | null };
  type ExtRow  = { avatar_url?: string | null; force_password_change?: boolean | null };

  const SAFE_COLS = "name, role, avatar, email";

  async function queryByEmail(): Promise<SafeRow | null> {
    const e = (email || "").trim().toLowerCase();
    if (!e) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select(SAFE_COLS)
      .ilike("email", e)
      .maybeSingle();
    if (error) console.warn("[buildUser] email query error:", error.message);
    return error ? null : ((data as SafeRow) ?? null);
  }

  async function queryById(): Promise<SafeRow | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select(SAFE_COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) console.warn("[buildUser] id query error:", error.message);
    return error ? null : ((data as SafeRow) ?? null);
  }

  const profile = await queryByEmail() ?? await queryById();

  if (!profile) {
    console.error("[buildUser] No profile row found for", email, id);
    return { id, email, name: email.split("@")[0], role: "employee", avatar: undefined, forcePasswordChange: false };
  }

  // Optional extended columns — may not exist if migrations 005/006 are absent.
  // Failure here is non-fatal; defaults are used.
  let avatarUrl: string | undefined;
  let forcePasswordChange = false;
  try {
    const { data: ext } = await supabase
      .from("profiles")
      .select("avatar_url, force_password_change")
      .eq("id", id)
      .maybeSingle();
    const row = ext as ExtRow | null;
    if (row) {
      avatarUrl            = row.avatar_url    ?? undefined;
      forcePasswordChange  = row.force_password_change === true;
    }
  } catch {
    // Columns absent — use safe defaults (false / undefined)
  }

  return {
    id,
    email,
    name:                profile.name ?? email.split("@")[0],
    role:                profile.role ?? "employee",
    avatar:              avatarUrl ?? profile.avatar ?? undefined,
    forcePasswordChange,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearLocalSession = useCallback(() => {
    setUser(null);
    setSessionCookie("");
  }, []);

  const safeInternalRedirect = useCallback((rawRedirect: string | null): string => {
    if (!rawRedirect) return APP_HOME_PATH;
    if (!rawRedirect.startsWith("/") || rawRedirect.startsWith("//")) return APP_HOME_PATH;
    if (PUBLIC_PATHS.some((p) => rawRedirect === p || rawRedirect.startsWith(`${p}/`))) {
      return APP_HOME_PATH;
    }
    return rawRedirect;
  }, []);

  useEffect(() => {
    let mounted = true;

    // Hard timeout: if Supabase takes > 10 s, unblock the UI so the page
    // never hangs on a spinner indefinitely.  The user will see LandingPage
    // and can refresh to try again.
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthContext] getSession timed out after 10 s — unblocking UI");
        setLoading(false);
      }
    }, 10_000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(fallbackTimer);
        if (!mounted) return;
        if (session?.user) {
          const u = await buildUser(session.user.id, session.user.email ?? "");
          if (!mounted) return;
          setUser(u);
          if (process.env.NODE_ENV === "development") {
            console.log("[Auth] role loaded:", session.user.email, u.role);
          }
          setSessionCookie("1");
        }
        setLoading(false);
      })
      .catch((err) => {
        clearTimeout(fallbackTimer);
        if (!mounted) return;
        console.error("[AuthContext] getSession failed:", err);
        if (/refresh token/i.test(String(err?.message ?? ""))) {
          clearLocalSession();
          supabase.auth.signOut().catch(() => undefined);
        }
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const u = await buildUser(session.user.id, session.user.email ?? "");
          if (!mounted) return;
          setUser(u);
          if (process.env.NODE_ENV === "development") {
            console.log("[Auth] state change:", event, session.user.email, u.role);
          }
          setSessionCookie("1");
        } else {
          setUser(null);
          setSessionCookie("");
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [clearLocalSession]);

  useEffect(() => {
    if (loading) return;

    const isPublic  = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isAuthPg  = pathname === "/auth";

    if (!user && !isPublic) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && isAuthPg) {
      router.replace(APP_HOME_PATH);
    } else if (user?.forcePasswordChange && pathname !== "/settings") {
      router.replace("/settings?tab=account");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = await buildUser(session.user.id, session.user.email ?? "");
        setUser(u);
        setSessionCookie("1");
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth] login:", session.user.email, u.role);
        }
        if (u.forcePasswordChange) {
          router.replace("/settings?tab=account");
          return { ok: true };
        }
      }

      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      router.replace(safeInternalRedirect(redirect));
      return { ok: true };
    },
    [router, safeInternalRedirect]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessionCookie("");
    router.replace("/auth");
  }, [router]);

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
    <AuthContext.Provider value={{ user, loading, login, logout, clearForcePasswordChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
