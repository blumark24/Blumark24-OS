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
  const r = 11;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - ratio);
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle
        cx="15"
        cy="15"
        r={r}
        stroke="rgba(125,220,255,0.14)"
        strokeWidth="2.4"
        fill="none"
      />
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

export default function TasksTodayCard() {
  return (
    <div className="p-3.5 bm-glass">
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: "1px solid rgba(125, 220, 255, 0.10)" }}
      >
        <h3
          className="text-[12.5px] font-bold tracking-tight"
          style={{ color: "#F8FAFC" }}
        >
          مهام اليوم
        </h3>
        <button
          type="button"
          className="text-[10px] font-semibold"
          style={{ color: "#7DDCFF" }}
        >
          عرض الكل
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {TASKS.map((t) => (
          <li key={t.title} className="flex items-center gap-2.5">
            <CircleProgress ratio={t.ratio} color={t.priorityColor} />
            <div className="flex-1 min-w-0">
              <div
                className="text-[11.5px] font-semibold leading-snug"
                style={{ color: "#F8FAFC" }}
              >
                {t.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    background: t.priorityColor,
                    boxShadow: `0 0 5px ${t.priorityColor}88`,
                  }}
                  aria-hidden
                />
                <span
                  className="text-[10px] leading-none"
                  style={{ color: t.priorityColor }}
                >
                  {t.priorityLabel}
                </span>
              </div>
            </div>
            <span
              className="text-[11px] font-bold shrink-0"
              style={{ color: "#7DDCFF", fontVariantNumeric: "tabular-nums" }}
            >
              {t.progress}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
