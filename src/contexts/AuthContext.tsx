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

// Known admin emails — ALWAYS get super_admin regardless of DB state
const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

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

const PUBLIC_PATHS = ["/auth"];

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

// Build AuthUser:
// 1. Fetch profile from DB using auth user ID
// 2. If missing, upsert it (handles trigger-not-fired edge case)
// 3. Admin emails ALWAYS get super_admin — final authority
async function buildUser(id: string, email: string): Promise<AuthUser> {
  const isAdmin = ADMIN_EMAILS.includes(email);

  // Step 1: try reading existing profile
  let profile: { name: string; role: string; avatar?: string } | null = null;
  const { data: existing } = await supabase
    .from("profiles")
    .select("name, role, avatar")
    .eq("id", id)
    .maybeSingle();
  profile = existing;

  // Step 2: create profile if it doesn't exist
  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .upsert(
        {
          id,
          email,
          name: email.split("@")[0],
          role: isAdmin ? "super_admin" : "employee",
          is_active: true,
          department: isAdmin ? "الإدارة العليا" : "",
        },
        { onConflict: "id" }
      )
      .select("name, role, avatar")
      .maybeSingle();
    profile = created;
  }

  // Step 3: admin emails always override to super_admin
  const role = isAdmin ? "super_admin" : (profile?.role ?? "employee");

  // Fix DB silently if admin email has wrong role
  if (isAdmin && profile?.role !== "super_admin") {
    supabase.from("profiles").update({ role: "super_admin" }).eq("id", id).then(() => {});
  }

  return {
    id,
    email,
    name:   profile?.name ?? email.split("@")[0],
    role,
    avatar: profile?.avatar,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await buildUser(session.user.id, session.user.email ?? "");
        setUser(u);
        setSessionCookie("1");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const u = await buildUser(session.user.id, session.user.email ?? "");
          setUser(u);
          setSessionCookie("1");
        } else {
          setUser(null);
          setSessionCookie("");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Route guard
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (!user && !isPublic) {
      router.replace("/auth");
    } else if (user && isPublic) {
      router.replace("/");
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      }
      router.replace("/");
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
