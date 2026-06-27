import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import StatusPill, { type StatusPillProps } from "./StatusPill";
import type { GlassCardVariant } from "@/lib/design/tokens";

export interface MetricCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  variant?: GlassCardVariant;
  trend?: {
    label: ReactNode;
    tone?: StatusPillProps["variant"];
  };
  className?: string;
}

export default function MetricCard({
  label,
  value,
  hint,
  icon,
  variant = "default",
  trend,
  className,
}: MetricCardProps) {
  return (
    <GlassCard
      variant={variant}
      className={cn(
        "flex h-full flex-col justify-between gap-premium-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-premium-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
            {label}
          </p>
        </div>
        {icon ? (
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-white/5 text-[#7DDCFF]">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-premium-2">
        <p
          dir="ltr"
          className="text-right text-3xl font-bold text-[#F8FAFC] tabular-nums"
        >
          {value}
        </p>
        {hint ? <p className="text-xs text-[#94A3B8]">{hint}</p> : null}
      </div>

      {trend ? (
        <StatusPill variant={trend.tone ?? "neutral"}>{trend.label}</StatusPill>
      ) : null}
    </GlassCard>
  );
}
