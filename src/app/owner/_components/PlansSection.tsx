"use client";

import { Layers, Check, Star } from "lucide-react";
import { ACCENT } from "../_accent";
import { cn } from "@/lib/utils";
import type { DisplayPlan } from "../_lib/ownerQueries";

function PlanSkeleton() {
  return (
    <div className="glass-card relative overflow-hidden p-6 border border-white/[0.08] flex flex-col animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-5 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-6 w-16 rounded bg-white/[0.06]" />
        <div className="h-3 w-40 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-5 space-y-2.5 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="h-5 w-5 rounded-full bg-white/[0.06]" />
            <div className="h-3 flex-1 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-10 rounded-xl bg-white/[0.06]" />
    </div>
  );
}

interface Props {
  plans?: DisplayPlan[];
  loading?: boolean;
}

export default function PlansSection({ plans, loading }: Props) {
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
        {loading
          ? [1, 2, 3].map((i) => <PlanSkeleton key={i} />)
          : plans?.map((plan) => {
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
                    disabled
                    className={cn(
                      "relative mt-6 w-full rounded-xl border py-2.5 text-[13px] font-medium cursor-not-allowed opacity-50",
                      a.border,
                      a.text,
                    )}
                  >
                    تعديل حدود الباقة
                  </button>
                </div>
              );
            })}
        {!loading && (!plans || plans.length === 0) && (
          <div className="col-span-3 py-8 text-center text-[13px] text-[#8ba3c7]">
            لا توجد باقات بعد
          </div>
        )}
      </div>
    </section>
  );
}
