"use client";

import {
  SlidersHorizontal,
  Users,
  Building2,
  Layers,
  Grid3x3,
  Sparkles,
  MessageCircle,
  ArrowLeftRight,
  CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DisplayOrg, DisplaySubscription } from "../_lib/ownerQueries";

const METRIC_ICONS: LucideIcon[] = [
  Users,
  Building2,
  Layers,
  Grid3x3,
  Sparkles,
  MessageCircle,
];

function aiLevelLabel(level: number): string {
  if (level === 1) return "محدود";
  if (level === 2) return "متوسط";
  return "كامل";
}

function buildMetrics(limits: Record<string, number>) {
  return [
    { label: "الموظفين",        value: `${limits["max_employees"] ?? 0} موظف` },
    { label: "الوكالات",        value: `${limits["max_agencies"] ?? 0} وكالة` },
    { label: "الإدارات",        value: `${limits["max_departments"] ?? 0} إدارات` },
    { label: "الأقسام",         value: `${limits["max_sections"] ?? 0} قسم` },
    { label: "الذكاء الاصطناعي", value: aiLevelLabel(limits["ai_level"] ?? 0) },
    { label: "WhatsApp Bot",    value: limits["whatsapp_enabled"] === 1 ? "مفعّل" : "معطّل" },
  ];
}

function Skeleton() {
  return (
    <section className="glass-card p-5 sm:p-6 border border-[#a855f7]/20 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-40 rounded bg-white/[0.06]" />
        <div className="h-6 w-20 rounded-full bg-white/[0.06]" />
      </div>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-3">
        <div className="h-4 w-32 rounded bg-white/[0.06] mr-auto" />
      </div>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
          <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.06] mr-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="h-4 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </section>
  );
}

interface Props {
  internalOrg?: DisplayOrg | null;
  internalPlanLimits?: Record<string, number>;
  internalSubscription?: DisplaySubscription | null;
  loading?: boolean;
}

export default function PlanLimitsPreview({
  internalOrg,
  internalPlanLimits,
  internalSubscription,
  loading,
}: Props) {
  if (loading) return <Skeleton />;

  const orgName = internalOrg?.name ?? "Blumark24";
  const planName = internalOrg?.planName ?? "—";
  const metrics =
    internalPlanLimits && Object.keys(internalPlanLimits).length > 0
      ? buildMetrics(internalPlanLimits)
      : null;

  return (
    <section className="glass-card p-5 sm:p-6 border border-[#a855f7]/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-[#c084fc]" />
          معاينة حدود الباقة
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a855f7]/12 border border-[#a855f7]/25 px-3 py-1 text-[11px] text-[#c084fc]">
          باقة {planName}
        </span>
      </div>

      {/* Org row */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 mb-3">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-[#8ba3c7]">المنشأة</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{orgName}</span>
            {internalOrg?.isInternal && (
              <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-2 py-0.5 text-[10px] text-[#22d3ee]">
                داخلي
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription status strip */}
      {internalSubscription && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 mb-4">
          <CreditCard size={13} className="text-[#8ba3c7] flex-shrink-0" />
          <span className="text-[12px] text-[#8ba3c7]">الاشتراك:</span>
          <span
            className={
              internalSubscription.isActive
                ? "rounded-full bg-[#10b981]/15 border border-[#10b981]/30 px-2.5 py-0.5 text-[11px] text-[#34d399]"
                : "rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 px-2.5 py-0.5 text-[11px] text-[#fbbf24]"
            }
          >
            {internalSubscription.statusAr}
          </span>
          <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-2.5 py-0.5 text-[11px] text-[#22d3ee]">
            {internalSubscription.billingCycleAr}
          </span>
          <span className="rounded-full bg-[#a855f7]/12 border border-[#a855f7]/25 px-2.5 py-0.5 text-[11px] text-[#c084fc]">
            {internalSubscription.planName}
          </span>
          <span className="text-[11px] text-[#8ba3c7] mr-auto tabular-nums">
            منذ {internalSubscription.startedAt}
          </span>
        </div>
      )}

      {metrics ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m, i) => {
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
      ) : (
        <p className="text-center py-4 text-[13px] text-[#8ba3c7]">
          لا توجد حدود محددة لهذه الباقة
        </p>
      )}

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
