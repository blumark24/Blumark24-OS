"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WS_DASHBOARD_PANEL,
  WS_DASHBOARD_PANEL_HEADER,
  WS_SECTION_TITLE,
  WS_ICON_ORB,
  kpiTheme,
  type KpiAccent,
} from "./workspaceVisual";
import { UI_NO_SELECT_CLASS } from "@/lib/ui/interactionStyles";

export function DashboardPanelCard({
  href,
  ariaLabel,
  accent = "cyan",
  className,
  header,
  badge,
  children,
}: {
  href: string;
  ariaLabel: string;
  accent?: KpiAccent;
  className?: string;
  header: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = kpiTheme(accent);

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(WS_DASHBOARD_PANEL, UI_NO_SELECT_CLASS, className)}
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-75", theme.ambient)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10 p-4 sm:p-5 min-w-0">
        <div className={WS_DASHBOARD_PANEL_HEADER}>
          <h3 className={cn(WS_SECTION_TITLE, "text-sm sm:text-base min-w-0 truncate")}>{header}</h3>
          {badge}
        </div>
        <div className="pointer-events-none min-w-0">{children}</div>
      </div>
    </Link>
  );
}

export function DashboardPanelStatic({
  accent = "cyan",
  className,
  header,
  badge,
  children,
}: {
  accent?: KpiAccent;
  className?: string;
  header: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = kpiTheme(accent);

  return (
    <div
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#070d20]/88 backdrop-blur-xl",
        "shadow-[0_14px_40px_-18px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-75", theme.ambient)} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10 p-4 sm:p-5 min-w-0">
        <div className={WS_DASHBOARD_PANEL_HEADER}>
          <h3 className={cn(WS_SECTION_TITLE, "text-sm sm:text-base min-w-0 truncate")}>{header}</h3>
          {badge}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function DashboardPanelIconBadge({
  icon: Icon,
  accent = "cyan",
}: {
  icon: LucideIcon;
  accent?: KpiAccent;
}) {
  const theme = kpiTheme(accent);
  return (
    <span className={cn(WS_ICON_ORB, "h-8 w-8 shrink-0", theme.orb)}>
      <Icon size={15} className={theme.iconColor} />
    </span>
  );
}
