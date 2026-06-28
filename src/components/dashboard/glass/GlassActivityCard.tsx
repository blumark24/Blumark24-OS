import Link from "next/link";
import type { ReactNode } from "react";

export interface GlassActivityItem {
  /** Stable key (e.g. activity id). */
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Pre-formatted relative time (e.g. "منذ 10 دقائق"). Comes from real data. */
  time: string;
  tone?: "cyan" | "emerald" | "amber" | "rose";
}

interface GlassActivityCardProps {
  title: string;
  items: GlassActivityItem[];
  /** Shown when items is empty — preserves the existing dashboard's empty UX. */
  emptyState?: ReactNode;
  /** "See all" link target (e.g. /tasks, /clients). */
  href?: string;
  /** Internal loading flag from useDashboardSummary(). */
  loading?: boolean;
  /** Optional override label for the "see all" chip. */
  seeAllLabel?: string;
}

const TONE_BG: Record<NonNullable<GlassActivityItem["tone"]>, string> = {
  cyan:    "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))",
  emerald: "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.10))",
  amber:   "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(245,158,11,0.10))",
  rose:    "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.10))",
};

const TONE_BORDER: Record<NonNullable<GlassActivityItem["tone"]>, string> = {
  cyan:    "1px solid rgba(125, 220, 255, 0.32)",
  emerald: "1px solid rgba(16, 185, 129, 0.38)",
  amber:   "1px solid rgba(245, 158, 11, 0.38)",
  rose:    "1px solid rgba(239, 68, 68, 0.38)",
};

/**
 * Glass activity / recent-events card. Receives real items derived from
 * `useDashboardSummary().activities` (or the equivalent). Empty + loading
 * branches are passed through; no fake rows are ever synthesised.
 */
export default function GlassActivityCard({
  title,
  items,
  emptyState,
  href,
  loading,
  seeAllLabel = "عرض الكل",
}: GlassActivityCardProps) {
  return (
    <div className="bm-dashboard-glass relative overflow-hidden rounded-2xl p-3.5">
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: "1px solid rgba(125, 220, 255, 0.10)" }}
      >
        <h3
          className="text-[13px] font-bold tracking-tight"
          style={{ color: "#F8FAFC" }}
        >
          {title}
        </h3>
        {href ? (
          <Link
            href={href}
            className="text-[10px] font-semibold"
            style={{ color: "#7DDCFF" }}
          >
            {seeAllLabel}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-white/5 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="py-4">{emptyState}</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-start gap-2.5 min-w-0">
              <span
                aria-hidden
                className="grid place-items-center h-7 w-7 rounded-lg shrink-0 mt-0.5"
                style={{
                  background: TONE_BG[it.tone ?? "cyan"],
                  border: TONE_BORDER[it.tone ?? "cyan"],
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  color: "#7DDCFF",
                }}
              >
                {it.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11.5px] font-semibold leading-snug truncate"
                  style={{ color: "#F8FAFC" }}
                >
                  {it.title}
                </div>
                {it.subtitle ? (
                  <div
                    className="text-[10px] mt-0.5 leading-snug truncate"
                    style={{ color: "#94A3B8" }}
                  >
                    {it.subtitle}
                  </div>
                ) : null}
                <div
                  className="text-[9.5px] mt-1"
                  style={{ color: "#7DDCFF", fontVariantNumeric: "tabular-nums" }}
                >
                  {it.time}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
