"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  Layers,
  Edit2,
  PauseCircle,
  SlidersHorizontal,
  Users,
  Building2,
  Grid3x3,
  Sparkles,
  MessageCircle,
  RefreshCw,
  X,
  Check,
  Power,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { ACCENT } from "../../_accent";
import { fetchPlansPage, type DisplayPlanFull, type PlanLimitsValues } from "../../_lib/ownerQueries";
import {
  fetchPlanFeatures,
  OWNER_FEATURE_LABELS_AR,
  OWNER_WORKSPACE_FEATURES,
  setPlanActive,
  updatePlanFeatures,
  updatePlanLimits,
  updatePlanPricing,
  type OwnerWorkspaceFeature,
} from "../../_lib/planMutations";

function numOrDash(n: number | null): string {
  if (n === -1) return "غير محدود";
  return n === null ? "—" : n.toLocaleString("en-US");
}

function priceLabel(n: number | null): string {
  return n === null ? "حسب العقد" : `${n.toLocaleString("en-US")} ر.س`;
}

function aiLevelLabel(level: number | null): string {
  if (level === null) return "—";
  if (level <= 0) return "غير مفعّل";
  if (level === 1) return "محدود";
  if (level === 2) return "متوسط";
  return "كامل";
}

function whatsappLabel(value: number | null): string {
  if (value === null) return "—";
  return value === 1 ? "مفعّل" : "معطّل";
}

