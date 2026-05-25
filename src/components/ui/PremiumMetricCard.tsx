"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiTheme } from "@/components/ui/workspaceVisual";
import { WS_ICON_ORB } from "@/components/ui/workspaceVisual";
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
 * Dashboard KPI tile — matches OrgPackagePlanCards premium language:
 * gradient border, soft glow, glass background, icon tile, status badge, sparkline.
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
        "group relative w-full min-h-[158px] sm:min-h-[188px] overflow-hidden rounded-3xl transition-all duration-300",
        "border bg-[#070d20]/88 backdrop-blur-xl",
        theme.panelBorder,
        theme.glow,
        "hover:scale-[1.01] active:scale-[0.99]",
        className,
      )}
    >
      {/* Package-card style ambient layers */}
      <div className={cn("pointer-events-none absolute inset-0", theme.ambient)} />
      <div
        className="pointer-events-none absolute -top-12 -right-8 h-28 w-28 rounded-full blur-2xl opacity-55"
        style={{ background: "var(--kpi-orb, rgba(34,211,238,0.35))" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full blur-2xl opacity-35"
        style={{ background: "var(--kpi-orb-secondary, rgba(34,211,238,0.22))" }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_55%_at_50%_0%,rgba(255,255,255,0.08),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-3.5 sm:p-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className={cn(WS_ICON_ORB, "w-10 h-10 sm:w-11 sm:h-11 shrink-0", theme.iconTile, theme.orb)}>
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
                "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full leading-none select-none cursor-pointer touch-manipulation transition-colors border",
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
          <div className="font-heading font-bold tracking-tight text-white leading-[0.9] text-[clamp(1.75rem,6.8vw,3.25rem)] drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
            {value}
          </div>
          <div className="mt-1.5 text-[12.5px] font-semibold text-white/90 leading-snug">{label}</div>
          <div className="text-[10.5px] text-white/45 mt-0.5 leading-snug">{subtitle}</div>
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
            <div className={cn("h-5 w-14 shrink-0 opacity-70", theme.spark)}>
              <Sparkline colorClass={theme.iconColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
