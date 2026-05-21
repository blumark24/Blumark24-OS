"use client";

import { MessageCircle, Wifi } from "lucide-react";
import { WHATSAPP } from "../_data";

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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/14 border border-[#10b981]/30 px-3 py-1 text-[11px] text-[#34d399]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          {WHATSAPP.status}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[#10b981]/15 bg-[#10b981]/[0.05] px-3.5 py-2.5 mb-4">
        <Wifi size={14} className="text-[#34d399]" />
        <span className="text-[12px] text-[#9fb3cf]">حالة الجلسة:</span>
        <span className="text-[12px] font-medium text-[#34d399]">{WHATSAPP.session}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {WHATSAPP.stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
            <div className="font-heading text-base font-bold text-white tabular-nums">{s.value}</div>
            <div className="text-[10.5px] text-[#8ba3c7] mt-1 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-[#8ba3c7]">معدل النجاح</span>
          <span className="text-[#34d399] font-medium tabular-nums">{WHATSAPP.successRate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#10b981] to-[#22d3ee]"
            style={{ width: `${WHATSAPP.successRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
