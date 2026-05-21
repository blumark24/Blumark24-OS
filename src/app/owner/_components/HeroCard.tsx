"use client";

import { Command, Sparkles } from "lucide-react";

export default function HeroCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-l from-[#0d1f3c] via-[#102844] to-[#0a1628] p-6 sm:p-8">
      {/* glow accents */}
      <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-[#22d3ee]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-[#a855f7]/15 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-3 py-1 text-[11px] text-[#22d3ee]">
            <Sparkles size={12} />
            Saudi AI Enterprise Operating System
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
            مرحبًا، مالك المنصة
          </h1>
          <p className="text-lg sm:text-xl font-semibold gradient-text-teal">
            تحكم بكل شيء من مكان واحد
          </p>
          <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed">
            إدارة عملاء Blumark24 OS، الاشتراكات، الباقات، الذكاء الاصطناعي، الفواتير والعمليات — لوحة قيادة واحدة لكامل المنصة.
          </p>
        </div>

        <div className="hidden sm:flex h-20 w-20 lg:h-24 lg:w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.06] shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]">
          <Command size={40} className="text-[#22d3ee]" />
        </div>
      </div>
    </section>
  );
}
