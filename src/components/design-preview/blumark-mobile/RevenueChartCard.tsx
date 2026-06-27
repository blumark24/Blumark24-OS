import { ChevronDown, Calendar } from "lucide-react";

const MONTHS = ["ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو"];
// Normalized 0..1 — gentle uptrend with a small dip
const POINTS = [0.10, 0.42, 0.34, 0.55, 0.62, 0.78, 0.95];

const CHART_W = 320;
const CHART_H = 130;
const PADDING_X = 12;
const PADDING_Y = 14;

function pathFromPoints(pts: number[], filled = false) {
  const innerW = CHART_W - PADDING_X * 2;
  const innerH = CHART_H - PADDING_Y * 2;
  const step = innerW / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = PADDING_X + i * step;
    const y = PADDING_Y + (1 - v) * innerH;
    return [x, y] as const;
  });

  // smooth via simple cubic between points
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [px, py] = coords[i - 1];
    const [cx, cy] = coords[i];
    const mx = (px + cx) / 2;
    d += ` C ${mx},${py} ${mx},${cy} ${cx},${cy}`;
  }

  if (filled) {
    d += ` L ${coords[coords.length - 1][0]},${CHART_H - PADDING_Y} L ${coords[0][0]},${CHART_H - PADDING_Y} Z`;
  }
  return { d, coords };
}

export default function RevenueChartCard() {
  const line = pathFromPoints(POINTS, false);
  const area = pathFromPoints(POINTS, true);
  const peakIndex = 4; // call-out
  const [px, py] = line.coords[peakIndex];

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.80) 0%, rgba(7,20,38,0.80) 100%)",
        border: "1px solid rgba(125, 220, 255, 0.18)",
        boxShadow:
          "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-[14px] font-bold"
          style={{ color: "#F8FAFC" }}
        >
          نظرة على الإيرادات
        </h3>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] rounded-lg px-2 py-1"
          style={{
            color: "#94A3B8",
            background: "rgba(13,31,60,0.6)",
            border: "1px solid rgba(125, 220, 255, 0.18)",
          }}
        >
          <ChevronDown className="h-3 w-3" />
          <span>هذا الشهر</span>
          <Calendar className="h-3 w-3" />
        </button>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          aria-label="مخطط الإيرادات"
          role="img"
        >
          <defs>
            <linearGradient id="bm-rev-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.40" />
              <stop offset="100%" stopColor="#00D9FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bm-rev-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7DDCFF" />
              <stop offset="100%" stopColor="#147CFF" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((g) => {
            const y = PADDING_Y + g * (CHART_H - PADDING_Y * 2);
            return (
              <line
                key={g}
                x1={PADDING_X}
                x2={CHART_W - PADDING_X}
                y1={y}
                y2={y}
                stroke="rgba(125,220,255,0.06)"
                strokeDasharray="3 4"
              />
            );
          })}

          <path d={area.d} fill="url(#bm-rev-area)" />
          <path
            d={line.d}
            stroke="url(#bm-rev-line)"
            strokeWidth="2.2"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points */}
          {line.coords.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === peakIndex ? 4 : 2.5}
              fill={i === peakIndex ? "#7DDCFF" : "#147CFF"}
              stroke="#020817"
              strokeWidth="1"
            />
          ))}

          {/* Peak indicator vertical line */}
          <line
            x1={px}
            x2={px}
            y1={py}
            y2={CHART_H - PADDING_Y}
            stroke="rgba(125,220,255,0.35)"
            strokeDasharray="2 3"
          />
        </svg>

        {/* Floating call-out for peak */}
        <div
          className="absolute"
          style={{
            left: `${(px / CHART_W) * 100}%`,
            top: `${(py / CHART_H) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <div
            className="rounded-lg px-2 py-1 text-center"
            style={{
              background: "rgba(7,20,38,0.92)",
              border: "1px solid rgba(125, 220, 255, 0.30)",
              boxShadow: "0 4px 14px rgba(0,217,255,0.20)",
            }}
          >
            <div
              className="text-[11px] font-bold leading-none"
              style={{ color: "#F8FAFC", fontVariantNumeric: "tabular-nums" }}
            >
              8,745,230
            </div>
            <div
              className="text-[9px] font-bold mt-0.5 flex items-center justify-center gap-0.5"
              style={{ color: "#10B981" }}
            >
              +24.3% <span aria-hidden>↑</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="grid grid-cols-6 mt-2">
        {MONTHS.map((m) => (
          <span
            key={m}
            className="text-[10px] text-center"
            style={{ color: "#94A3B8" }}
          >
            {m}
          </span>
        ))}
      </div>

      {/* Footer stats */}
      <div
        className="grid grid-cols-4 mt-3 pt-3 gap-1"
        style={{ borderTop: "1px solid rgba(125, 220, 255, 0.12)" }}
      >
        <Stat label="الأعلى يوم" value="1.2M" valueColor="#F8FAFC" />
        <Stat label="المتوسط يومياً" value="291K" valueColor="#7DDCFF" />
        <Stat label="إجمالي هذا الشهر" value="8.74M" valueColor="#F8FAFC" />
        <Stat label="النمو الشهري" value="+24.3%" valueColor="#10B981" trend />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueColor,
  trend,
}: {
  label: string;
  value: string;
  valueColor: string;
  trend?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className="text-[12px] font-extrabold leading-none mb-1 flex items-center justify-center gap-0.5"
        style={{ color: valueColor, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
        {trend ? <span aria-hidden>↑</span> : null}
      </div>
      <div className="text-[9px]" style={{ color: "#94A3B8" }}>
        {label}
      </div>
    </div>
  );
}
