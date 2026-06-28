import Link from "next/link";
import type { ReactNode } from "react";

export interface GlassTaskRow {
  id: string;
  title: string;
  /** Pre-formatted "x/y" or "x متبقي" — caller computes from real task buckets. */
  progress: string;
  ratio: number;
  priorityLabel: string;
  priorityColor: string;
}

interface GlassTasksCardProps {
  title: string;
  rows: GlassTaskRow[];
  href?: string;
  emptyState?: ReactNode;
  loading?: boolean;
  seeAllLabel?: string;
}

function CircleProgress({ ratio, color }: { ratio: number; color: string }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const offset = c * (1 - safeRatio);
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle cx="15" cy="15" r={r} stroke="rgba(125,220,255,0.14)" strokeWidth="2.4" fill="none" />
      <circle
        cx="15"
        cy="15"
        r={r}
        stroke={color}
        strokeWidth="2.4"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 15 15)"
        style={{ filter: `drop-shadow(0 0 5px ${color}66)` }}
      />
    </svg>
  );
}

/**
 * Glass tasks-today card. Mirrors the approved preview's TasksTodayCard:
 * circle progress + title + priority chip + "x/y" counter. Receives real
 * task summary rows from `useDashboardSummary().tasks.*` — no fake rows.
 */
export default function GlassTasksCard({
  title,
  rows,
  href,
  emptyState,
  loading,
  seeAllLabel = "عرض الكل",
}: GlassTasksCardProps) {
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
            <li key={i} className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-2 w-1/3 rounded bg-white/5 animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="py-4">{emptyState}</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-2.5 min-w-0">
              <CircleProgress ratio={row.ratio} color={row.priorityColor} />
              <div className="flex-1 min-w-0">
                <div
                  className="text-[11.5px] font-semibold leading-snug truncate"
                  style={{ color: "#F8FAFC" }}
                >
                  {row.title}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                    style={{
                      background: row.priorityColor,
                      boxShadow: `0 0 5px ${row.priorityColor}88`,
                    }}
                  />
                  <span
                    className="text-[10px] leading-none"
                    style={{ color: row.priorityColor }}
                  >
                    {row.priorityLabel}
                  </span>
                </div>
              </div>
              <span
                className="text-[11px] font-bold shrink-0"
                style={{ color: "#7DDCFF", fontVariantNumeric: "tabular-nums" }}
              >
                {row.progress}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
