import { ClipboardCheck, BarChart3, FileText, UserPlus } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface Action {
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ACTIONS: Action[] = [
  { label: "مهمة جديدة", Icon: ClipboardCheck },
  { label: "تقرير سريع", Icon: BarChart3 },
  { label: "فاتورة جديدة", Icon: FileText },
  { label: "إضافة عميل", Icon: UserPlus },
];

export default function QuickActionsStrip() {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(11,31,58,0.65) 0%, rgba(7,20,38,0.65) 100%)",
        border: "1px solid rgba(125, 220, 255, 0.16)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.28)",
      }}
    >
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center gap-1.5 py-1.5"
          >
            <span
              className="grid place-items-center h-9 w-9 rounded-xl transition"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,217,255,0.14), rgba(20,124,255,0.14))",
                border: "1px solid rgba(125, 220, 255, 0.25)",
                boxShadow: "0 0 10px rgba(0,217,255,0.10)",
              }}
            >
              <Icon className="h-4 w-4 text-cyan-200" />
            </span>
            <span
              className="text-[10px] leading-tight"
              style={{ color: "#94A3B8" }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
