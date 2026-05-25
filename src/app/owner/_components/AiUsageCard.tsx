"use client";

import { Sparkles } from "lucide-react";
import { OWNER_AI_TRACKING_DISABLED } from "../_data";

export default function AiUsageCard() {
  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a855f7]/14 text-[#c084fc]">
          <Sparkles size={17} />
        </span>
        <h2 className="font-heading text-lg font-bold text-white">استخدام الذكاء الاصطناعي</h2>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[180px] text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
        <Sparkles size={28} className="text-[#c084fc]/40 mb-3" strokeWidth={1.4} />
        <p className="text-[14px] font-medium text-white">{OWNER_AI_TRACKING_DISABLED}</p>
        <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-xs leading-relaxed">
          سيظهر الاستخدام الفعلي بعد تفعيل سجل الطلبات في مرحلة لاحقة.
        </p>
      </div>
    </section>
  );
}
