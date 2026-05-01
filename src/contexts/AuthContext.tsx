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

const DEMO_USERS: (AuthUser & { password: string })[] = [
  { id: "1", name: "أحمد محمد",  email: "admin@blumark24.com",   password: "admin123",   role: "مدير_عام",       avatar: "أم" },
  { id: "2", name: "فاطمة خالد", email: "finance@blumark24.com", password: "finance123", role: "مدير_مالي",     avatar: "فخ" },
  { id: "3", name: "سارة أحمد",  email: "sales@blumark24.com",   password: "sales123",   role: "مدير_مبيعات",   avatar: "سأ" },
];

const SESSION_KEY = "blumark24_user";
const PUBLIC_PATHS = ["/auth"];

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
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
      await new Promise((r) => setTimeout(r, 700)); // simulate network
      const found = DEMO_USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (!found) return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };

      const { password: _pw, ...authUser } = found;
      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      router.replace("/");
      return { ok: true };
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
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