function parseNumberOrNull(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredNumber(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

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

function ModalShell({ title, children, onClose }: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[#0d1f3c] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h3 className="font-heading text-base font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-[#8ba3c7]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-[rgba(13,31,60,0.78)] border border-white/[0.10] px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#22d3ee]/55"
      />
    </label>
  );
}

function EditPlanModal({ plan, onClose, onSaved }: {
  plan: DisplayPlanFull;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(plan.name);
  const [monthly, setMonthly] = useState(plan.priceMonthly === null ? "" : String(plan.priceMonthly));
  const [annual, setAnnual] = useState(plan.priceAnnual === null ? "" : String(plan.priceAnnual));
  const [sortOrder, setSortOrder] = useState(String(plan.sortOrder));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await updatePlanPricing({
      id: plan.id,
      name,
      priceMonthly: parseNumberOrNull(monthly),
      priceAnnual: parseNumberOrNull(annual),
      sortOrder: Number(sortOrder),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر تحديث الباقة");
      return;
    }
    toast.success("تم تحديث بيانات الباقة");
    onSaved();
    onClose();
  }

  return (
    <ModalShell title={`تعديل الباقة — ${plan.name}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="اسم الباقة" value={name} onChange={setName} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="السعر الشهري" type="number" value={monthly} onChange={setMonthly} placeholder="فارغ = حسب العقد" />
          <Field label="السعر السنوي" type="number" value={annual} onChange={setAnnual} placeholder="فارغ = حسب العقد" />
        </div>
        <Field label="ترتيب الظهور" type="number" value={sortOrder} onChange={setSortOrder} />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm text-[#8ba3c7] hover:text-white hover:bg-white/[0.06]">
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-4 py-2 text-sm text-[#22d3ee] hover:bg-[#22d3ee]/25 disabled:opacity-40">
            <Check size={14} /> {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function LimitsModal({ plan, onClose, onSaved }: {
  plan: DisplayPlanFull;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<Record<keyof PlanLimitsValues, string>>({
    maxEmployees: plan.limits.maxEmployees === null ? "" : String(plan.limits.maxEmployees),
    maxAgencies: plan.limits.maxAgencies === null ? "" : String(plan.limits.maxAgencies),
    maxDepartments: plan.limits.maxDepartments === null ? "" : String(plan.limits.maxDepartments),
    maxSections: plan.limits.maxSections === null ? "" : String(plan.limits.maxSections),
    aiLevel: plan.limits.aiLevel === null ? "" : String(plan.limits.aiLevel),
    whatsappEnabled: plan.limits.whatsappEnabled === null ? "" : String(plan.limits.whatsappEnabled),
  });
  const [saving, setSaving] = useState(false);

  function setField(key: keyof PlanLimitsValues, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    const limits: PlanLimitsValues = {
      maxEmployees: parseRequiredNumber(values.maxEmployees),
      maxAgencies: parseRequiredNumber(values.maxAgencies),
      maxDepartments: parseRequiredNumber(values.maxDepartments),
      maxSections: parseRequiredNumber(values.maxSections),
      aiLevel: parseRequiredNumber(values.aiLevel),
      whatsappEnabled: parseRequiredNumber(values.whatsappEnabled),
    };

    setSaving(true);
    const res = await updatePlanLimits({ id: plan.id, limits });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر تحديث حدود الباقة");
      return;
    }
    toast.success("تم تحديث حدود الباقة");
    onSaved();
    onClose();
  }

  return (
    <ModalShell title={`تعديل الحدود — ${plan.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الحد الأقصى للموظفين" type="number" value={values.maxEmployees} onChange={(v) => setField("maxEmployees", v)} />
          <Field label="الحد الأقصى للوكالات" type="number" value={values.maxAgencies} onChange={(v) => setField("maxAgencies", v)} />
          <Field label="الحد الأقصى للإدارات" type="number" value={values.maxDepartments} onChange={(v) => setField("maxDepartments", v)} />
          <Field label="الحد الأقصى للأقسام" type="number" value={values.maxSections} onChange={(v) => setField("maxSections", v)} />
          <Field label="مستوى الذكاء الاصطناعي" type="number" value={values.aiLevel} onChange={(v) => setField("aiLevel", v)} />
          <Field label="واتساب بوت 0/1" type="number" value={values.whatsappEnabled} onChange={(v) => setField("whatsappEnabled", v)} />
        </div>
        <p className="text-[11px] text-[#8ba3c7] leading-relaxed">
          استخدم -1 للحد غير المحدود، و 0/1 لتعطيل أو تفعيل واتساب بوت.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm text-[#8ba3c7] hover:text-white hover:bg-white/[0.06]">
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-[#a855f7]/40 bg-[#a855f7]/15 px-4 py-2 text-sm text-[#c084fc] hover:bg-[#a855f7]/25 disabled:opacity-40">
            <Check size={14} /> {saving ? "جاري الحفظ..." : "حفظ الحدود"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function FeaturesModal({ plan, onClose, onSaved }: {
  plan: DisplayPlanFull;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState<Set<OwnerWorkspaceFeature>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlanFeatures(plan.id)
      .then((features) => {
        if (alive) setSelected(new Set(features));
      })
      .catch(() => {
        if (alive) setError("تعذّر تحميل ميزات الباقة");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [plan.id]);

  function toggle(feature: OwnerWorkspaceFeature) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const res = await updatePlanFeatures({ id: plan.id, featureKeys: Array.from(selected) });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر حفظ ميزات الباقة");
      return;
    }
    toast.success("تم تحديث ميزات الباقة");
    onSaved();
    onClose();
  }

  return (
    <ModalShell title={`إدارة الميزات — ${plan.name}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[12px] text-[#8ba3c7] leading-relaxed">
          اختر الوحدات التي تظهر لهذه الباقة في مساحة العميل. التغيير لا يحذف بيانات العميل؛ فقط يتحكم في الظهور والصلاحية.
        </p>
        {error && (
          <div className="rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-3 py-2 text-[12px] text-[#ff9a68]">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {OWNER_WORKSPACE_FEATURES.map((feature) => (
            <label
              key={feature}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors cursor-pointer",
                selected.has(feature)
                  ? "border-[#22d3ee]/35 bg-[#22d3ee]/[0.10]"
                  : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]",
                loading && "opacity-50 pointer-events-none",
              )}
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-white">{OWNER_FEATURE_LABELS_AR[feature]}</span>
                <span className="block text-[10px] text-[#8ba3c7] font-mono">{feature}</span>
              </span>
              <input
                type="checkbox"
                checked={selected.has(feature)}
                onChange={() => toggle(feature)}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.10] px-4 py-2 text-sm text-[#8ba3c7] hover:text-white hover:bg-white/[0.06]">
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={saving || loading || !!error} className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-4 py-2 text-sm text-[#22d3ee] hover:bg-[#22d3ee]/25 disabled:opacity-40">
            <Check size={14} /> {saving ? "جاري الحفظ..." : "حفظ الميزات"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function PlanActions({ plan, busy, onEdit, onToggle, onLimits, onFeatures }: {
  plan: DisplayPlanFull;
  busy: boolean;
  onEdit: (plan: DisplayPlanFull) => void;
  onToggle: (plan: DisplayPlanFull) => void;
  onLimits: (plan: DisplayPlanFull) => void;
  onFeatures: (plan: DisplayPlanFull) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={() => onEdit(plan)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/30 bg-[#22d3ee]/[0.10] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        <Edit2 size={11} /> تعديل
      </button>
      <button
        type="button"
        onClick={() => onToggle(plan)}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          plan.isActive
            ? "border-[#f59e0b]/30 bg-[#f59e0b]/[0.10] text-[#fbbf24] hover:bg-[#f59e0b]/20"
            : "border-[#10b981]/40 bg-[#10b981]/15 text-[#34d399] hover:bg-[#10b981]/25",
        )}
      >
        {plan.isActive ? <PauseCircle size={11} /> : <Power size={11} />}
        {plan.isActive ? "تعطيل" : "تفعيل"}
      </button>
      <button type="button" onClick={() => onLimits(plan)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/[0.10] px-2.5 py-1 text-[11px] text-[#c084fc] hover:bg-[#a855f7]/20 hover:border-[#a855f7]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        <SlidersHorizontal size={11} /> تعديل الحدود
      </button>
      <button type="button" onClick={() => onFeatures(plan)} disabled={busy} className="inline-flex items-center gap-1 rounded-lg border border-[#1e6fd9]/30 bg-[#1e6fd9]/[0.10] px-2.5 py-1 text-[11px] text-[#5b9bf0] hover:bg-[#1e6fd9]/20 hover:border-[#1e6fd9]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        <Settings2 size={11} /> الميزات
      </button>
    </div>
  );
}

function PlanCard({ plan, busy, onEdit, onToggle, onLimits, onFeatures }: {
  plan: DisplayPlanFull;
  busy: boolean;
  onEdit: (plan: DisplayPlanFull) => void;
  onToggle: (plan: DisplayPlanFull) => void;
  onLimits: (plan: DisplayPlanFull) => void;
  onFeatures: (plan: DisplayPlanFull) => void;
}) {
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
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] flex-shrink-0 border", plan.isActive ? "bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30" : "bg-[#6b7280]/15 text-[#9ca3af] border-[#6b7280]/30")}>
          {plan.isActive ? "نشطة" : "معطّلة"}
        </span>
      </div>

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

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8ba3c7]">
        <SlidersHorizontal size={12} className={a.text} />
        حدود الباقة
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2.5 flex-1">
        {metrics.map((m) => <LimitTile key={m.label} icon={m.icon} label={m.label} value={m.value} accentText={a.text} />)}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[#8ba3c7]">
          <span>الترتيب: <span className="text-white tabular-nums">{plan.sortOrder}</span></span>
          <span>أُنشئت: <span className="text-white tabular-nums">{plan.createdAt}</span></span>
        </div>
        <PlanActions plan={plan} busy={busy} onEdit={onEdit} onToggle={onToggle} onLimits={onLimits} onFeatures={onFeatures} />
      </div>
    </div>
  );
}

export default function PlansPageContent() {
  const toast = useToast();
  const [plans, setPlans] = useState<DisplayPlanFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<DisplayPlanFull | null>(null);
  const [limitsPlan, setLimitsPlan] = useState<DisplayPlanFull | null>(null);
  const [featuresPlan, setFeaturesPlan] = useState<DisplayPlanFull | null>(null);

  const loadPlans = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const next = await fetchPlansPage();
      setPlans(next);
    } catch {
      setError("فشل تحميل بيانات الباقات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  const handleToggle = useCallback(async (plan: DisplayPlanFull) => {
    const nextActive = !plan.isActive;
    const ok = window.confirm(nextActive ? `تفعيل الباقة "${plan.name}"؟` : `تعطيل الباقة "${plan.name}"؟\nلن يتم حذف أي بيانات أو اشتراكات.`);
    if (!ok) return;

    setBusyId(plan.id);
    const res = await setPlanActive({ id: plan.id, isActive: nextActive });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر تحديث حالة الباقة");
      return;
    }
    toast.success(nextActive ? "تم تفعيل الباقة" : "تم تعطيل الباقة");
    void loadPlans();
  }, [loadPlans, toast]);

  const total = plans?.length ?? 0;
  const activeCount = plans?.filter((p) => p.isActive).length ?? 0;
  const inactiveCount = total - activeCount;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Layers size={26} className="text-[#22d3ee]" />
            الباقات
          </h1>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            إدارة باقات منصة Blumark24 وأسعارها وحدودها وميزاتها من لوحة المالك مباشرة.
          </p>
        </div>
        <button type="button" onClick={() => void loadPlans()} className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee] hover:bg-[#22d3ee]/15 transition-colors flex-shrink-0">
          <RefreshCw size={15} />
          تحديث البيانات
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الباقات", value: loading ? "…" : String(total),        color: "text-[#22d3ee]", border: "border-[#22d3ee]/20" },
          { label: "نشطة",          value: loading ? "…" : String(activeCount),   color: "text-[#10b981]", border: "border-[#10b981]/20" },
          { label: "معطّلة",        value: loading ? "…" : String(inactiveCount), color: "text-[#9ca3af]", border: "border-[#6b7280]/20" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={cn("glass-card p-4 border text-center", border)}>
            <div className={cn("font-heading text-2xl font-bold tabular-nums", color, loading && "animate-pulse opacity-40")}>{value}</div>
            <div className="mt-1 text-[11px] text-[#8ba3c7]">{label}</div>
          </div>
        ))}
      </div>

      {error && <div className="flex items-center gap-2.5 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[13px] text-[#ff9a68]"><RefreshCw size={14} className="flex-shrink-0" />{error}</div>}

      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <PlanSkeleton key={i} />)
          ) : plans && plans.length > 0 ? (
            plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                busy={busyId === plan.id}
                onEdit={setEditPlan}
                onToggle={handleToggle}
                onLimits={setLimitsPlan}
                onFeatures={setFeaturesPlan}
              />
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center glass-card p-10 text-center rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
              <Layers size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
              <p className="text-[14px] font-medium text-white">لا توجد باقات مسجّلة بعد</p>
              <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-sm leading-relaxed">تُعرض هنا الباقات من جدول plans مع حدود plan_limits عند توفرها.</p>
            </div>
          )}
        </div>
      )}

      {editPlan && <EditPlanModal plan={editPlan} onClose={() => setEditPlan(null)} onSaved={loadPlans} />}
      {limitsPlan && <LimitsModal plan={limitsPlan} onClose={() => setLimitsPlan(null)} onSaved={loadPlans} />}
      {featuresPlan && <FeaturesModal plan={featuresPlan} onClose={() => setFeaturesPlan(null)} onSaved={loadPlans} />}
    </div>
  );
}
