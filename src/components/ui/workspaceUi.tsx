"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  WS_CARD,
  WS_HERO,
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

/* ─── Sparkline (decorative SVG, single color) ─────────────────────────── */

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

/* ─── Page hero (Crystal L1) ───────────────────────────────────────────── */

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
    <section className={cn(WS_HERO, "p-4 sm:p-5 lg:p-6", className)}>
      {/* Subtle prism wash — cyan top, violet bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,var(--ws-cyan-soft),transparent_55%),radial-gradient(110%_120%_at_8%_125%,var(--ws-violet-soft),transparent_55%)]"
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className={cn(WS_SECTION_TITLE, "text-xl sm:text-2xl")}>{title}</h1>
          {subtitle && <p className={cn(WS_MUTED, "text-sm mt-1")}>{subtitle}</p>}
        </div>
        {children && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── KPI stat card (Crystal L3) ───────────────────────────────────────── */

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
        theme.card,
        "group w-full min-h-[130px] sm:min-h-[150px] p-4 text-start transition-shadow duration-300",
        onClick && "cursor-pointer hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ws-border-focus)]",
        className,
      )}
    >
      {/* Accent prism wash */}
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", theme.wash)} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(WS_ICON_ORB, "w-10 h-10 shrink-0", theme.iconTile)}>
            <Icon size={18} className={theme.iconColor} />
          </span>
          {showLive && (
            <span className={cn("shrink-0 text-[10px] px-2 py-0.5 rounded-full", theme.livePill)}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse me-1" />
              مباشر
            </span>
          )}
        </div>
        <p className={cn(WS_MUTED, "text-xs mt-3")}>{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-[color:var(--ws-text-primary)] mt-0.5 tabular-nums">
          {value}
        </p>
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

/* ─── Empty states ─────────────────────────────────────────────────────── */

/** Compact empty state inside an existing panel (charts/tables). */
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

/** Full premium empty state (its own card). */
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
      {subtitle && (
        <p className={cn(WS_MUTED, "text-sm max-w-sm")}>{subtitle}</p>
      )}
      {action}
    </div>
  );
}

/* ─── Stat pill (hero chips) ───────────────────────────────────────────── */

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
    <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] px-2.5 py-1.5">
      <span className={cn(WS_ICON_ORB, "w-7 h-7 shrink-0", t.orb)}>
        <Icon size={13} className={t.icon} />
      </span>
      <div className="leading-tight">
        <div className="whitespace-nowrap text-[10px] text-[color:var(--ws-text-secondary)]">{label}</div>
        <div className="whitespace-nowrap text-[13px] font-bold text-[color:var(--ws-text-primary)]">{value}</div>
      </div>
    </div>
  );
}

/* ─── Quick action tile ────────────────────────────────────────────────── */

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
      className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)] p-3 text-center transition-colors hover:border-[var(--ws-border-strong)] min-h-[72px] touch-manipulation"
    >
      <span className={cn(WS_ICON_ORB, "w-11 h-11 shrink-0", t.orb)}>
        <Icon size={19} className={t.icon} />
      </span>
      <span className="w-full truncate text-[11.5px] font-medium text-[color:var(--ws-text-primary)]/90">
        {label}
      </span>
    </Link>
  );
}

/* ─── Glass panel (Crystal L2 with optional title) ─────────────────────── */

export function GlassPanel({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className={cn(WS_SECTION_TITLE, "text-base")}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/* ─── Glass table wrapper (consistent chrome for any <table>) ──────────── */

export function GlassTable({
  children,
  className,
  minWidth = 640,
  title,
  meta,
}: {
  children: React.ReactNode;
  className?: string;
  /** Minimum table width in pixels (forces horizontal scroll inside the wrapper). */
  minWidth?: number;
  title?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className={cn(WS_CARD, "p-0", className)}>
      {(title || meta) && (
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-[var(--ws-border-subtle)]">
          {title && <h3 className={cn(WS_SECTION_TITLE, "text-base")}>{title}</h3>}
          {meta}
        </div>
      )}
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Re-exports ───────────────────────────────────────────────────────── */

export type { KpiTheme };
// Re-export so callers that imported WS_SURFACE from this file keep working.
export { WS_SURFACE };
