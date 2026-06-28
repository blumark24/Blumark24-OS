import { MoreVertical } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type GlassKpiTone = "cyan" | "emerald" | "amber" | "rose";

interface GlassKpiCardProps {
  label: string;
  value: string;
  /** Sub-line under the value (e.g. "من أصل 12 عميل"). */
  caption?: ReactNode;
  /** Trend-style label aligned on the opposite side of the caption. */
  trendText?: ReactNode;
  trendDirection?: "up" | "down";
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: GlassKpiTone;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

const TONES: Record<GlassKpiTone, { icon: string; glow: string }> = {
  cyan:    { icon: "#7DDCFF", glow: "rgba(0,217,255,0.40)" },
  emerald: { icon: "#6EE7B7", glow: "rgba(16,185,129,0.40)" },
  amber:   { icon: "#FCD34D", glow: "rgba(245,158,11,0.40)" },
  rose:    { icon: "#FCA5A5", glow: "rgba(239,68,68,0.40)" },
};

const TREND_COLOR = { up: "#10B981", down: "#EF4444" } as const;

/**
 * Compact glass KPI card matching the approved Blumark mobile preview
 * (`/design-preview/blumark-mobile`). Self-contained — does not import
 * shared workspace visual tokens; the dashboard page passes static
 * sample-free, real-data values straight from `useDashboardSummary()`.
 */
export default function GlassKpiCard({
  label,
  value,
  caption,
  trendText,
  trendDirection = "up",
  Icon,
  tone = "cyan",
  onClick,
  loading,
  className,
}: GlassKpiCardProps) {
  const t = TONES[tone];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "bm-dashboard-glass relative overflow-hidden rounded-2xl p-3 text-right transition",
        onClick && "hover:-translate-y-0.5 hover:border-cyan-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.55) 0%, rgba(7,20,38,0.65) 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-8 -left-8 h-20 w-20 rounded-full opacity-40 blur-2xl"
        style={{ background: `radial-gradient(circle, ${t.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between mb-2">
        <div
          className="grid place-items-center h-9 w-9 rounded-xl shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))",
            border: "1px solid rgba(125, 220, 255, 0.32)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <Icon className="h-4 w-4" style={{ color: t.icon }} />
        </div>
        <div className="flex flex-col items-end min-w-0">
          <span aria-hidden className="text-slate-500">
            <MoreVertical className="h-3.5 w-3.5" />
          </span>
          <span
            className="mt-1 text-[10.5px] font-medium truncate"
            style={{ color: "#B6C9E0" }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="relative">
        {loading ? (
          <div className="h-6 w-24 animate-pulse rounded-md bg-white/5 mb-1.5" />
        ) : (
          <div
            className="text-[20px] font-extrabold tracking-tight leading-none mb-1.5 truncate"
            style={{
              color: "#F8FAFC",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
            }}
          >
            {value}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 min-h-[14px]">
          {caption ? (
            <span className="text-[10px] truncate" style={{ color: "#94A3B8" }}>
              {caption}
            </span>
          ) : <span />}
          {trendText ? (
            <span
              className="text-[10px] font-bold flex items-center gap-0.5 shrink-0"
              style={{ color: TREND_COLOR[trendDirection], fontVariantNumeric: "tabular-nums" }}
            >
              {trendText}
              <span aria-hidden>{trendDirection === "up" ? "↑" : "↓"}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Tag>
  );
}
