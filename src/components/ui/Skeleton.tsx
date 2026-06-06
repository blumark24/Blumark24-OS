import React from "react";
import { cn } from "@/lib/utils";
import { WS_CARD, WS_CARD_PADDING, WS_CARD_SHEEN } from "@/components/ui/workspaceVisual";

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-xl shimmer", className)} style={style} />
  );
}

export function KPICardSkeleton() {
  return (
    <div
      className={cn(
        WS_CARD,
        WS_CARD_PADDING,
        "relative overflow-hidden flex flex-col justify-between min-h-[172px] sm:min-h-[192px]",
      )}
    >
      <div className={WS_CARD_SHEEN} />
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="w-11 h-11 rounded-[15px]" />
          <Skeleton className="w-14 h-[26px] rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-28 h-10" />
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
      <div className="flex items-end gap-2 mt-4">
        <Skeleton className="h-1 flex-1 rounded-full" />
        <Skeleton className="w-14 h-5 rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[rgba(148,163,184,0.12)]/40">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="w-full flex flex-col gap-2 justify-end" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + (i * 7) % 60}%` }}
          />
        ))}
      </div>
      <Skeleton className="w-full h-4" />
    </div>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={cn(WS_CARD, WS_CARD_PADDING, "space-y-3")}>
      <div className={WS_CARD_SHEEN} />
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

export function StatSkeleton() {
  return (
    <div className={cn(WS_CARD, WS_CARD_PADDING, "text-center space-y-2")}>
      <Skeleton className="w-16 h-7 mx-auto" />
      <Skeleton className="w-24 h-3 mx-auto" />
    </div>
  );
}
