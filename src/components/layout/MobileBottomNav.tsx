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
  const hideFab = pathname.startsWith("/virtual-office");

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
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center px-3"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        dir="rtl"
      >
        <div className="relative w-full max-w-md pointer-events-auto">
          {/* Center FAB — hidden on /virtual-office to avoid covering office map */}
          {!hideFab && (
            <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-[2]">
              <button
                type="button"
                onClick={() => setQuickOpen((v) => !v)}
                className={cn(
                  "relative flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full",
                  "bg-gradient-to-br from-[#1E6FD9] via-[#2563EB] to-[#22D3EE] text-white",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.22),0_12px_40px_-8px_rgba(34,211,238,0.68),0_0_38px_-12px_rgba(30,111,217,0.85)]",
                  "transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80",
                  quickOpen && "rotate-45 scale-105",
                )}
                aria-label={quickOpen ? "إغلاق الإجراءات السريعة" : "فتح الإجراءات السريعة"}
                aria-expanded={quickOpen}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-full transition-opacity",
                    quickOpen ? "opacity-60" : "opacity-40 animate-pulse",
                  )}
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.55), transparent 70%)",
                  }}
                  aria-hidden
                />
                {quickOpen ? (
                  <X size={22} className="relative z-[1]" />
                ) : (
                  <Plus size={24} className="relative z-[1]" strokeWidth={2.5} />
                )}
              </button>
            </div>
          )}

          {/* Floating glass bar */}
          <nav
            className={cn(
              hideFab ? "grid-cols-4 h-[52px] items-center px-2 py-1.5" : "grid-cols-5 items-end px-2 pt-2.5 pb-2.5 min-h-[4.35rem]",
              "gap-0 rounded-[1.35rem] border border-cyan-300/[0.14]",
              "bg-[linear-gradient(180deg,rgba(9,22,43,0.94),rgba(4,11,24,0.92))] backdrop-blur-3xl",
              "shadow-[0_-8px_42px_-12px_rgba(0,0,0,0.68),0_0_28px_-18px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]",
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
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-all min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                    hideFab ? "py-1" : "py-1.5",
                    active
                      ? "bg-cyan-300/[0.08] text-[#22d3ee]"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white/80",
                  )}
                >
                  <Icon size={hideFab ? 22 : 20} strokeWidth={active ? 2.2 : 1.6} />
                  <span className="max-w-[3.5rem] truncate text-center text-[9px] font-medium leading-tight">
                    {label}
                  </span>
                  {active && !hideFab && (
                    <span className="w-1 h-1 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
                  )}
                </Link>
              );
            })}

            {/* Center spacer for FAB — omitted on /virtual-office */}
            {!hideFab && <div className="min-h-[44px]" aria-hidden />}

            {rightTabs.map((route) => {
              const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
              const active = isRouteActive(pathname, route.href);
              const label = MOBILE_ROUTE_LABELS[route.id] ?? getRouteLabel(route.id);
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-all min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
                    hideFab ? "py-1" : "py-1.5",
                    active
                      ? "bg-cyan-300/[0.08] text-[#22d3ee]"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white/80",
                  )}
                >
                  <Icon size={hideFab ? 22 : 20} strokeWidth={active ? 2.2 : 1.6} />
                  <span className="max-w-[3.5rem] truncate text-center text-[9px] font-medium leading-tight">
                    {label}
                  </span>
                  {active && !hideFab && (
                    <span className="w-1 h-1 rounded-full bg-[#22d3ee] shadow-[0_0_8px_#22d3ee]" />
                  )}
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
  "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0";
