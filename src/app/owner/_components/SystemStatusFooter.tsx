"use client";

import { ShieldCheck } from "lucide-react";
import { OWNER_MONITORING_DISABLED } from "../_data";

export default function SystemStatusFooter() {
  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[#8ba3c7]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="text-[14px] font-semibold text-white">{OWNER_MONITORING_DISABLED}</div>
            <div className="text-[11.5px] text-[#8ba3c7]">مراقبة وقت التشغيل والتخزين — غير مربوطة بعد</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[80px] lg:min-h-0 lg:flex-1 lg:max-w-2xl rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-4 text-center">
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-lg">
            سيُعرض هنا وقت التشغيل، استخدام التخزين، والمستخدمون النشطون عند ربط نظام المراقبة في مرحلة لاحقة.
          </p>
        </div>
      </div>
    </section>
  );
}
