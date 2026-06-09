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
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none flex justify-center px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5px)" }}
        dir="rtl"
      >
        <div className="relative w-full max-w-sm pointer-events-auto">
          {/* Center FAB — elegant glowing orb, slightly embedded into the dock */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-[2]">
            <button
              type="button"
              onClick={() => setQuickOpen((v) => !v)}
              className={cn(
                "relative flex h-[3.375rem] w-[3.375rem] items-center justify-center rounded-full",
                "bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] text-white",
                "ring-1 ring-white/20",
                "shadow-[0_8px_24px_-10px_rgba(34,211,238,0.55)]",
                "transition-transform duration-200 ease-out active:scale-95 motion-reduce:transition-none",
                quickOpen && "rotate-45 scale-105",
              )}
              aria-label={quickOpen ? "إغلاق الإنشاء السريع" : "إنشاء جديد"}
              aria-expanded={quickOpen}
            >
              <span
                className={cn(
                  "absolute -inset-1 rounded-full blur-md transition-opacity",
                  quickOpen ? "opacity-50" : "opacity-30",
                )}
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.45), transparent 70%)",
                }}
                aria-hidden
              />
              {quickOpen ? (
                <X size={22} className="relative z-[1]" />
              ) : (
                <Plus size={24} className="relative z-[1]" strokeWidth={2.4} />
              )}
            </button>
          </div>

          {/* Floating Apple-style glass dock */}
          <nav
            className={cn(
              "grid grid-cols-5 items-center gap-0 rounded-[1.85rem] border border-white/[0.08]",
              "bg-[rgba(4,12,28,0.72)] backdrop-blur-2xl",
              "shadow-[0_10px_30px_-14px_rgba(0,0,0,0.55),0_0_22px_-14px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
              "px-2 h-16",
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
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl min-h-[44px] touch-manipulation",
                    "transition-transform duration-200 ease-out active:scale-[0.96] motion-reduce:transition-none",
                    active ? "text-[#22d3ee]" : "text-white/50 hover:text-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full px-3 py-0.5 transition-all duration-200 ease-out motion-reduce:transition-none",
                      active
                        ? "bg-cyan-400/10 shadow-[0_0_14px_-3px_rgba(34,211,238,0.55)]"
                        : "bg-transparent",
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                  </span>
                  <span className="text-[9.5px] font-medium leading-none truncate max-w-[3.25rem] text-center leading-tight">
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* Center spacer for FAB */}
            <div className="min-h-[44px]" aria-hidden />

            {rightTabs.map((route) => {
              const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
              const active = isRouteActive(pathname, route.href);
              const label = MOBILE_ROUTE_LABELS[route.id] ?? getRouteLabel(route.id);
              return (
                <Link
                  key={route.id}
                  href={route.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-xl min-h-[44px] touch-manipulation",
                    "transition-transform duration-200 ease-out active:scale-[0.96] motion-reduce:transition-none",
                    active ? "text-[#22d3ee]" : "text-white/50 hover:text-white/80",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center rounded-full px-3 py-0.5 transition-all duration-200 ease-out motion-reduce:transition-none",
                      active
                        ? "bg-cyan-400/10 shadow-[0_0_14px_-3px_rgba(34,211,238,0.55)]"
                        : "bg-transparent",
                    )}
                  >
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                  </span>
                  <span className="text-[9.5px] font-medium leading-none truncate max-w-[3.25rem] text-center leading-tight">
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

/** Bottom inset so charts/content clear the floating dock + FAB (mobile only). */
export const MOBILE_BOTTOM_NAV_INSET =
  "pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0";
