"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, UserCircle,
  DollarSign, Map, Bot, BarChart3, Settings, LogOut,
  ChevronLeft, Network, Zap, Activity, X, ArrowLeft,
  Building2, Lock,
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
  type WorkspaceRouteDef,
  type WorkspaceRouteId,
} from "@/lib/features/packageFeatures";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";

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
  const { name: companyName, logoUrl: companyLogoUrl } = useTenantCompanyName();
  const effectiveRole =
    userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);

  const handleLogout = () => {
    if (loggingOut) return;
    toast.info("تم تسجيل الخروج بنجاح");
    void logout();
  };

  const _wsNavLoading = authLoading || wsLoading || (!!user?.id && !effectiveRole);

  const visibleRoutes = _wsNavLoading ? WORKSPACE_ROUTES : navRoutes;

  // Virtual Office visibility recovery:
  // The Virtual Office sidebar entry must always be visible to all tenant
  // users — but remain gated. Packages that do not include `virtual_office`
  // see it as a locked premium item with a "متقدم" badge. Clicking the
  // locked item shows a toast, never navigates, and never bypasses the
  // existing route guard / package gating.
  const virtualOfficeRoute: WorkspaceRouteDef | null =
    WORKSPACE_ROUTES.find((r) => r.id === "virtual_office") ?? null;
  const enabledRouteIds = new Set(visibleRoutes.map((r) => r.id));
  const showLockedVirtualOffice =
    !_wsNavLoading && !!virtualOfficeRoute && !enabledRouteIds.has("virtual_office");

  // Merge a locked Virtual Office entry between `org` and the next item
  // (matches the documented nav order: between الهيكل الإداري للمنشأة and
  // خطة النمو). Falls back to inserting before settings if `org` isn't
  // visible for this package.
  const renderedRoutes: Array<{ route: WorkspaceRouteDef; locked: boolean }> = [];
  for (const route of visibleRoutes) {
    renderedRoutes.push({ route, locked: false });
    if (showLockedVirtualOffice && route.id === "org") {
      renderedRoutes.push({ route: virtualOfficeRoute!, locked: true });
    }
  }
  if (showLockedVirtualOffice && !renderedRoutes.some((r) => r.route.id === "virtual_office")) {
    const settingsIdx = renderedRoutes.findIndex((r) => r.route.id === "settings");
    const insertAt = settingsIdx >= 0 ? settingsIdx : renderedRoutes.length;
    renderedRoutes.splice(insertAt, 0, { route: virtualOfficeRoute!, locked: true });
  }

  const handleLockedVirtualOfficeClick = () => {
    toast.info("المكتب الافتراضي متاح في باقة متقدم أو مؤسسي");
    onMobileClose?.();
  };

  // Use tenant-aware label so an internal-only role (defense_manager /
  // attack_manager) that ever ends up on a customer profile is rewritten to
  // a neutral tenant-safe label instead of leaking "وكالة الدفاع/الهجوم".
  // The user-card label and the existing INTERNAL_ROLE_LABELS map cover both
  // tenant + internal contexts.
  const roleLabel = effectiveRole
    ? getTenantRoleLabel(effectiveRole)
    : "";

  const NAV_SECTIONS: Array<{ id: string; label: string; routes: WorkspaceRouteId[] }> = [
    { id: "home", label: "", routes: ["dashboard"] },
    { id: "work", label: "العمل", routes: ["tasks", "clients"] },
    { id: "team", label: "الفريق والمنشأة", routes: ["employees", "org", "virtual_office"] },
    { id: "management", label: "الإدارة", routes: ["strategy", "finance", "reports"] },
    { id: "intelligence", label: "الذكاء والتشغيل", routes: ["automation", "ai"] },
    { id: "system", label: "النظام", routes: ["settings"] },
  ];

  const groupedRoutes = NAV_SECTIONS.map((section) => ({
    ...section,
    items: renderedRoutes.filter(({ route }) => section.routes.includes(route.id)),
  })).filter((section) => section.items.length > 0);

  const innerCard = (
    <div
      className={cn(
        "bm-fusion-sidebar flex flex-col flex-1 overflow-hidden rounded-[20px] border shadow-[0_24px_70px_rgba(0,0,0,0.26)]",
      )}
    >
      <div className="relative flex items-center justify-center border-b border-ds-border-soft px-3.5 py-3.5 lg:justify-start">
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
          className="mr-auto ms-2 p-1.5 -m-1.5 text-ds-text-3 hover:text-[#22D3EE] transition-colors hidden lg:block"
          aria-label="طي القائمة"
        >
          <ChevronLeft size={16} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-ds-text-3 hover:text-[#22D3EE] transition-colors lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-ds-border-soft bg-white/[0.025] px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              {companyLogoUrl ? (
                <span
                  aria-label="شعار المنشأة"
                  role="img"
                  className="h-7 w-7 shrink-0 rounded-lg border border-ds-border-soft bg-white/5 bg-cover bg-center"
                  style={{ backgroundImage: "url(" + companyLogoUrl + ")" }}
                />
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-cyan-300/15 bg-cyan-400/[0.06] text-[11px] font-black text-cyan-200">
                  {companyName?.trim()?.slice(0, 1) || "B"}
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-[11.5px] font-bold text-ds-text-1">{companyName || "Blumark24"}</div>
                <div className="truncate text-[10px] text-ds-text-3">{roleLabel || "مساحة العمل"}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {groupedRoutes.map((section) => (
            <section key={section.id} aria-label={section.label || "الرئيسية"}>
              {!collapsed && section.label ? (
                <div className="mb-1 px-2 text-[9.5px] font-semibold tracking-[0.04em] text-ds-text-3">
                  {section.label}
                </div>
              ) : null}

              <ul className="space-y-1">
                {section.items.map(({ route, locked }) => {
                  const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
                  const href = route.href;
                  const label = getRouteLabel(route.id as WorkspaceRouteId);
                  const isActive = !locked && (href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href));

                  const itemClass = cn(
                    "group flex min-h-10 w-full items-center justify-between gap-2.5 rounded-xl border px-3 py-2 text-right text-[12.5px] transition-[background-color,border-color,color,transform,box-shadow] duration-200",
                    isActive
                      ? "bg-gradient-to-l from-[#1E6FD9]/20 via-[#22D3EE]/[0.07] to-transparent border-[rgba(34,211,238,0.22)] text-ds-text-1 shadow-[0_10px_26px_-20px_rgba(34,211,238,0.45)]"
                      : locked
                        ? "cursor-pointer border-transparent text-white/48 hover:bg-white/[0.035]"
                        : "border-transparent text-ds-text-2 hover:bg-white/[0.045] hover:text-ds-text-1"
                  );

                  const inner = (
                    <>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors",
                            isActive
                              ? "border-cyan-300/18 bg-cyan-400/[0.08]"
                              : "border-transparent bg-white/[0.015] group-hover:bg-white/[0.035]",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              isActive ? "text-[#22D3EE]" : "text-white/50"
                            )}
                            strokeWidth={1.7}
                          />
                        </span>
                        {!collapsed && <span className="truncate">{label}</span>}
                      </div>
                      {!collapsed && (
                        locked ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#7C3AED]/35 bg-[#7C3AED]/12 px-1.5 py-0.5 text-[9px] font-semibold text-[#C4B5FD]">
                              متقدم
                            </span>
                            <Lock className="h-3 w-3 text-white/35" strokeWidth={1.6} />
                          </span>
                        ) : (
                          <ArrowLeft
                            className={cn(
                              "h-3 w-3 shrink-0 transition-transform group-hover:-translate-x-0.5",
                              isActive ? "text-[#22D3EE]" : "text-white/22"
                            )}
                            strokeWidth={1.6}
                          />
                        )
                      )}
                    </>
                  );

                  return (
                    <li key={route.id + "-" + (locked ? "locked" : "open")}>
                      {locked ? (
                        <button
                          type="button"
                          onClick={handleLockedVirtualOfficeClick}
                          className={itemClass}
                          title={collapsed ? label + " — باقة متقدم أو مؤسسي" : "متاح في باقة متقدم أو مؤسسي"}
                          aria-label={label + " — متاح في باقة متقدم أو مؤسسي"}
                        >
                          {inner}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          onClick={onMobileClose}
                          className={itemClass}
                          title={collapsed ? label : undefined}
                        >
                          {inner}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-3 pt-2 border-t border-ds-border-soft">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border border-ds-border-soft bg-white/[0.03] p-2.5",
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
              <div className="text-[11px] text-ds-text-3 truncate">{roleLabel || " "}</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-ds-text-3 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50 disabled:hover:text-ds-text-3 disabled:cursor-not-allowed"
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
            className="mt-2 w-full flex justify-center text-ds-text-3 hover:text-red-400 transition-colors disabled:opacity-50 disabled:hover:text-ds-text-3 disabled:cursor-not-allowed"
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
        "sticky top-0 z-40 flex h-screen flex-col p-2 transition-[width] duration-300",
        collapsed ? "w-16" : "w-[82vw] max-w-[310px] lg:w-[248px] lg:max-w-none"
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
            className="absolute inset-0 bg-[#02060d]/70 backdrop-blur-[2px]"
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
