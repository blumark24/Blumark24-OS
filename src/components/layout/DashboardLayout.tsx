"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import WorkspaceRouteGuard from "@/components/ui/WorkspaceRouteGuard";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import "@/components/ui/workspaceTheme.css";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";
import {
  AlertTriangle, Home, CheckSquare, UserCircle, MoreHorizontal,
  Plus, Users, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/* ─── Mobile chrome data ──────────────────────────────────────────────── */

const MOBILE_BOTTOM_NAV = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/tasks",     label: "المهام",   icon: CheckSquare },
  { href: "/clients",   label: "العملاء",  icon: UserCircle },
  { href: "/settings",  label: "المزيد",   icon: MoreHorizontal },
] as const;

/**
 * Semantic accents for the quick-create menu — mirrors the workspace color
 * system (cyan=system, emerald=success, amber=attention, rose=risk, violet=AI).
 */
const MOBILE_QUICK_CREATE = [
  { label: "عميل جديد",    icon: UserCircle,  href: "/clients",   accent: "var(--ws-emerald)" },
  { label: "مهمة جديدة",   icon: CheckSquare, href: "/tasks",     accent: "var(--ws-cyan)" },
  { label: "فاتورة جديدة", icon: DollarSign,  href: "/finance",   accent: "var(--ws-sky)" },
  { label: "مصروف جديد",   icon: DollarSign,  href: "/finance",   accent: "var(--ws-rose)" },
  { label: "موظف جديد",    icon: Users,       href: "/employees", accent: "var(--ws-violet)" },
] as const;

/* ─── Shell ───────────────────────────────────────────────────────────── */

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
    <div className="workspace-shell relative flex h-screen overflow-hidden">
      {/* Animated digital background (CSS-only). */}
      <WorkspaceAmbient />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {profileLoadError && (
          <div
            className="border-b border-[var(--ws-rose-ring)] bg-[var(--ws-rose-soft)] px-4 py-2 text-xs flex items-center gap-3"
            role="alert"
          >
            <AlertTriangle size={14} className="text-rose-300 flex-shrink-0" />
            <span className="flex-1 text-rose-200">{profileLoadError}</span>
            <button
              type="button"
              onClick={() => void refreshCurrentUser()}
              className="text-rose-100 hover:text-white underline underline-offset-2 touch-manipulation"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {isDev && user && (
          <div className="border-b border-[var(--ws-amber-ring)] bg-[var(--ws-amber-soft)] px-4 py-1.5 text-xs font-mono flex items-center gap-4 flex-wrap">
            <span className="font-bold text-amber-300">[DEBUG]</span>
            <span className="text-amber-200">email: <b>{user.email}</b></span>
            <span className="text-amber-200">role: <b>{user.role}</b></span>
            <span className={userRole === "super_admin" ? "font-bold text-emerald-400" : "font-bold text-rose-400"}>
              mapped: {userRole ?? "—"} {userRole === "super_admin" ? "✓ FULL ACCESS" : "✗ LIMITED"}
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 min-w-0">
          <WorkspaceRouteGuard>{children}</WorkspaceRouteGuard>
        </main>
      </div>

      {/* Mobile floating quick-create (crystal L4) */}
      <div
        ref={fabRef}
        className="lg:hidden fixed start-1/2 -translate-x-1/2 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[45]"
        style={{ insetInlineStart: "50%" }}
      >
        {openQuickCreate && (
          <div
            className="crystal crystal-l4 absolute bottom-full mb-3 start-1/2 -translate-x-1/2 w-52 rounded-2xl overflow-hidden"
            style={{ insetInlineStart: "50%" }}
            role="menu"
          >
            {MOBILE_QUICK_CREATE.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  goTo(item.href);
                  toast.info(`انتقلت إلى صفحة ${item.label.replace(" جديد", "")}`);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-[var(--ws-border-subtle)] touch-manipulation"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg flex-shrink-0"
                  style={{ background: `color-mix(in srgb, ${item.accent} 18%, transparent)` }}
                >
                  <item.icon size={14} style={{ color: item.accent }} />
                </span>
                <span className="text-sm text-[color:var(--ws-text-primary)]">{item.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpenQuickCreate((v) => !v)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_18px_44px_-14px_rgba(124,58,237,0.7)] transition-opacity hover:opacity-90 touch-manipulation ws-brand-prism"
          aria-label="إنشاء جديد"
          aria-expanded={openQuickCreate}
        >
          <Plus size={22} className={cn("transition-transform", openQuickCreate && "rotate-45")} />
        </button>
      </div>

      {/* Mobile bottom navigation (crystal L4) */}
      <nav
        aria-label="التنقل السريع"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
      >
        <div className="crystal crystal-l4 mx-auto flex max-w-md items-center justify-around rounded-2xl px-1.5 py-1">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors touch-manipulation",
                  isActive
                    ? "text-cyan-300"
                    : "text-[color:var(--ws-text-secondary)] hover:text-[color:var(--ws-text-primary)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-inline-x-2 h-0.5 rounded-full bg-cyan-400/85"
                  />
                )}
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
