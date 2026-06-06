"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap, Activity, X, ArrowLeft,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  mapAuthRoleToUserRole,
  usePermissions,
} from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  getRouteLabel,
  WORKSPACE_ROUTES,
  type WorkspaceRouteId,
} from "@/lib/features/packageFeatures";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCircle,
  DollarSign,
  Map,
  Network,
  Building2,
  Zap,
  Activity,
  Bot,
  BarChart3,
  Settings,
};

interface SidebarProps {
  collapsed?:   boolean;
  onToggle?:    () => void;
  mobileOpen?:  boolean;
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
  const toast       = useToast();
  const { userRole } = usePermissions();
  const { navRoutes, loading: wsLoading } = useTenantWorkspace();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);

  const handleLogout = () => {
    if (loggingOut) return;
    toast.info("تم تسجيل الخروج بنجاح");
    void logout();
  };

  const _wsNavLoading = authLoading || wsLoading || (!!user?.id && !effectiveRole);

  const visibleRoutes = _wsNavLoading ? WORKSPACE_ROUTES : navRoutes;

  // Use tenant-aware label so an internal-only role (defense_manager /
  // attack_manager) that ever ends up on a customer profile is rewritten to
  // a neutral tenant-safe label instead of leaking "وكالة الدفاع/الهجوم".
  // The user-card label and the existing INTERNAL_ROLE_LABELS map cover both
  // tenant + internal contexts.
  const roleLabel = effectiveRole
    ? getTenantRoleLabel(effectiveRole)
    : "";

  const innerCard = (
    <div
      className={cn(
        "flex flex-col flex-1 rounded-2xl border border-white/[0.08] overflow-hidden",
        "bg-[#0a1628] lg:bg-[rgba(10,22,40,0.55)] lg:backdrop-blur-xl",
      )}
    >
      <div className="relative flex items-center justify-center lg:justify-start px-4 py-4 border-b border-white/[0.06]">
        {collapsed ? (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22D3EE,#1E6FD9)" }}
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
          className="mr-auto ms-2 p-1.5 -m-1.5 text-white/55 hover:text-[#22D3EE] transition-colors hidden lg:block"
          aria-label="طي القائمة"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/55 hover:text-[#22D3EE] transition-colors lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {visibleRoutes.map((route) => {
            const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
            const href = route.href;
            const label = getRouteLabel(route.id as WorkspaceRouteId);
            const isActive = href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-colors border",
                    isActive
                      ? "bg-gradient-to-l from-[#1E6FD9]/30 via-[#3B82F6]/15 to-transparent border-[rgba(34,211,238,0.24)] text-white shadow-[0_2px_10px_-4px_rgba(34,211,238,0.30)]"
                      : "text-white/[0.72] hover:bg-white/[0.04] border-transparent"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-[#22D3EE]" : "text-white/55"
                      )}
                      strokeWidth={1.6}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </div>
                  {!collapsed && (
                    <ArrowLeft
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive ? "text-[#22D3EE]" : "text-white/30"
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

      <div className="px-3 pb-3 pt-2 border-t border-white/[0.06]">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5",
            collapsed && "justify-center"
          )}
        >
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22D3EE,#1E6FD9)" }}
          >
            {user?.name?.slice(0, 2) ?? "؟"}
          </span>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-white truncate">{user?.name ?? "المستخدم"}</div>
              <div className="text-[11px] text-white/55 truncate">{roleLabel || " "}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-white/55 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50 disabled:hover:text-white/55 disabled:cursor-not-allowed"
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
            className="mt-2 w-full flex justify-center text-white/55 hover:text-red-400 transition-colors disabled:opacity-50 disabled:hover:text-white/55 disabled:cursor-not-allowed"
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
            className="absolute inset-0 bg-black/55"
            onClick={onMobileClose}
          />
          <div className="absolute top-0 right-0 h-full sidebar-mobile-enter" style={{ zIndex: 51 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
