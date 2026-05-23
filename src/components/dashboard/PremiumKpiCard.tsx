"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import {
  WS_CARD,
  WS_ICON_ORB,
  PREMIUM_KPI_FRAME,
  type BoardKey,
  type KpiTheme,
} from "@/components/ui/workspaceVisual";
import { Sparkline } from "@/components/ui/workspaceUi";

const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;

export type PremiumKpiCardProps = {
  boardKey: BoardKey;
  theme: KpiTheme;
  label: string;
  insight: string;
  value: string;
  footer: string;
  icon: ElementType;
  iconColor: string;
  onLiveClick: () => void;
  footerExtra?: React.ReactNode;
};

export default function PremiumKpiCard({
  boardKey,
  theme,
  label,
  insight,
  value,
  footer,
  icon: Icon,
  iconColor,
  onLiveClick,
  footerExtra,
}: PremiumKpiCardProps) {
  return (
    <div className={cn("relative rounded-[22px] p-[1px] shadow-lg", PREMIUM_KPI_FRAME[boardKey])}>
      <div
        className={cn(
          WS_CARD,
          "group relative min-h-[158px] w-full rounded-[21px] sm:min-h-[188px]",
          theme.glow,
        )}
      >
        <div className={cn("pointer-events-none absolute inset-0 rounded-[21px]", theme.ambient)} />
        <div className="pointer-events-none absolute inset-0 rounded-[21px] bg-[radial-gradient(100%_70%_at_50%_0%,rgba(255,255,255,0.07),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              draggable={false}
              aria-label={`عرض تفاصيل ${label}`}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.currentTarget.blur()}
              onClick={onLiveClick}
              className={cn(
                "inline-flex touch-manipulation select-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none transition-colors",
                theme.livePill,
              )}
              style={DISABLE_TEXT_SELECT_STYLE}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
              مباشر
            </button>
            <div className={cn(WS_ICON_ORB, "h-10 w-10 shrink-0 sm:h-11 sm:w-11", theme.orb)}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white/55">{insight}</p>
            <div className="mt-1 font-heading text-[clamp(1.75rem,6.5vw,3rem)] font-bold leading-[0.92] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.35)]">
              {value}
            </div>
            <p className="mt-1.5 truncate text-[13px] font-semibold text-white/90">{label}</p>
          </div>

          <div className="flex min-w-0 items-end justify-between gap-2 border-t border-white/[0.06] pt-2.5">
            <div className="min-w-0 flex-1 text-[11px] leading-snug">
              {footerExtra ?? (
                <span className={cn("line-clamp-2", theme.accent)}>{footer}</span>
              )}
            </div>
            <div className="h-6 w-14 shrink-0 opacity-55">
              <Sparkline colorClass={theme.spark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
