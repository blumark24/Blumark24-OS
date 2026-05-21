"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  PauseCircle,
  SlidersHorizontal,
  Users,
  Building2,
  Grid3x3,
  Sparkles,
  MessageCircle,
  RefreshCw,
  Eye,
  Lock,
  CalendarDays,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import { fetchPlansPage, type DisplayPlanFull } from "../../_lib/ownerQueries";

// ─── Value formatters (Arabic) ────────────────────────────────────────────────

function numOrDash(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-US");
}

function priceLabel(n: number | null): string {
  return n === null ? "غير محدّد" : `${n.toLocaleString("en-US")} ر.س`;
}

function aiLevelLabel(level: number | null): string {
  if (level === null) return "—";
  if (level <= 1) return "محدود";
  if (level === 2) return "متوسط";
  return "كامل";
}

function whatsappLabel(value: number | null): string {
  if (value === null) return "—";
  return value === 1 ? "مفعّل" : "معطّل";
}

// ─── Read-only mode badge ──────────────────────────────────────────────────────

function ReadOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/[0.1] px-3 py-1 text-[11px] font-medium text-[#fbbf24]">
      <Eye size={12} />
      وضع العرض فقط
    </span>
  );
}

// ─── Disabled action chip (read-only — clearly "coming soon") ──────────────────

function DisabledAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="غير متاح حاليًا"
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/45 cursor-not-allowed"
    >
      <Icon size={12} className="opacity-70" />
      {label}
    </button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="glass-card p-5 border border-white/[0.08] flex flex-col animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
          <div className="space-y-1.5">
            <div className="h-5 w-24 rounded bg-white/[0.06]" />
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-4 h-16 rounded-xl bg-white/[0.05]" />
      <div className="mt-4 space-y-1.5 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 rounded-lg bg-white/[0.04]" />
        ))}
      </div>
      <div className="mt-4 h-8 rounded-lg bg-white/[0.05]" />
    </div>
  );
}

// ─── Limit row ─────────────────────────────────────────────────────────────────

function LimitRow({ icon: Icon, label, value, accentText }: {
  icon: LucideIcon;
  label: string;
  value: string;
  accentText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
      <span className="flex items-center gap-2 text-[12.5px] text-[#9fb3cf] min-w-0">
        <Icon size={14} className={cn("flex-shrink-0", accentText)} />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-[13px] font-semibold text-white tabular-nums flex-shrink-0">{value}</span>
    </div>
  );
}

// ─── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: DisplayPlanFull }) {
  const a = ACCENT[plan.accent];
  const limits: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Users,         label: "الموظفين",            value: numOrDash(plan.limits.maxEmployees) },
    { icon: Building2,     label: "الوكالات",            value: numOrDash(plan.limits.maxAgencies) },
    { icon: Layers,        label: "الإدارات",            value: numOrDash(plan.limits.maxDepartments) },
    { icon: Grid3x3,       label: "الأقسام",             value: numOrDash(plan.limits.maxSections) },
    { icon: Sparkles,      label: "الذكاء الاصطناعي",     value: aiLevelLabel(plan.limits.aiLevel) },
    { icon: MessageCircle, label: "واتساب بوت",          value: whatsappLabel(plan.limits.whatsappEnabled) },
  ];

  return (
    <div className={cn("glass-card relative overflow-hidden p-5 flex flex-col border", a.border)}>
      {/* Accent glow */}
      <div className={cn("pointer-events-none absolute -top-16 -left-10 h-32 w-32 rounded-full blur-3xl opacity-40", a.iconBg)} />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border", a.iconBg, a.border)}>
            <Layers size={20} className={a.text} />
          </span>
          <div className="min-w-0">
            <h3 className="font-heading text-xl font-bold text-white leading-tight truncate">{plan.name}</h3>
            <div className="text-[11px] text-[#7c93b5] font-mono truncate mt-0.5">{plan.slug}</div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium flex-shrink-0 border",
            plan.isActive
              ? "bg-[#10b981]/12 text-[#34d399] border-[#10b981]/30"
              : "bg-[#6b7280]/12 text-[#9ca3af] border-[#6b7280]/30",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", plan.isActive ? "bg-[#34d399]" : "bg-[#9ca3af]")} />
          {plan.isActive ? "نشطة" : "معطّلة"}
        </span>
      </div>

      {/* Price block */}
      <div className={cn("relative mt-4 grid grid-cols-2 rounded-xl border bg-white/[0.02] overflow-hidden", a.border)}>
        <div className="p-3.5 text-center border-l border-white/[0.06]">
          <div className="text-[11px] text-[#8ba3c7] mb-1">شهريًا</div>
          <div className="text-[15px] font-bold text-white tabular-nums leading-tight">{priceLabel(plan.priceMonthly)}</div>
        </div>
        <div className="p-3.5 text-center">
          <div className="text-[11px] text-[#8ba3c7] mb-1">سنويًا</div>
          <div className="text-[15px] font-bold text-white tabular-nums leading-tight">{priceLabel(plan.priceAnnual)}</div>
        </div>
      </div>

      {/* Limits */}
      <div className="relative mt-4 flex items-center gap-1.5 text-[11px] font-medium text-[#8ba3c7] uppercase tracking-wide">
        <SlidersHorizontal size={12} className={a.text} />
        حدود الباقة
      </div>
      <div className="relative mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 flex-1">
        {limits.map((l) => (
          <LimitRow key={l.label} icon={l.icon} label={l.label} value={l.value} accentText={a.text} />
        ))}
      </div>

      {/* Metadata — visually separated from limits */}
      <div className="relative mt-4 pt-3.5 border-t border-white/[0.07] flex items-center gap-4 text-[11px] text-[#7c93b5]">
        <span className="inline-flex items-center gap-1.5">
          <ArrowUpDown size={12} />
          الترتيب <span className="text-[#9fb3cf] tabular-nums">{plan.sortOrder}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={12} />
          <span className="text-[#9fb3cf] tabular-nums">{plan.createdAt}</span>
        </span>
      </div>

      {/* Disabled actions */}
      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10.5px] text-[#7c93b5]">
          <Lock size={11} />
          قريبًا
        </span>
        <DisabledAction icon={Edit2} label="تعديل" />
        <DisabledAction icon={PauseCircle} label="تعطيل" />
        <DisabledAction icon={SlidersHorizontal} label="تعديل الحدود" />
      </div>
    </div>
  );
}

