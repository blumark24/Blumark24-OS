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
import { motion, useReducedMotion } from "framer-motion";
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

// Shared spring for the sliding active pill layout transition
const PILL_SPRING = { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.8 };

// Fast ease for tap press/release
const TAP_EASE = [0.4, 0, 0.2, 1] as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { navRoutes, loading } = useTenantWorkspace();
  const [quickOpen, setQuickOpen] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

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
              const label =
                MOBILE_ROUTE_LABELS[route.id as WorkspaceRouteId] ??
                getRouteLabel(route.id as WorkspaceRouteId);
              return (
                <motion.div
                  key={route.id}
                  style={{ position: "relative" }}
                  whileTap={reducedMotion ? {} : { scale: 0.93, opacity: 0.82 }}
                  transition={{ duration: 0.14, ease: TAP_EASE }}
                >
                  <Link
                    href={route.href}
                    className={cn(
                      "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1",
                      "touch-manipulation transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/70",
                      active
                        ? "text-[color:var(--accent-teal)]"
                        : "text-[color:var(--text-muted)] hover:bg-white/[0.035]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <>
                        <motion.span
                          layoutId="dock-active-pill"
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: "color-mix(in srgb, var(--accent-teal) 10%, transparent)" }}
                          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
                          aria-hidden
                        />
                        <motion.span
                          layoutId="dock-active-bar"
                          className="absolute top-0 h-0.5 w-6 rounded-full opacity-80"
                          style={{ background: "var(--accent-teal)" }}
                          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
                          aria-hidden
                        />
                      </>
                    )}
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.25 : 1.75}
                      className="relative z-[1] transition-[stroke-width] duration-150"
                    />
                    <span className="relative z-[1] max-w-[3.8rem] truncate text-center text-[10px] font-semibold leading-tight">
                      {label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}

            {/* Center FAB — inline in dock */}
            <div className="flex min-h-[44px] items-center justify-center">
              <motion.button
                type="button"
                onClick={() => setQuickOpen((v) => !v)}
                whileTap={reducedMotion ? {} : { scale: 0.90, opacity: 0.85 }}
                animate={
                  reducedMotion
                    ? {}
                    : { rotate: quickOpen ? 45 : 0, scale: quickOpen ? 0.98 : 1 }
                }
                transition={{ duration: 0.16, ease: TAP_EASE }}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-full",
                  "border border-[color:color-mix(in_srgb,var(--accent-teal)_38%,transparent)]",
                  "bg-[color:color-mix(in_srgb,var(--accent-blue)_72%,var(--accent-teal)_28%)] text-white",
                  "shadow-[0_8px_18px_-16px_rgba(34,211,238,0.9)]",
                  "touch-manipulation",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/75",
                )}
                aria-label={quickOpen ? "إغلاق الإجراءات السريعة" : "فتح الإجراءات السريعة"}
                aria-expanded={quickOpen}
              >
                {quickOpen ? (
                  <X size={23} className="relative z-[1]" />
                ) : (
                  <Plus size={24} className="relative z-[1]" strokeWidth={2.4} />
                )}
              </motion.button>
            </div>

            {rightTabs.map((route) => {
              const Icon = ICON_BY_NAME[route.iconName] ?? LayoutDashboard;
              const active = isRouteActive(pathname, route.href);
              const label =
                MOBILE_ROUTE_LABELS[route.id as WorkspaceRouteId] ??
                getRouteLabel(route.id as WorkspaceRouteId);
              return (
                <motion.div
                  key={route.id}
                  style={{ position: "relative" }}
                  whileTap={reducedMotion ? {} : { scale: 0.93, opacity: 0.82 }}
                  transition={{ duration: 0.14, ease: TAP_EASE }}
                >
                  <Link
                    href={route.href}
                    className={cn(
                      "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1",
                      "touch-manipulation transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-teal)]/70",
                      active
                        ? "text-[color:var(--accent-teal)]"
                        : "text-[color:var(--text-muted)] hover:bg-white/[0.035]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active && (
                      <>
                        <motion.span
                          layoutId="dock-active-pill"
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: "color-mix(in srgb, var(--accent-teal) 10%, transparent)" }}
                          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
                          aria-hidden
                        />
                        <motion.span
                          layoutId="dock-active-bar"
                          className="absolute top-0 h-0.5 w-6 rounded-full opacity-80"
                          style={{ background: "var(--accent-teal)" }}
                          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
                          aria-hidden
                        />
                      </>
                    )}
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.25 : 1.75}
                      className="relative z-[1] transition-[stroke-width] duration-150"
                    />
                    <span className="relative z-[1] max-w-[3.8rem] truncate text-center text-[10px] font-semibold leading-tight">
                      {label}
                    </span>
                  </Link>
                </motion.div>
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
