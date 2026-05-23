"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import WorkspaceRouteGuard from "@/components/ui/WorkspaceRouteGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import { AlertTriangle, Home, CheckSquare, UserCircle, MoreHorizontal, Plus, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const MOBILE_BOTTOM_NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/tasks",     label: "المهام",   icon: CheckSquare },
  { href: "/clients",   label: "العملاء",  icon: UserCircle },
  { href: "/settings",  label: "المزيد",   icon: MoreHorizontal },
] as const;

const MOBILE_QUICK_CREATE = [
  { label: "عميل جديد",   icon: UserCircle,  href: "/clients",   color: "#10b981" },
  { label: "مهمة جديدة",  icon: CheckSquare, href: "/tasks",     color: "#22d3ee" },
  { label: "فاتورة جديدة",icon: DollarSign,  href: "/finance",   color: "#ff7a3d" },
  { label: "مصروف جديد",  icon: DollarSign,  href: "/finance",   color: "#ef4444" },
  { label: "موظف جديد",   icon: Users,       href: "/employees", color: "#a855f7" },
] as const;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [openQuickCreate, setOpenQuickCreate] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { user, profileLoadError, refreshCurrentUser } = useAuth();
  const { userRole } = usePermissions();

  const isDev = process.env.NODE_ENV === "development";

  const goTo = useCallback((href: string) => {
    router.push(href);
    setOpenQuickCreate(false);
  }, [router]);

  useEffect(() => {
    setOpenQuickCreate(false);
  }, [pathname]);

  useEffect(() => {
    if (!openQuickCreate) return;
    const onDoc = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpenQuickCreate(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openQuickCreate]);

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: "#0a1628" }}>
      {/* Ambient command-center glow (desktop + mobile) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="absolute top-1/3 left-[-12%] h-[460px] w-[460px] rounded-full bg-[#a855f7]/10 blur-3xl" />
        <div className="absolute bottom-[-12%] right-1/4 h-[400px] w-[400px] rounded-full bg-[#1e6fd9]/10 blur-3xl" />
      </div>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {profileLoadError && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-xs flex items-center gap-3">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <span className="text-red-300 flex-1">{profileLoadError}</span>
            <button
              type="button"
              onClick={() => void refreshCurrentUser()}
              className="text-red-200 hover:text-white underline underline-offset-2"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {isDev && user && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-1.5 text-xs font-mono flex items-center gap-4 flex-wrap">
            <span className="text-yellow-400 font-bold">[DEBUG]</span>
            <span className="text-yellow-200">email: <b>{user.email}</b></span>
            <span className="text-yellow-200">role: <b>{user.role}</b></span>
            <span className={userRole === "super_admin" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              mapped: {userRole ?? "—"} {userRole === "super_admin" ? "✓ FULL ACCESS" : "✗ LIMITED"}
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 min-w-0">
          <WorkspaceRouteGuard>{children}</WorkspaceRouteGuard>
        </main>
      </div>

      {/* Mobile floating quick-create */}
      <div
        ref={fabRef}
        className="lg:hidden fixed left-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[45]"
      >
        {openQuickCreate && (
          <div
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 rounded-2xl border border-white/[0.10] shadow-xl overflow-hidden"
            style={{ background: "rgba(13,31,60,0.98)", backdropFilter: "blur(16px)" }}
          >
            {MOBILE_QUICK_CREATE.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  goTo(item.href);
                  toast.info(`انتقلت إلى صفحة ${item.label.replace(" جديد", "")}`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-right"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}20` }}
                >
                  <item.icon size={13} style={{ color: item.color }} />
                </div>
                <span className="text-sm text-white">{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpenQuickCreate((v) => !v)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_12px_32px_-8px_rgba(124,58,237,0.65)] hover:opacity-90 transition touch-manipulation"
          aria-label="إنشاء جديد"
          aria-expanded={openQuickCreate}
        >
          <Plus size={22} className={cn("transition-transform", openQuickCreate && "rotate-45")} />
        </button>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="التنقل السريع"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
      >
        <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-white/[0.08] bg-[#070d20]/95 px-1.5 py-1 shadow-[0_-10px_30px_-12px_rgba(0,0,0,0.7)]">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors touch-manipulation",
                  isActive ? "text-cyan-300" : "text-[#8ba3c7] hover:text-white",
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
