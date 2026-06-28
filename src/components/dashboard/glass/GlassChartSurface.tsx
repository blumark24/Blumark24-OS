import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassChartSurfaceProps {
  title: string;
  /** Optional right-aligned chip (e.g. "آخر 12 شهر"). */
  rightChip?: ReactNode;
  /** Optional left-aligned filter pill (e.g. a time-range picker). */
  leftChip?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Glass wrapper for chart blocks (recharts inside). Provides the same
 * surface treatment as the approved preview's revenue chart card while
 * leaving the chart implementation untouched — the dashboard keeps
 * using `recharts` against real `useDashboardSummary().finance.monthlyTrend`
 * etc.
 */
export default function GlassChartSurface({
  title,
  rightChip,
  leftChip,
  children,
  className,
}: GlassChartSurfaceProps) {
  return (
    <div className={cn("bm-dashboard-glass-strong relative overflow-hidden rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="text-[14px] font-bold" style={{ color: "#F8FAFC" }}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {leftChip}
          {rightChip}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
