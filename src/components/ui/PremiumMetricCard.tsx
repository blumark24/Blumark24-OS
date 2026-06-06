"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiTheme } from "@/components/ui/workspaceVisual";
import {
  WS_CARD,
  WS_CARD_HOVER,
  WS_CARD_PADDING,
  WS_CARD_SHEEN,
  WS_ICON_ORB,
  WS_ICON_TILE_MD,
  WS_METRIC_LABEL,
  WS_METRIC_VALUE,
  WS_STATUS_CHIP,
  WS_SUBTEXT,
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
}

/**
 * Dashboard KPI tile — executive glass metric with accent line and sparkline.
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
}: PremiumMetricCardProps) {
  const progressWidth =
    progress === undefined ? undefined : `${Math.min(100, Math.max(0, progress))}%`;

  return (
    <div
      className={cn(
        "group relative w-full h-full flex flex-col overflow-hidden",
        WS_CARD,
        WS_CARD_HOVER,
        "min-h-[172px] sm:min-h-[192px]",
        theme.panelBorder,
        theme.glow,
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div className={WS_CARD_SHEEN} />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-l from-[rgba(34,211,238,0.55)] via-[rgba(30,111,217,0.35)] to-transparent opacity-80"
        aria-hidden
      />

      <div className={cn("relative z-10 flex h-full flex-col justify-between gap-3 min-w-0", WS_CARD_PADDING, "py-4 sm:py-5")}>
        <div className="flex items-start justify-between gap-2">
          <div className={cn(WS_ICON_ORB, WS_ICON_TILE_MD, theme.iconTile, theme.orb)}>
            <Icon size={19} className={iconColor} />
          </div>
          {onLiveClick ? (
            <button
              type="button"
              draggable={false}
              aria-label={`عرض تفاصيل ${label}`}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.currentTarget.blur()}
              onClick={onLiveClick}
              className={cn(
                WS_STATUS_CHIP,
                "cursor-pointer touch-manipulation select-none transition-colors hover:border-[rgba(34,211,238,0.34)]",
                theme.livePill,
              )}
              style={DISABLE_TEXT_SELECT_STYLE}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              <span className="select-none" style={DISABLE_TEXT_SELECT_STYLE}>
                مباشر
              </span>
            </button>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className={cn(WS_METRIC_VALUE, "drop-shadow-[0_2px_14px_rgba(0,0,0,0.40)] tabular-nums")}>
            {value}
          </div>
          <div className={cn(WS_METRIC_LABEL, "mt-2 line-clamp-2")}>{label}</div>
          <div className={cn(WS_SUBTEXT, "text-[11px] mt-1 leading-snug line-clamp-1")}>{subtitle}</div>
        </div>

        <div className="space-y-2 min-w-0">
          {footer && <div className={cn("min-w-0 text-[11px]", theme.accent)}>{footer}</div>}
          <div className="flex items-end justify-between gap-2">
            <div className="h-1 flex-1 rounded-full overflow-hidden bg-white/[0.08]">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-l from-[#22d3ee] via-[#1e6fd9] to-transparent opacity-90"
                style={{ width: progressWidth ?? "42%" }}
              />
            </div>
            <div className={cn("h-5 w-14 shrink-0 opacity-70", theme.spark)}>
              <Sparkline colorClass={theme.iconColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
