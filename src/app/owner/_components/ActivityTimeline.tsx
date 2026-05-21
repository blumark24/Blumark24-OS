"use client";

import { Activity } from "lucide-react";
import { ACTIVITY } from "../_data";
import { ACCENT } from "../_accent";
import { cn } from "@/lib/utils";

export default function ActivityTimeline() {
  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-5">
        <Activity size={18} className="text-[#22d3ee]" />
        سجل النشاطات الأخيرة
      </h2>

      <ol className="relative space-y-4">
        {/* vertical line (RTL: on the right) */}
        <span className="absolute top-1 bottom-1 right-[18px] w-px bg-white/[0.08]" aria-hidden />

        {ACTIVITY.map((item) => {
          const a = ACCENT[item.accent];
          const Icon = item.icon;
          return (
            <li key={item.id} className="relative flex gap-3 pr-0">
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border",
                  a.iconBg,
                  a.border,
                )}
              >
                <Icon size={15} className={a.text} />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="text-[13px] font-medium text-white leading-snug">{item.title}</div>
                <div className="text-[12px] text-[#8ba3c7] mt-0.5">{item.detail}</div>
                <div className="text-[11px] text-[#5f7798] mt-0.5">{item.time}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
