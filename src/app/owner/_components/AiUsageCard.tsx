"use client";

import { Sparkles, MessageSquare, BarChart3, FileText, CircleDollarSign } from "lucide-react";
import { AI_USAGE } from "../_data";
import type { LucideIcon } from "lucide-react";

const ICONS: LucideIcon[] = [MessageSquare, BarChart3, FileText, CircleDollarSign];

export default function AiUsageCard() {
  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a855f7]/14 text-[#c084fc]">
          <Sparkles size={17} />
        </span>
        <h2 className="font-heading text-lg font-bold text-white">استخدام الذكاء الاصطناعي</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {AI_USAGE.map((item, i) => {
          const Icon = ICONS[i] ?? Sparkles;
          return (
            <div key={item.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Icon size={16} className="text-[#c084fc] mb-2" />
              <div className="font-heading text-lg font-bold text-white tabular-nums">{item.value}</div>
              <div className="text-[11.5px] text-[#8ba3c7] mt-0.5">{item.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
