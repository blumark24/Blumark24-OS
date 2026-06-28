import { FileText, CheckCircle2 } from "lucide-react";

interface ActivityItem {
  title: string;
  subtitle: string;
  time: string;
  variant: "doc" | "ok";
}

const ITEMS: ActivityItem[] = [
  {
    title: "تم إصدار فاتورة",
    subtitle: "شركة النخبة",
    time: "10:30 ص",
    variant: "doc",
  },
  {
    title: "تحديث حالة مشروع",
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
    <div className="p-3.5 bm-glass">
      <div
        className="flex items-center justify-between mb-3 pb-2"
        style={{ borderBottom: "1px solid rgba(125, 220, 255, 0.10)" }}
      >
        <h3
          className="text-[12.5px] font-bold tracking-tight"
          style={{ color: "#F8FAFC" }}
        >
          نشاط حديث
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
        {ITEMS.map((it) => (
          <li key={it.title + it.time} className="flex items-start gap-2.5">
            <span
              className="grid place-items-center h-7 w-7 rounded-lg shrink-0 mt-0.5"
              style={{
                background:
                  it.variant === "doc"
                    ? "linear-gradient(135deg, rgba(0,217,255,0.18), rgba(20,124,255,0.18))"
                    : "linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.10))",
                border:
                  it.variant === "doc"
                    ? "1px solid rgba(125, 220, 255, 0.32)"
                    : "1px solid rgba(16, 185, 129, 0.38)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
              aria-hidden
            >
              {it.variant === "doc" ? (
                <FileText className="h-3.5 w-3.5" style={{ color: "#7DDCFF" }} />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11.5px] font-semibold leading-snug"
                style={{ color: "#F8FAFC" }}
              >
                {it.title}
              </div>
              <div
                className="text-[10px] mt-0.5 leading-snug"
                style={{ color: "#94A3B8" }}
              >
                {it.subtitle}
              </div>
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
    </div>
  );
}
