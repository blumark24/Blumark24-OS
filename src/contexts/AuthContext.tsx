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
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const PUBLIC_PATHS = ["/", "/auth"];

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
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
  let profile: { name?: string | null; full_name?: string | null; role?: string | null; avatar?: string | null; avatar_url?: string | null; email?: string | null } | null = null;

  // 1) Try by auth user id (authoritative)
  const { data: byId } = await supabase
    .from("profiles")
    .select("name, full_name, role, avatar, avatar_url, email")
    .eq("id", id)
    .maybeSingle();
  profile = byId ?? null;

  // 2) If not found by id, try by email (case-insensitive)
  if (!profile) {
    const e = (email || "").trim().toLowerCase();
    if (e) {
      const { data: byEmail } = await supabase
        .from("profiles")
        .select("name, full_name, role, avatar, avatar_url, email")
        .ilike("email", e)
        .maybeSingle();
      profile = byEmail ?? null;
    }
  }

  // 3) If still not found, create a safe profile for new users
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
      .select("name, full_name, role, avatar, avatar_url")
      .maybeSingle();
    profile = created ?? safeProfile;
  }

  const displayName = profile?.full_name ?? profile?.name ?? email.split("@")[0];

  return {
    id,
    email,
    name: displayName,
    // authoritative role from profiles table
    role: profile?.role ?? "employee",
    avatar: profile?.avatar_url ?? profile?.avatar ?? undefined,
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
    const isAuthPage = pathname.startsWith("/auth");

    if (!user && !isPublic) {
      router.replace(`/auth?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && isAuthPage) {
      router.replace("/");
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
