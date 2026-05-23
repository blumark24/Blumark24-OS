"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap, Activity, X, ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { usePermissions, ROLE_LABELS } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  getRouteLabel,
  WORKSPACE_ROUTES,
  type WorkspaceRouteId,
} from "@/lib/features/packageFeatures";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCircle,
  DollarSign,
  Map,
  Network,
  Zap,
  Activity,
  Bot,
  BarChart3,
  Settings,
};

interface SidebarProps {
  collapsed?:    boolean;
  onToggle?:     () => void;
  mobileOpen?:   boolean;
  onMobileClose?:() => void;
}

export default function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname    = usePathname();
  const { user, loading: authLoading, loggingOut, logout } = useAuth();
  const toast        = useToast();
  const { userRole } = usePermissions();
  const { navRoutes, loading: wsLoading, isInternal } = useTenantWorkspace();

  const handleLogout = () => {
    if (loggingOut) return;
    toast.info("تم تسجيل الخروج بنجاح");
    void logout();
  };

  const _wsNavLoading = authLoading || wsLoading || !userRole;

  const visibleRoutes = _wsNavLoading
    ? WORKSPACE_ROUTES.filter((r) => !r.internalOnly)
    : navRoutes;

  const roleLabel = userRole
    ? (ROLE_LABELS[userRole] ?? userRole.replace(/_/g, " "))
    : "";

  /* ─── Inner crystal card (shared desktop + mobile drawer) ───────────── */

  const innerCard = (
    <div className="crystal crystal-l4 flex flex-col flex-1 overflow-hidden rounded-2xl">
      {/* Brand row */}
      <div className="relative flex items-center justify-center lg:justify-start px-4 py-4 border-b border-[var(--ws-border-subtle)]">
        {collapsed ? (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ws-brand-prism"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M12 2v20M3 7l9 5 9-5" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
            </svg>
          </div>
        ) : (
          <OfficialBlumarkLogo className="w-[140px] sm:w-[150px] lg:w-[150px]" />
        )}
        <button
          onClick={onToggle}
          className="mr-auto ms-2 p-1.5 -m-1.5 text-[color:var(--ws-text-secondary)] hover:text-cyan-300 transition-colors hidden lg:block"
          aria-label="طي القائمة"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-2 text-[color:var(--ws-text-secondary)] hover:text-cyan-300 transition-colors lg:hidden touch-manipulation"
            aria-label="إغلاق القائمة"
            style={{ insetInlineEnd: "0.5rem" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="القائمة الجانبية">
        <ul className="space-y-1">
          {visibleRoutes.map((route) => {
            const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
            const href = route.href;
            const label = getRouteLabel(route.id as WorkspaceRouteId, isInternal);
            const isActive = href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors border",
                    isActive
                      ? "bg-[var(--ws-cyan-soft)] border-[var(--ws-cyan-ring)] text-[color:var(--ws-text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_6px_22px_-12px_rgba(34,211,238,0.45)]"
                      : "border-transparent text-[color:var(--ws-text-secondary)] hover:bg-[var(--ws-border-subtle)] hover:text-[color:var(--ws-text-primary)]"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-inline-start-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-cyan-400"
                      style={{ insetInlineStart: 0 }}
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-cyan-300" : "text-[color:var(--ws-text-tertiary)]"
                      )}
                      strokeWidth={1.6}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!collapsed && (
                    <ArrowLeft
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive ? "text-cyan-300" : "text-[color:var(--ws-text-tertiary)] opacity-50"
                      )}
                      strokeWidth={1.6}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User card */}
      <div className="px-3 pb-3 pt-2 border-t border-[var(--ws-border-subtle)]">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            collapsed && "justify-center"
          )}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white flex-shrink-0 ws-brand-prism">
            {user?.name?.slice(0, 2) ?? "؟"}
          </span>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-[color:var(--ws-text-primary)] truncate">
                {user?.name ?? "المستخدم"}
              </div>
              <div className="text-[11px] text-[color:var(--ws-text-secondary)] truncate">
                {roleLabel || " "}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-[color:var(--ws-text-secondary)] hover:text-rose-400 transition-colors flex-shrink-0 disabled:opacity-50 disabled:hover:text-[color:var(--ws-text-secondary)] disabled:cursor-not-allowed touch-manipulation"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-2 w-full flex justify-center text-[color:var(--ws-text-secondary)] hover:text-rose-400 transition-colors disabled:opacity-50 touch-manipulation"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 z-40 p-2 transition-[width] duration-300",
        collapsed ? "w-16" : "w-[78vw] max-w-[300px] lg:w-60 lg:max-w-none"
      )}
    >
      {innerCard}
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{sidebarContent}</div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0"
            onClick={onMobileClose}
            style={{ background: "var(--ws-scrim)" }}
            aria-hidden="true"
          />
          <div
            className="absolute top-0 end-0 h-full sidebar-mobile-enter"
            style={{ zIndex: 51, insetInlineEnd: 0 }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
