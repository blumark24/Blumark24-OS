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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import { OWNER_READ_ONLY_ACTION, OWNER_UNAVAILABLE_HINT } from "../../_data";
import OwnerReadOnlyBadge from "../../_components/OwnerReadOnlyBadge";
import { fetchPlansPage, type DisplayPlanFull } from "../../_lib/ownerQueries";
import CreatePlanWizard from "./CreatePlanWizard";
import PlanHistoryTimeline from "./PlanHistoryTimeline";

// ─── Value formatters (Arabic) ────────────────────────────────────────────────

function numOrDash(n: number | null): string {
  return n === null ? "—" : n.toLocaleString("en-US");
}

function priceLabel(n: number | null): string {
  return n === null ? OWNER_UNAVAILABLE_HINT : `${n.toLocaleString("en-US")} ر.س`;
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

// ─── Disabled action buttons (read-only — no mutations) ─────────────────────

function PlanActions() {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-[#5f7798]">{OWNER_READ_ONLY_ACTION}</p>
      <div className="flex flex-wrap items-center gap-1.5">
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/20 bg-[#22d3ee]/[0.06] px-2.5 py-1 text-[11px] text-[#22d3ee]/40 cursor-not-allowed"
      >
        <Edit2 size={11} /> تعديل
      </button>
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] px-2.5 py-1 text-[11px] text-[#fbbf24]/40 cursor-not-allowed"
      >
        <PauseCircle size={11} /> تعطيل
      </button>
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/[0.06] px-2.5 py-1 text-[11px] text-[#c084fc]/40 cursor-not-allowed"
      >
        <SlidersHorizontal size={11} /> تعديل الحدود
      </button>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="glass-card p-6 border border-white/[0.08] flex flex-col animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-5 w-20 rounded bg-white/[0.06]" />
        <div className="h-3 w-28 rounded bg-white/[0.06]" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-white/[0.05]" />
        ))}
      </div>
      <div className="mt-6 h-8 rounded-xl bg-white/[0.06]" />
    </div>
  );
}

// ─── Limit metric tile ─────────────────────────────────────────────────────────

function LimitTile({ icon: Icon, label, value, accentText }: {
  icon: LucideIcon;
  label: string;
  value: string;
  accentText: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[#8ba3c7] text-[11px] mb-1.5">
        <Icon size={13} className={accentText} />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-[13px] font-semibold text-white tabular-nums">{value}</div>
    </div>
  );
}

// ─── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: DisplayPlanFull }) {
  const a = ACCENT[plan.accent];
  const metrics: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Users,         label: "الحد الأقصى للموظفين", value: numOrDash(plan.limits.maxEmployees) },
    { icon: Building2,     label: "الحد الأقصى للوكالات", value: numOrDash(plan.limits.maxAgencies) },
    { icon: Layers,        label: "الحد الأقصى للإدارات", value: numOrDash(plan.limits.maxDepartments) },
    { icon: Grid3x3,       label: "الحد الأقصى للأقسام",  value: numOrDash(plan.limits.maxSections) },
    { icon: Sparkles,      label: "مستوى الذكاء الاصطناعي", value: aiLevelLabel(plan.limits.aiLevel) },
    { icon: MessageCircle, label: "واتساب بوت",          value: whatsappLabel(plan.limits.whatsappEnabled) },
  ];

  return (
    <div className={cn("glass-card relative overflow-hidden p-6 border flex flex-col", a.border)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", a.iconBg)}>
            <Layers size={18} className={a.text} />
          </span>
          <div className="min-w-0">
            <h3 className={cn("font-heading text-lg font-bold truncate", a.text)}>{plan.name}</h3>
            <div className="text-[11px] text-[#8ba3c7] font-mono truncate">{plan.slug}</div>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] flex-shrink-0 border",
            plan.isActive
              ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30"
              : "bg-[#6b7280]/15 text-[#9ca3af] border-[#6b7280]/30",
          )}
        >
          {plan.isActive ? "نشطة" : "معطّلة"}
        </span>
      </div>

      {/* Prices + sort order */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="text-[11px] text-[#8ba3c7] mb-1">السعر الشهري</div>
          <div className="text-[13px] font-semibold text-white tabular-nums">{priceLabel(plan.priceMonthly)}</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
          <div className="text-[11px] text-[#8ba3c7] mb-1">السعر السنوي</div>
          <div className="text-[13px] font-semibold text-white tabular-nums">{priceLabel(plan.priceAnnual)}</div>
        </div>
      </div>

      {/* Limits */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8ba3c7]">
        <SlidersHorizontal size={12} className={a.text} />
        حدود الباقة
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2.5 flex-1">
        {metrics.map((m) => (
          <LimitTile key={m.label} icon={m.icon} label={m.label} value={m.value} accentText={a.text} />
        ))}
      </div>

      {/* Footer: meta + actions */}
      <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[#8ba3c7]">
          <span>الترتيب: <span className="text-white tabular-nums">{plan.sortOrder}</span></span>
          <span>أُنشئت: <span className="text-white tabular-nums">{plan.createdAt}</span></span>
        </div>
        <PlanActions />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPageContent() {
  const [plans, setPlans] = useState<DisplayPlanFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  function loadPlans() {
    setLoading(true);
    fetchPlansPage()
      .then(setPlans)
      .catch(() => setError("فشل تحميل بيانات الباقات"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = plans?.length ?? 0;
  const activeCount = plans?.filter((p) => p.isActive).length ?? 0;
  const inactiveCount = total - activeCount;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Layers size={26} className="text-[#22d3ee]" />
            الباقات
          </h1>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            باقات منصة Blumark24 وحدودها من جداول plans و plan_limits — عرض قراءة فقط.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
          <OwnerReadOnlyBadge />
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/[0.12] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee] hover:bg-[#22d3ee]/[0.20] transition"
          >
            <Plus size={15} />
            إنشاء باقة
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الباقات", value: loading ? "…" : String(total),         color: "text-[#22d3ee]", border: "border-[#22d3ee]/20" },
          { label: "نشطة",          value: loading ? "…" : String(activeCount),    color: "text-[#10b981]", border: "border-[#10b981]/20" },
          { label: "معطّلة",         value: loading ? "…" : String(inactiveCount),  color: "text-[#9ca3af]", border: "border-[#6b7280]/20" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={cn("glass-card p-4 border text-center", border)}>
            <div className={cn("font-heading text-2xl font-bold tabular-nums", color, loading && "animate-pulse opacity-40")}>
              {value}
            </div>
            <div className="mt-1 text-[11px] text-[#8ba3c7]">{label}</div>
          </div>
        ))}
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
            <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center glass-card p-10 text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
              <Layers size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
              <p className="text-[14px] font-medium text-white">لا توجد باقات مسجّلة بعد</p>
              <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-sm leading-relaxed">
                تُعرض هنا الباقات من جدول plans مع حدود plan_limits عند توفرها.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plan history */}
      <PlanHistoryTimeline refreshKey={historyRefreshKey} />

      {/* Create plan wizard */}
      {showWizard && (
        <CreatePlanWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            setHistoryRefreshKey((k) => k + 1);
            loadPlans();
          }}
        />
      )}
    </div>
  );
}
