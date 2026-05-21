"use client";

import { SlidersHorizontal, Users, Building2, Layers, Grid3x3, Sparkles, MessageCircle, ArrowLeftRight } from "lucide-react";
import { LIMIT_PREVIEW } from "../_data";
import type { LucideIcon } from "lucide-react";

const METRIC_ICONS: LucideIcon[] = [Users, Building2, Layers, Grid3x3, Sparkles, MessageCircle];

export default function PlanLimitsPreview() {
  return (
    <section className="glass-card p-5 sm:p-6 border border-[#a855f7]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#c084fc]" />
          معاينة حدود الباقة
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a855f7]/12 border border-[#a855f7]/25 px-3 py-1 text-[11px] text-[#c084fc]">
          باقة {LIMIT_PREVIEW.plan}
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#8ba3c7]">العميل</span>
          <span className="font-semibold text-white">{LIMIT_PREVIEW.client}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {LIMIT_PREVIEW.metrics.map((m, i) => {
          const Icon = METRIC_ICONS[i] ?? Sparkles;
          return (
            <div key={m.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-[#8ba3c7] text-[11px] mb-1.5">
                <Icon size={13} className="text-[#c084fc]" />
                {m.label}
              </div>
              <div className="text-[13px] font-semibold text-white">{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Owner → client control concept */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#22d3ee]/15 bg-[#22d3ee]/[0.05] p-3.5">
        <ArrowLeftRight size={15} className="text-[#22d3ee] flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-[#9fb3cf] leading-relaxed">
          لوحة المالك هي من تحدد هذه الحدود. مساحة العميل في{" "}
          <span className="text-[#22d3ee] font-medium">/org</span> تعمل فقط ضمن سقف الباقة — لا يمكنه تجاوز عدد الموظفين أو الوكالات أو الإدارات أو الأقسام المسموح بها.
        </p>
      </div>
    </section>
  );
}
