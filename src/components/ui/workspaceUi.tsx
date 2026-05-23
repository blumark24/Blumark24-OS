"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  WS_CARD,
  WS_ICON_ORB,
  WS_MUTED,
  WS_SECTION_TITLE,
  WS_SURFACE,
  WS_TINTS,
  SPARK_POINTS,
  kpiTheme,
  type KpiAccent,
  type KpiTheme,
} from "./workspaceVisual";

// ─── Sparkline (decorative) ───────────────────────────────────────────────────

export function Sparkline({ colorClass }: { colorClass: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      preserveAspectRatio="none"
      className={cn("h-full w-full", colorClass)}
      aria-hidden="true"
    >
      <polyline
        points={SPARK_POINTS}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Page hero ────────────────────────────────────────────────────────────────

export function PageHero({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(WS_SURFACE, "p-4 sm:p-5 lg:p-6", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(110%_120%_at_8%_125%,rgba(124,58,237,0.12),transparent_55%)]" />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={cn(WS_SECTION_TITLE, "text-xl sm:text-2xl")}>{title}</h1>
          {subtitle && <p className={cn(WS_MUTED, "text-sm mt-1")}>{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
      </div>
    </section>
  );
}

// ─── KPI stat card ────────────────────────────────────────────────────────────

export function KpiStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
  trend,
  showLive = true,
  showSparkline = true,
  onClick,
  className,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accent: KpiAccent;
  trend?: string;
  showLive?: boolean;
  showSparkline?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const theme = kpiTheme(accent);
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        WS_CARD,
        "group w-full min-h-[130px] sm:min-h-[150px] p-4 text-right transition-shadow duration-300",
        theme.glow,
        onClick && "cursor-pointer hover:brightness-110",
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(WS_ICON_ORB, "w-10 h-10 shrink-0", theme.iconTile)}>
            <Icon size={18} className={theme.iconColor} />
          </span>
          {showLive && (
            <span className={cn("shrink-0", theme.livePill, "text-[10px] px-2 py-0.5 rounded-full")}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse me-1" />
              مباشر
            </span>
          )}
        </div>
        <p className={cn(WS_MUTED, "text-xs mt-3")}>{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-0.5 tabular-nums">{value}</p>
        {(subtitle || trend) && (
          <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs">
            {subtitle && <span className={WS_MUTED}>{subtitle}</span>}
            {trend && <span className={theme.accent}>{trend}</span>}
          </div>
        )}
        {showSparkline && (
          <div className="mt-2 h-8 opacity-60">
            <Sparkline colorClass={theme.spark} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

/** Compact empty state inside an existing glass panel (charts/tables). */
export function WorkspaceEmptyInline({
  icon: Icon,
  title,
  accent = "cyan",
  className,
}: {
  icon: React.ElementType;
  title: string;
  accent?: KpiAccent;
  className?: string;
}) {
  const theme = kpiTheme(accent);
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 text-center", className)}>
      <span className={cn(WS_ICON_ORB, "w-10 h-10", theme.orb)}>
        <Icon size={18} className={theme.iconColor} />
      </span>
      <p className={cn(WS_MUTED, "text-sm")}>{title}</p>
    </div>
  );
}

export function WorkspaceEmpty({
  icon: Icon,
  title,
  subtitle,
  action,
  accent = "cyan",
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: KpiAccent;
}) {
  const theme = kpiTheme(accent);
  return (
    <div className={cn(WS_CARD, "p-8 sm:p-10 text-center flex flex-col items-center gap-3")}>
      <span className={cn(WS_ICON_ORB, "w-14 h-14", theme.orb)}>
        <Icon size={26} className={theme.iconColor} />
      </span>
      <h3 className={cn(WS_SECTION_TITLE, "text-base")}>{title}</h3>
      {subtitle && <p className={cn(WS_MUTED, "text-sm max-w-sm")}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ─── Stat pill (hero chips) ───────────────────────────────────────────────────

export function StatPill({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tint: KpiAccent;
}) {
  const t = WS_TINTS[tint];
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
      <span className={cn(WS_ICON_ORB, "w-7 h-7 shrink-0", t.orb)}>
        <Icon size={13} className={t.icon} />
      </span>
      <div className="leading-tight">
        <div className="whitespace-nowrap text-[10px] text-[#8ba3c7]">{label}</div>
        <div className="whitespace-nowrap text-[13px] font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

// ─── Quick action tile ────────────────────────────────────────────────────────

export function QuickActionTile({
  href,
  label,
  icon: Icon,
  tint,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  tint: KpiAccent;
}) {
  const t = WS_TINTS[tint];
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition-colors hover:border-white/15 hover:bg-white/[0.06] min-h-[72px]"
    >
      <span className={cn(WS_ICON_ORB, "w-11 h-11 shrink-0", t.orb)}>
        <Icon size={19} className={t.icon} />
      </span>
      <span className="w-full truncate text-[11.5px] font-medium text-white/85">{label}</span>
    </Link>
  );
}

export function GlassPanel({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5", className)}>
      {title ? <h2 className={cn(WS_SECTION_TITLE, "text-base mb-4")}>{title}</h2> : null}
      {children}
    </div>
  );
}

export type { KpiTheme };
