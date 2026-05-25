"use client";

import { MessageCircle } from "lucide-react";
import { OWNER_WHATSAPP_DISABLED } from "../_data";

export default function WhatsAppCard() {
  return (
    <section className="glass-card p-5 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10b981]/14 text-[#34d399]">
            <MessageCircle size={17} />
          </span>
          <h2 className="font-heading text-lg font-bold text-white">واتساب بوت</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] border border-white/[0.12] px-3 py-1 text-[11px] text-[#8ba3c7]">
          غير مفعّل
        </span>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[180px] text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
        <MessageCircle size={28} className="text-[#34d399]/30 mb-3" strokeWidth={1.4} />
        <p className="text-[14px] font-medium text-white">{OWNER_WHATSAPP_DISABLED}</p>
        <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-xs leading-relaxed">
          سيُعرض هنا حالة الجلسة والإحصائيات عند ربط تكامل واتساب في مرحلة لاحقة.
        </p>
      </div>
    </section>
  );
}
