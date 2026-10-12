"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiTheme } from "@/components/ui/workspaceVisual";
import {
  WS_CARD,
  WS_CARD_HOVER,
  WS_ICON_ORB,
  WS_METRIC_LABEL,
  WS_METRIC_VALUE,
  WS_STATUS_CHIP,
} from "@/components/ui/workspaceVisual";
import { Sparkline } from "@/components/ui/workspaceUi";

const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;

export interface PremiumMetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  theme: KpiTheme;
  progress?: number;
  footer?: React.ReactNode;
  onLiveClick?: () => void;
  className?: string;
  density?: "comfortable" | "compact";
}

/**
 * Dashboard KPI tile. Compact density is the operational default where
 * multiple signals need to fit above the fold without losing hierarchy.
 */
export function PremiumMetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  theme,
  progress,
  footer,
  onLiveClick,
  className,
  density = "comfortable",
}: PremiumMetricCardProps) {
  const compact = density === "compact";
  const progressWidth =
    progress === undefined ? undefined : String(Math.min(100, Math.max(0, progress))) + "%";

  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col overflow-hidden",
        WS_CARD,
        WS_CARD_HOVER,
        compact ? "min-h-[122px] sm:min-h-[132px]" : "min-h-[168px] sm:min-h-[188px]",
        theme.panelBorder,
        compact ? "shadow-[0_10px_28px_-18px_rgba(0,0,0,.55)]" : theme.glow,
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div
        className={cn(
          "pointer-events-none absolute rounded-full blur-2xl",
          compact ? "-right-5 -top-8 h-20 w-20 opacity-25" : "-right-8 -top-12 h-28 w-28 opacity-40",
        )}
        style={{ background: "var(--kpi-orb, rgba(34,211,238,0.25))" }}
        aria-hidden
      />
      {!compact ? (
        <div
          className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full blur-2xl opacity-25"
          style={{ background: "var(--kpi-orb-secondary, rgba(34,211,238,0.15))" }}
          aria-hidden
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_55%_at_50%_0%,rgba(255,255,255,0.05),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div
        className={cn(
          "relative z-10 flex h-full min-w-0 flex-col justify-between",
          compact ? "gap-2 p-3" : "gap-3 p-4 sm:p-5",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div
            className={cn(
              WS_ICON_ORB,
              compact ? "h-8 w-8 rounded-xl" : "h-[42px] w-[42px]",
              "shrink-0",
              theme.iconTile,
              theme.orb,
            )}
          >
            <Icon size={compact ? 15 : 18} className={iconColor} />
          </div>

          {onLiveClick ? (
            <button
              type="button"
              draggable={false}
              aria-label={"عرض تفاصيل " + label}
              onMouseDown={(event) => event.preventDefault()}
              onTouchStart={(event) => event.currentTarget.blur()}
              onClick={onLiveClick}
              className={cn(
                WS_STATUS_CHIP,
                "cursor-pointer touch-manipulation select-none transition-colors hover:border-[rgba(34,211,238,0.28)]",
                compact && "min-h-6 px-2 text-[10px]",
                theme.livePill,
              )}
              style={DISABLE_TEXT_SELECT_STYLE}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              <span className="select-none" style={DISABLE_TEXT_SELECT_STYLE}>
                مباشر
              </span>
            </button>
          ) : null}
        </div>

        <div className="min-w-0">
          <div
            className={cn(
              compact
                ? "font-heading text-[clamp(1.45rem,3vw,2rem)] font-extrabold leading-none tracking-tight text-white"
                : WS_METRIC_VALUE,
              "drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]",
            )}
          >
            {value}
          </div>
          <div
            className={cn(
              WS_METRIC_LABEL,
              compact
                ? "mt-1 line-clamp-1 text-[12px] font-semibold text-white/90"
                : "mt-2 line-clamp-2 font-semibold text-white/90",
            )}
          >
            {label}
          </div>
          <div className={cn("mt-0.5 line-clamp-1 leading-snug text-white/45", compact ? "text-[10px]" : "text-[11px]")}>
            {subtitle}
          </div>
        </div>

        <div className={cn("min-w-0", compact ? "space-y-1" : "space-y-2")}>
          {footer ? (
            <div className={cn("min-w-0", compact ? "hidden text-[10px] lg:block" : "text-[11px]")}>{footer}</div>
          ) : null}
          <div className="flex items-end justify-between gap-2">
            <div className={cn("flex-1 overflow-hidden rounded-full bg-white/[0.08]", compact ? "h-[3px]" : "h-1", theme.accent)}>
              <div
                className="h-full rounded-full bg-gradient-to-l from-current to-transparent opacity-90 transition-all duration-500"
                style={{ width: progressWidth ?? "42%" }}
              />
            </div>
            {!compact ? (
              <div className={cn("h-5 w-14 shrink-0 opacity-60", theme.spark)}>
                <Sparkline colorClass={theme.iconColor} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
