import { FileText, CheckCircle2 } from "lucide-react";

interface ActivityItem {
  title: string;
  subtitle: string;
  time: string;
  variant: "doc" | "ok";
}

const ITEMS: ActivityItem[] = [
  {
    title: "تم إصدار فاتورة جديدة",
    subtitle: "للعميل شركة النخبة",
    time: "10:30 ص",
    variant: "doc",
  },
  {
    title: "تم تحديث حالة مشروع",
    subtitle: "تطوير المنصة",
    time: "09:15 ص",
    variant: "ok",
  },
  {
    title: "اجتماع مع العميل",
    subtitle: "مجموعة السريع",
    time: "أمس",
    variant: "ok",
  },
];

export default function ActivityCard() {
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
        <h3
          className="text-[13px] font-bold"
          style={{ color: "#F8FAFC" }}
        >
          نشاط حديث
        </h3>
        <button
          type="button"
          className="text-[10px] font-medium"
          style={{ color: "#7DDCFF" }}
        >
          عرض الكل
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {ITEMS.map((it) => (
          <li key={it.title + it.time} className="flex items-start gap-2">
            <span
              className="grid place-items-center h-7 w-7 rounded-lg shrink-0 mt-0.5"
              style={{
                background:
                  it.variant === "doc"
                    ? "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))"
                    : "linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.10))",
                border:
                  it.variant === "doc"
                    ? "1px solid rgba(125, 220, 255, 0.28)"
                    : "1px solid rgba(16, 185, 129, 0.35)",
              }}
              aria-hidden
            >
              {it.variant === "doc" ? (
                <FileText className="h-3.5 w-3.5 text-cyan-200" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-semibold leading-snug"
                style={{ color: "#F8FAFC" }}
              >
                {it.title}
              </div>
              <div
                className="text-[10px] leading-snug"
                style={{ color: "#94A3B8" }}
              >
                {it.subtitle}
              </div>
            </div>
            <span
              className="text-[9.5px] shrink-0 mt-0.5"
              style={{ color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}
            >
              {it.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
