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
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getUserProfile } from "@/lib/db";

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

// Demo users for when Supabase is not configured
const DEMO_USERS: (AuthUser & { password: string })[] = [
  { id: "1", name: "أحمد محمد",  email: "admin@blumark24.com",   password: "admin123",   role: "super_admin",    avatar: "أم" },
  { id: "2", name: "فاطمة خالد", email: "finance@blumark24.com", password: "finance123", role: "finance_manager", avatar: "فخ" },
  { id: "3", name: "سارة أحمد",  email: "sales@blumark24.com",   password: "sales123",   role: "attack_manager",  avatar: "سأ" },
];

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Demo mode: no session persistence across refreshes
      setLoading(false);
      return;
    }

    // Restore session from Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: profile?.name ?? session.user.email ?? "",
          role: profile?.role ?? "employee",
          avatar: profile?.avatar,
        });
        setSessionCookie("1");
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: profile?.name ?? session.user.email ?? "",
            role: profile?.role ?? "employee",
            avatar: profile?.avatar,
          });
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
      if (!isSupabaseConfigured) {
        // Demo mode fallback
        await new Promise((r) => setTimeout(r, 700));
        const found = DEMO_USERS.find((u) => u.email === email && u.password === password);
        if (!found) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
        const { password: _pw, ...authUser } = found;
        setUser(authUser);
        setSessionCookie("1");
        router.replace("/");
        return { ok: true };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      // onAuthStateChange will update user state + cookie
      router.replace("/");
      return { ok: true };
    },
    [router]
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
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
