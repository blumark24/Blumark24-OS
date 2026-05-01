import React from "react";
import { cn } from "@/lib/utils";

// ─── Base Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("rounded-xl shimmer", className)} style={style} />
  );
}

// ─── KPI Card Skeleton ─────────────────────────────────────────────────────────

export function KPICardSkeleton() {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-12 h-4" />
      </div>
      <Skeleton className="w-24 h-8 mb-2" />
      <Skeleton className="w-32 h-4 mb-1" />
      <Skeleton className="w-24 h-3" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e3a5f]" />
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
    <div className="glass-card p-5 space-y-3">
      <Skeleton className="w-32 h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
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
    <div className="glass-card p-4 text-center space-y-2">
      <Skeleton className="w-16 h-7 mx-auto" />
      <Skeleton className="w-24 h-3 mx-auto" />
    </div>
  );
}
