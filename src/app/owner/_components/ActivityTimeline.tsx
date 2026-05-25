"use client";

import { Activity } from "lucide-react";
import { OWNER_ACTIVITY_EMPTY } from "../_data";

export default function ActivityTimeline() {
  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2 mb-5">
        <Activity size={18} className="text-[#22d3ee]" />
        سجل النشاطات الأخيرة
      </h2>

      <div className="flex flex-col items-center justify-center min-h-[220px] text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
        <Activity size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
        <p className="text-[14px] font-medium text-white">{OWNER_ACTIVITY_EMPTY}</p>
        <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-xs leading-relaxed">
          تُسجَّل هنا إجراءات المالك (إنشاء منشآت، تغيير الباقات، إلخ) عند تنفيذها.
        </p>
      </div>
    </section>
  );
}
