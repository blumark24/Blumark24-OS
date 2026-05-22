import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../_accent";
import type { Accent } from "../_data";

interface OwnerPlaceholderCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: Accent;
  value?: string;
  hint?: string;
}

export default function OwnerPlaceholderCard({
  title,
  description,
  icon: Icon,
  accent = "cyan",
  value = "—",
  hint,
}: OwnerPlaceholderCardProps) {
  const a = ACCENT[accent];

  return (
    <article
      className={cn(
        "glass-card p-5 sm:p-6 h-full flex flex-col",
        a.glow,
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border flex-shrink-0",
            a.iconBg,
            a.border,
          )}
        >
          <Icon size={18} className={a.text} strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[15px] font-bold text-white leading-snug">{title}</h3>
          <p className="text-[12px] text-[#8ba3c7] mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-auto">
        <div className={cn("font-heading text-2xl font-bold tabular-nums", a.text)}>{value}</div>
        {hint ? (
          <p className="text-[11px] text-[#5f7798] mt-1.5">{hint}</p>
        ) : (
          <p className="text-[11px] text-[#5f7798] mt-1.5">جاهز للربط لاحقاً</p>
        )}
      </div>
    </article>
  );
}
