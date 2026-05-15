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

const PUBLIC_PATHS = ["/", "/auth"];

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

async function buildUser(id: string, email: string): Promise<AuthUser> {
  type ProfileRow = { name?: string | null; full_name?: string | null; role?: string | null; avatar?: string | null; avatar_url?: string | null; email?: string | null; force_password_change?: boolean | null };

  const FULL_COLS  = "name, full_name, role, avatar, avatar_url, email, force_password_change";
  const SAFE_COLS  = "name, role, avatar, email, force_password_change";

  async function queryEmail(cols: string): Promise<ProfileRow | null> {
    const e = (email || "").trim().toLowerCase();
    if (!e) return null;
    const { data, error } = await supabase.from("profiles").select(cols).ilike("email", e).maybeSingle();
    return error ? null : ((data as ProfileRow) ?? null);
  }

  async function queryId(cols: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase.from("profiles").select(cols).eq("id", id).maybeSingle();
    return error ? null : ((data as ProfileRow) ?? null);
  }

  let profile: ProfileRow | null = null;

  // 1) Email-first with full columns; retry with safe columns if schema error
  profile = await queryEmail(FULL_COLS) ?? await queryEmail(SAFE_COLS);

  // 2) Fallback: by auth user id
  if (!profile) {
    profile = await queryId(FULL_COLS) ?? await queryId(SAFE_COLS);
  }

  // 3) Not found — upsert a safe default
  if (!profile) {
    const safeProfile = {
      id,
      email,
      name: email.split("@")[0],
      full_name: email.split("@")[0],
      role: "employee",
      is_active: true,
      department: "",
    };
    const { data: created } = await supabase
      .from("profiles")
      .upsert(safeProfile, { onConflict: "id" })
      .select(SAFE_COLS)
      .maybeSingle();
    profile = created ?? safeProfile;
  }

  const displayName = profile?.full_name ?? profile?.name ?? email.split("@")[0];

  return {
    id,
    email,
    name: displayName,
    role: profile?.role ?? "employee",
    avatar: profile?.avatar_url ?? profile?.avatar ?? undefined,
    forcePasswordChange: profile?.force_password_change === true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await buildUser(session.user.id, session.user.email ?? "");
        setUser(u);
        if (process.env.NODE_ENV === "development") {
          console.log("Auth role loaded:", session.user.email, u.role);
        }
        setSessionCookie("1");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await buildUser(session.user.id, session.user.email ?? "");
        setUser(u);
        if (process.env.NODE_ENV === "development") {
          console.log("Auth role loaded:", session.user.email, u.role);
        }
        setSessionCookie("1");
      } else {
        setUser(null);
        setSessionCookie("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const isAuthPage = pathname === "/auth";

    if (!user && !isPublic) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && isAuthPage) {
      router.replace("/");
    } else if (user?.forcePasswordChange && pathname !== "/settings") {
      router.replace("/settings?tab=account");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      }

      // Ensure we rebuild the user from profiles after sign-in so role is correct
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = await buildUser(session.user.id, session.user.email ?? "");
        setUser(u);
        setSessionCookie("1");
        if (process.env.NODE_ENV === "development") {
          console.log("Auth role loaded:", session.user.email, u.role);
        }
        if (u.forcePasswordChange) {
          router.replace("/settings?tab=account");
          return { ok: true };
        }
      }

      const redirect = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirect")
        : null;
      router.replace(redirect || "/");
      return { ok: true };
    },
    [router]
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
    } catch { /* ignore — local state cleared regardless */ }
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
