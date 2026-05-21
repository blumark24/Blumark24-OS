"use client";

import { Layers, Check, Star } from "lucide-react";
import { PLANS } from "../_data";
import { ACCENT } from "../_accent";
import { cn } from "@/lib/utils";

export default function PlansSection() {
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <Layers size={18} className="text-[#22d3ee]" />
          إدارة الباقات
        </h2>
        <span className="text-[11px] text-[#8ba3c7]">يتحكم المالك بحدود كل باقة</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const a = ACCENT[plan.accent];
          return (
            <div
              key={plan.id}
              className={cn(
                "glass-card glass-card-hover relative overflow-hidden p-6 border flex flex-col",
                a.border,
                plan.featured && cn("ring-1 ring-inset", a.glow),
              )}
            >
              {plan.featured && (
                <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-40 rounded-full bg-[#1e6fd9]/20 blur-3xl" />
              )}

              <div className="relative flex items-center justify-between">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium", a.chip)}>
                  {plan.featured && <Star size={11} className="fill-current" />}
                  {plan.badge}
                </span>
                <Layers size={18} className={cn("opacity-70", a.text)} />
              </div>

              <div className="relative mt-4">
                <h3 className={cn("font-heading text-xl font-bold", a.text)}>{plan.name}</h3>
                <p className="mt-1 text-[12px] text-[#8ba3c7] leading-relaxed">{plan.audience}</p>
              </div>

              <ul className="relative mt-5 space-y-2.5 flex-1">
                {plan.limits.map((limit) => (
                  <li key={limit} className="flex items-center gap-2.5 text-[13px] text-[#cdd9ec]">
                    <span className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full", a.iconBg)}>
                      <Check size={11} className={a.text} strokeWidth={2.5} />
                    </span>
                    {limit}
                  </li>
                ))}
              </ul>

              <button
                className={cn(
                  "relative mt-6 w-full rounded-xl border py-2.5 text-[13px] font-medium transition-colors",
                  a.border,
                  a.text,
                  "hover:bg-white/[0.04]",
                )}
              >
                تعديل حدود الباقة
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
