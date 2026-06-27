interface TaskItem {
  title: string;
  progress: string;
  priorityLabel: string;
  priorityColor: string;
  ratio: number;
}

const TASKS: TaskItem[] = [
  {
    title: "إعداد تقرير المبيعات",
    progress: "2/3",
    priorityLabel: "مرتفعة",
    priorityColor: "#EF4444",
    ratio: 2 / 3,
  },
  {
    title: "مراجعة الفواتير",
    progress: "5/8",
    priorityLabel: "متوسطة",
    priorityColor: "#F59E0B",
    ratio: 5 / 8,
  },
  {
    title: "متابعة العملاء",
    progress: "3/5",
    priorityLabel: "منخفضة",
    priorityColor: "#10B981",
    ratio: 3 / 5,
  },
];

function CircleProgress({ ratio, color }: { ratio: number; color: string }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <circle
        cx="14"
        cy="14"
        r={r}
        stroke="rgba(125,220,255,0.12)"
        strokeWidth="2.5"
        fill="none"
      />
      <circle
        cx="14"
        cy="14"
        r={r}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
      />
    </svg>
  );
}

export default function TasksTodayCard() {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.80) 0%, rgba(7,20,38,0.80) 100%)",
        border: "1px solid rgba(125, 220, 255, 0.18)",
        boxShadow: "0 6px 22px rgba(0,0,0,0.32)",
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[13px] font-bold" style={{ color: "#F8FAFC" }}>
          مهام اليوم
        </h3>
        <button
          type="button"
          className="text-[10px] font-medium"
          style={{ color: "#7DDCFF" }}
        >
          عرض الكل
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {TASKS.map((t) => (
          <li key={t.title} className="flex items-center gap-2.5">
            <CircleProgress ratio={t.ratio} color={t.priorityColor} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-semibold leading-snug truncate"
                style={{ color: "#F8FAFC" }}
              >
                {t.title}
              </div>
              <div
                className="text-[10px] leading-snug"
                style={{ color: t.priorityColor }}
              >
                {t.priorityLabel}
              </div>
            </div>
            <span
              className="text-[10.5px] font-bold shrink-0"
              style={{ color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}
            >
              {t.progress}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
