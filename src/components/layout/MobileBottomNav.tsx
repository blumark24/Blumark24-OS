"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  UserCircle,
  Network,
  Users,
  Plus,
  X,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  getRouteLabel,
  type WorkspaceRouteId,
} from "@/lib/features/packageFeatures";
import { MOBILE_ROUTE_LABELS } from "@/lib/tenant/tenantDisplay";
import { CommandOrbPanel } from "@/components/ui/CommandOverlay";
import { QuickActionsList } from "@/components/layout/QuickActionsMenu";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  LayoutDashboard,
  CheckSquare,
  UserCircle,
  Network,
  Users,
  DollarSign,
};

/** Primary destinations flanking the center action (max 4). */
const BOTTOM_SLOT_ORDER: WorkspaceRouteId[] = [
  "dashboard",
  "tasks",
  "org",
  "clients",
];

function isRouteActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href);
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { navRoutes, loading } = useTenantWorkspace();
  const [quickOpen, setQuickOpen] = useState(false);

  const tabRoutes = useMemo(() => {
    if (loading) return [];
    const byId = new Map(navRoutes.map((r) => [r.id, r]));
    const picked: typeof navRoutes = [];
    for (const id of BOTTOM_SLOT_ORDER) {
      const route = byId.get(id);
      if (route) picked.push(route);
      if (picked.length >= 4) break;
    }
    if (picked.length < 4) {
      for (const route of navRoutes) {
        if (picked.some((r) => r.id === route.id)) continue;
        if (route.id === "settings" || route.id === "ai") continue;
        picked.push(route);
        if (picked.length >= 4) break;
      }
    }
    return picked;
  }, [navRoutes, loading]);

  const leftTabs = tabRoutes.slice(0, 2);
  const rightTabs = tabRoutes.slice(2, 4);

  if (loading || tabRoutes.length === 0) return null;

  return (
    <>
      <CommandOrbPanel
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title="إجراء سريع"
      >
        <QuickActionsList onNavigate={() => setQuickOpen(false)} compact />
      </CommandOrbPanel>

      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        dir="rtl"
      >
        <div className="w-full max-w-md pointer-events-auto">
          {/* Compact app dock: 5 fixed slots with the + inside the bar. */}
          <nav
            className={cn(
              "grid grid-cols-5 items-center gap-0",
              "min-h-[64px] px-1.5 py-1.5",
              "rounded-t-[1.35rem] border border-b-0",
              "border-[color:color-mix(in_srgb,var(--border)_72%,transparent)]",
              "[background:color-mix(in_srgb,var(--bg-darkest)_88%,transparent)]",
              "backdrop-blur-2xl",
              "shadow-[0_-10px_24px_-22px_rgba(0,0,0,0.75)]",
            )}
            aria-label="التنقل السريع"
          >
            {leftTabs.map((route) => {
              const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
              const active = isRouteActive(pathname, route.href);
              const label = MOBILE_ROUTE_LABELS[route.id] ?? getRouteLabel(route.id);
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  className={cn(
                    "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1",
                    "touch-manipulation transition-[opacity,transform,background-color,color] duration-100 active:scale-[0.97] active:opacity-75",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/70",
                    active
                      ? "bg-[color:color-mix(in_srgb,var(--accent-teal)_10%,transparent)] text-[color:var(--accent-teal)]"
                      : "text-[color:var(--text-muted)] hover:bg-white/[0.035]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-6 rounded-full bg-[color:var(--accent-teal)] opacity-80" />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-[3.8rem] truncate text-center text-[10px] font-semibold leading-tight">
                    {label}
                  </span>
                </Link>
              );
            })}

            <div className="flex min-h-[44px] items-center justify-center">
              <button
                type="button"
                onClick={() => setQuickOpen((v) => !v)}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full",
                  "border border-[color:color-mix(in_srgb,var(--accent-teal)_38%,transparent)]",
                  "bg-[color:color-mix(in_srgb,var(--accent-blue)_72%,var(--accent-teal)_28%)] text-white",
                  "shadow-[0_8px_18px_-16px_rgba(34,211,238,0.9)]",
                  "touch-manipulation transition-[opacity,transform] duration-100 active:scale-[0.96] active:opacity-80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/75",
                  quickOpen && "scale-[0.98]",
                )}
                aria-label={quickOpen ? "إغلاق الإجراءات السريعة" : "فتح الإجراءات السريعة"}
                aria-expanded={quickOpen}
              >
                {quickOpen ? (
                  <X size={23} className="relative z-[1]" />
                ) : (
                  <Plus size={24} className="relative z-[1]" strokeWidth={2.4} />
                )}
              </button>
            </div>

            {rightTabs.map((route) => {
              const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
              const active = isRouteActive(pathname, route.href);
              const label = MOBILE_ROUTE_LABELS[route.id] ?? getRouteLabel(route.id);
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  className={cn(
                    "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1",
                    "touch-manipulation transition-[opacity,transform,background-color,color] duration-100 active:scale-[0.97] active:opacity-75",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/70",
                    active
                      ? "bg-[color:color-mix(in_srgb,var(--accent-teal)_10%,transparent)] text-[color:var(--accent-teal)]"
                      : "text-[color:var(--text-muted)] hover:bg-white/[0.035]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <span className="absolute top-0 h-0.5 w-6 rounded-full bg-[color:var(--accent-teal)] opacity-80" />
                  )}
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-[3.8rem] truncate text-center text-[10px] font-semibold leading-tight">
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

/** Bottom inset so charts/content clear the floating bar (mobile only). */
export const MOBILE_BOTTOM_NAV_INSET =
  "pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0";
