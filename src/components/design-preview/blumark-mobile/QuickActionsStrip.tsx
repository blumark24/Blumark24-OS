import { ClipboardCheck, BarChart3, FileText, UserPlus } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface Action {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

// RTL grid: DOM child #1 renders on the visual RIGHT. Reference order
// (visual right → left): إضافة عميل · فاتورة جديدة · تقرير سريع · مهمة جديدة
const ACTIONS: Action[] = [
  { label: "إضافة عميل", Icon: UserPlus },
  { label: "فاتورة جديدة", Icon: FileText },
  { label: "تقرير سريع", Icon: BarChart3 },
  { label: "مهمة جديدة", Icon: ClipboardCheck },
];

export default function QuickActionsStrip() {
  return (
    <div className="p-3 bm-glass">
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center gap-1.5 py-1"
          >
            <span
              className="grid place-items-center h-9 w-9 rounded-xl transition"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,217,255,0.16), rgba(20,124,255,0.16))",
                border: "1px solid rgba(125, 220, 255, 0.30)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 10px rgba(0,217,255,0.10)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "#7DDCFF" }} />
            </span>
            <span
              className="text-[10px] leading-tight font-medium"
              style={{ color: "#B6C9E0" }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
