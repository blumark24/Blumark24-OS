import React from "react";
import { cn } from "@/lib/utils";
import { WS_CARD } from "@/components/ui/workspaceVisual";

// ─── Base Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-xl shimmer", className)} style={style} />
  );
}

// ─── KPI Card Skeleton ─────────────────────────────────────────────────────────

export function KPICardSkeleton() {
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5 relative overflow-hidden min-h-[168px] sm:min-h-[188px]")}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-[42px] h-[42px] rounded-[15px]" />
        <Skeleton className="w-14 h-[26px] rounded-full" />
      </div>
      <Skeleton className="w-24 h-9 mb-2" />
      <Skeleton className="w-32 h-4 mb-1" />
      <Skeleton className="w-24 h-3" />
      <div className="absolute bottom-4 left-4 right-4 flex items-end gap-2">
        <Skeleton className="h-1 flex-1 rounded-full" />
        <Skeleton className="w-14 h-5 rounded" />
      </div>
    </div>
  );
}

// ─── Table Row Skeleton ────────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#1e3a5f]/40">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ─── Chart Skeleton ────────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="w-full flex flex-col gap-2 justify-end" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
      <Skeleton className="w-full h-4" />
    </div>
  );
}

// ─── Card Skeleton ─────────────────────────────────────────────────────────────

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={cn(WS_CARD, "p-5 space-y-3")}>
      <Skeleton className="w-32 h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-[15px] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Badge Skeleton ───────────────────────────────────────────────────────

export function StatSkeleton() {
  return (
    <div className={cn(WS_CARD, "p-4 text-center space-y-2")}>
      <Skeleton className="w-16 h-7 mx-auto" />
      <Skeleton className="w-24 h-3 mx-auto" />
    </div>
  );
}