// ─── KPI pill ──────────────────────────────────────────────────────────────────

function KpiPill({ label, value, color, border, loading }: {
  label: string;
  value: string;
  color: string;
  border: string;
  loading: boolean;
}) {
  return (
    <div className={cn("glass-card flex items-center justify-between gap-2 px-3.5 py-3 border", border)}>
      <span className="text-[11px] text-[#8ba3c7] leading-tight">{label}</span>
      <span className={cn("font-heading text-xl sm:text-2xl font-bold tabular-nums", color, loading && "animate-pulse opacity-40")}>
        {value}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPageContent() {
  const [plans, setPlans] = useState<DisplayPlanFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlansPage()
      .then(setPlans)
      .catch(() => setError("فشل تحميل بيانات الباقات"))
      .finally(() => setLoading(false));
  }, []);

  const total = plans?.length ?? 0;
  const activeCount = plans?.filter((p) => p.isActive).length ?? 0;
  const inactiveCount = total - activeCount;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22d3ee]/12 border border-[#22d3ee]/25">
                <Layers size={20} className="text-[#22d3ee]" />
              </span>
              الباقات
            </h1>
            <ReadOnlyBadge />
          </div>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            باقات منصة Blumark24 وحدودها. هذه الصفحة للعرض فقط في المرحلة الحالية.
          </p>
        </div>

        {/* Intentionally disabled create button */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="غير متاح حاليًا"
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-2.5 text-[13px] font-medium text-white/45 cursor-not-allowed flex-shrink-0 self-start"
        >
          <Plus size={15} className="opacity-70" />
          إنشاء باقة
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b]/12 border border-[#f59e0b]/25 px-1.5 py-0.5 text-[10px] text-[#fbbf24]">
            <Lock size={9} />
            قريبًا
          </span>
        </button>
      </div>

      {/* KPI strip — compact */}
      <div className="grid grid-cols-3 gap-2.5">
        <KpiPill label="الإجمالي"  value={loading ? "…" : String(total)}         color="text-[#22d3ee]" border="border-[#22d3ee]/20" loading={loading} />
        <KpiPill label="نشطة"      value={loading ? "…" : String(activeCount)}   color="text-[#10b981]" border="border-[#10b981]/20" loading={loading} />
        <KpiPill label="معطّلة"     value={loading ? "…" : String(inactiveCount)} color="text-[#9ca3af]" border="border-[#6b7280]/20" loading={loading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[13px] text-[#ff9a68]">
          <RefreshCw size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Plans grid */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <PlanSkeleton key={i} />)
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
          ) : (
            <div className="md:col-span-2 xl:col-span-3 glass-card p-10 text-center">
              <Layers size={28} className="mx-auto text-[#3a5680] mb-3" />
              <p className="text-[13px] text-[#8ba3c7]">لا توجد باقات بعد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
