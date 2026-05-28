"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  WS_CARD,
  WS_CARD_HOVER,
  WS_CARD_PADDING,
  WS_CARD_SHEEN,
  WS_ICON_ORB,
  WS_ICON_TILE_SM,
  WS_INNER_CARD,
  WS_METRIC_LABEL,
  WS_METRIC_VALUE,
  WS_MUTED,
  WS_SECTION_TITLE,
  WS_STATUS_CHIP,
  WS_SUBTEXT,
  WS_SURFACE,
  WS_SURFACE_GLOW,
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
      <div className={WS_SURFACE_GLOW} />
      <div className={WS_CARD_SHEEN} />
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
        onClick && WS_CARD_HOVER,
        "group w-full min-h-[140px] sm:min-h-[160px] p-4 sm:p-5 text-right",
        theme.glow,
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div className={WS_CARD_SHEEN} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <span className={cn(WS_ICON_ORB, "w-[42px] h-[42px] shrink-0", theme.iconTile, theme.orb)}>
            <Icon size={18} className={theme.iconColor} />
          </span>
          {showLive && (
            <span className={cn(WS_STATUS_CHIP, "shrink-0 text-[10px]", theme.livePill)}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              مباشر
            </span>
          )}
        </div>
        <p className={cn(WS_METRIC_LABEL, "mt-3")}>{label}</p>
        <p className={cn(WS_METRIC_VALUE, "mt-1 tabular-nums")}>{value}</p>
        {(subtitle || trend) && (
          <div className="mt-auto pt-2 flex items-center justify-between gap-2 text-xs">
            {subtitle && <span className={WS_MUTED}>{subtitle}</span>}
            {trend && <span className={theme.accent}>{trend}</span>}
          </div>
        )}
        {showSparkline && (
          <div className="mt-2 h-8 opacity-50">
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
    <div className={cn("flex flex-col items-center justify-center gap-3 text-center", className)}>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_70%)] blur-md"
          aria-hidden
        />
        <span className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, "relative w-11 h-11", theme.orb)}>
          <Icon size={20} className={theme.iconColor} />
        </span>
      </div>
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
    <div className={cn(WS_CARD, "p-8 sm:p-10 text-center flex flex-col items-center gap-4")}>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.20),transparent_70%)] blur-lg"
          aria-hidden
        />
        <span className={cn(WS_ICON_ORB, "relative w-14 h-14", theme.orb)}>
          <Icon size={26} className={theme.iconColor} />
        </span>
      </div>
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
    <div className={cn(WS_INNER_CARD, "inline-flex items-center gap-2.5 px-3 py-2")}>
      <span className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, "w-7 h-7", t.orb)}>
        <Icon size={13} className={t.icon} />
      </span>
      <div className="leading-tight min-w-0">
        <div className={cn("whitespace-nowrap text-[10px]", WS_SUBTEXT)}>{label}</div>
        <div className="whitespace-nowrap text-[13px] font-bold text-white tabular-nums">{value}</div>
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
      className={cn(
        WS_INNER_CARD,
        WS_CARD_HOVER,
        "group flex min-w-0 flex-col items-center justify-center gap-2 p-3 text-center min-h-[72px]",
      )}
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
    <div className={cn(WS_CARD, WS_CARD_PADDING, className)}>
      <div className={WS_CARD_SHEEN} />
      {title ? (
        <h2 className={cn(WS_SECTION_TITLE, "relative z-10 text-base mb-4 pb-3 border-b border-[rgba(148,163,184,0.10)]")}>
          {title}
        </h2>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export type { KpiTheme };
