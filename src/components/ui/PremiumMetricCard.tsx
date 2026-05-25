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
}

/**
 * Dashboard KPI tile — premium glass card with icon tile, status badge, sparkline.
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
        "min-h-[168px] sm:min-h-[188px]",
        theme.panelBorder,
        theme.glow,
        className,
      )}
    >
      {/* Ambient layers */}
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div
        className="pointer-events-none absolute -top-12 -right-8 h-28 w-28 rounded-full blur-2xl opacity-40"
        style={{ background: "var(--kpi-orb, rgba(34,211,238,0.25))" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full blur-2xl opacity-25"
        style={{ background: "var(--kpi-orb-secondary, rgba(34,211,238,0.15))" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_55%_at_50%_0%,rgba(255,255,255,0.06),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-4 sm:p-5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className={cn(WS_ICON_ORB, "w-[42px] h-[42px] shrink-0", theme.iconTile, theme.orb)}>
            <Icon size={18} className={iconColor} />
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
                "cursor-pointer touch-manipulation select-none transition-colors hover:border-[rgba(34,211,238,0.28)]",
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
          <div className={cn(WS_METRIC_VALUE, "drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]")}>
            {value}
          </div>
          <div className={cn(WS_METRIC_LABEL, "mt-2 font-semibold text-white/90 line-clamp-2")}>{label}</div>
          <div className="text-[11px] text-white/45 mt-1 leading-snug line-clamp-1">{subtitle}</div>
        </div>

        <div className="space-y-2 min-w-0">
          {footer && <div className="min-w-0 text-[11px]">{footer}</div>}
          <div className="flex items-end justify-between gap-2">
            <div className={cn("h-1 flex-1 rounded-full overflow-hidden bg-white/[0.08]", theme.accent)}>
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 bg-gradient-to-l from-current to-transparent opacity-90",
                )}
                style={{ width: progressWidth ?? "42%" }}
              />
            </div>
            <div className={cn("h-5 w-14 shrink-0 opacity-60", theme.spark)}>
              <Sparkline colorClass={theme.iconColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
