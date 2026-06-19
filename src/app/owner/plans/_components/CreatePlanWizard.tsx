"use client";

import { useState } from "react";
import {
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createPlan, type NewPlanInput } from "../../_lib/ownerQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardState {
  name: string;
  slug: string;
  priceMonthly: string;
  priceAnnual: string;
  sortOrder: string;
  maxEmployees: string;
  maxAgencies: string;
  maxDepartments: string;
  maxSections: string;
  aiLevel: string;
  whatsappEnabled: string;
}

const INITIAL: WizardState = {
  name: "",
  slug: "",
  priceMonthly: "",
  priceAnnual: "",
  sortOrder: "10",
  maxEmployees: "",
  maxAgencies: "",
  maxDepartments: "",
  maxSections: "",
  aiLevel: "1",
  whatsappEnabled: "0",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(val: string): number | null {
  const n = Number(val.trim());
  return val.trim() === "" || isNaN(n) ? null : Math.max(0, Math.floor(n));
}

function autoSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^؀-ۿa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Field components ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12px] font-medium text-[#8ba3c7]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#5f7798]">{hint}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder-[#5f7798] outline-none focus:border-[#22d3ee]/50 focus:ring-1 focus:ring-[#22d3ee]/20 transition";

// ─── Step 1 — Basic Info ──────────────────────────────────────────────────────

function StepBasic({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="اسم الباقة *">
        <input
          className={INPUT_CLS}
          placeholder="مثال: Enterprise"
          value={state.name}
          onChange={(e) => {
            const name = e.target.value;
            onChange({ name, slug: state.slug || autoSlug(name) });
          }}
        />
      </Field>

      <Field label="المعرّف (slug) *" hint="أحرف صغيرة وأرقام وشرطة فقط">
        <input
          className={INPUT_CLS}
          placeholder="مثال: enterprise"
          value={state.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          dir="ltr"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="السعر الشهري (ر.س)">
          <input
            className={INPUT_CLS}
            placeholder="0"
            type="number"
            min="0"
            value={state.priceMonthly}
            onChange={(e) => onChange({ priceMonthly: e.target.value })}
            dir="ltr"
          />
        </Field>
        <Field label="السعر السنوي (ر.س)">
          <input
            className={INPUT_CLS}
            placeholder="0"
            type="number"
            min="0"
            value={state.priceAnnual}
            onChange={(e) => onChange({ priceAnnual: e.target.value })}
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="الترتيب" hint="رقم أصغر = يظهر أولاً">
        <input
          className={INPUT_CLS}
          placeholder="10"
          type="number"
          min="1"
          value={state.sortOrder}
          onChange={(e) => onChange({ sortOrder: e.target.value })}
          dir="ltr"
        />
      </Field>
    </div>
  );
}

// ─── Step 2 — Limits ─────────────────────────────────────────────────────────

function StepLimits({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="الحد الأقصى للموظفين">
          <input
            className={INPUT_CLS}
            placeholder="—"
            type="number"
            min="0"
            value={state.maxEmployees}
            onChange={(e) => onChange({ maxEmployees: e.target.value })}
            dir="ltr"
          />
        </Field>
        <Field label="الحد الأقصى للوكالات">
          <input
            className={INPUT_CLS}
            placeholder="—"
            type="number"
            min="0"
            value={state.maxAgencies}
            onChange={(e) => onChange({ maxAgencies: e.target.value })}
            dir="ltr"
          />
        </Field>
        <Field label="الحد الأقصى للإدارات">
          <input
            className={INPUT_CLS}
            placeholder="—"
            type="number"
            min="0"
            value={state.maxDepartments}
            onChange={(e) => onChange({ maxDepartments: e.target.value })}
            dir="ltr"
          />
        </Field>
        <Field label="الحد الأقصى للأقسام">
          <input
            className={INPUT_CLS}
            placeholder="—"
            type="number"
            min="0"
            value={state.maxSections}
            onChange={(e) => onChange({ maxSections: e.target.value })}
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="مستوى الذكاء الاصطناعي">
        <select
          className={INPUT_CLS}
          value={state.aiLevel}
          onChange={(e) => onChange({ aiLevel: e.target.value })}
          dir="rtl"
        >
          <option value="0">معطّل</option>
          <option value="1">محدود</option>
          <option value="2">متوسط</option>
          <option value="3">كامل</option>
        </select>
      </Field>

      <Field label="واتساب بوت">
        <select
          className={INPUT_CLS}
          value={state.whatsappEnabled}
          onChange={(e) => onChange({ whatsappEnabled: e.target.value })}
          dir="rtl"
        >
          <option value="0">معطّل</option>
          <option value="1">مفعّل</option>
        </select>
      </Field>
    </div>
  );
}

// ─── Step 3 — Confirm ─────────────────────────────────────────────────────────

function StepConfirm({ state }: { state: WizardState }) {
  const rows: { label: string; value: string }[] = [
    { label: "الاسم",          value: state.name || "—" },
    { label: "المعرّف",        value: state.slug || "—" },
    { label: "السعر الشهري",  value: state.priceMonthly ? `${state.priceMonthly} ر.س` : "—" },
    { label: "السعر السنوي",   value: state.priceAnnual ? `${state.priceAnnual} ر.س` : "—" },
    { label: "الترتيب",        value: state.sortOrder || "10" },
    { label: "الموظفون",       value: state.maxEmployees || "—" },
    { label: "الوكالات",       value: state.maxAgencies || "—" },
    { label: "الإدارات",       value: state.maxDepartments || "—" },
    { label: "الأقسام",        value: state.maxSections || "—" },
    { label: "ذكاء اصطناعي",  value: ["معطّل", "محدود", "متوسط", "كامل"][Number(state.aiLevel) ?? 0] ?? "—" },
    { label: "واتساب بوت",    value: state.whatsappEnabled === "1" ? "مفعّل" : "معطّل" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#8ba3c7]">راجع البيانات قبل الإنشاء. الباقة ستُفعَّل فور الإنشاء.</p>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06] overflow-hidden">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
            <span className="text-[#8ba3c7]">{label}</span>
            <span className="text-white font-medium tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wizard Modal ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: "المعلومات الأساسية" },
  { label: "الحدود" },
  { label: "تأكيد الإنشاء" },
];

interface CreatePlanWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePlanWizard({ onClose, onCreated }: CreatePlanWizardProps) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...p }));
  }

  function validateStep0(): string | null {
    if (!state.name.trim()) return "اسم الباقة مطلوب";
    if (!state.slug.trim()) return "المعرّف (slug) مطلوب";
    if (!/^[a-z0-9-]+$/.test(state.slug.trim())) return "المعرّف يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة فقط";
    return null;
  }

  function next() {
    setError(null);
    if (step === 0) {
      const err = validateStep0();
      if (err) { setError(err); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    setError(null);
    const err = validateStep0();
    if (err) { setError(err); return; }

    const input: NewPlanInput = {
      name: state.name.trim(),
      slug: state.slug.trim().toLowerCase(),
      priceMonthly: parseNum(state.priceMonthly),
      priceAnnual: parseNum(state.priceAnnual),
      sortOrder: parseNum(state.sortOrder) ?? 10,
      limits: {
        maxEmployees:    parseNum(state.maxEmployees),
        maxAgencies:     parseNum(state.maxAgencies),
        maxDepartments:  parseNum(state.maxDepartments),
        maxSections:     parseNum(state.maxSections),
        aiLevel:         parseNum(state.aiLevel),
        whatsappEnabled: parseNum(state.whatsappEnabled),
      },
    };

    setSubmitting(true);
    const result = await createPlan(input);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "تعذّر إنشاء الباقة");
      return;
    }

    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0a0f1e]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg glass-card border border-white/[0.10] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22d3ee]/12">
              <Layers size={16} className="text-[#22d3ee]" />
            </span>
            <div>
              <h2 className="font-heading text-[15px] font-bold text-white">إنشاء باقة جديدة</h2>
              <p className="text-[11px] text-[#5f7798]">{STEPS[step].label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5f7798] hover:text-white hover:bg-white/[0.06] transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold border transition",
                  i < step
                    ? "bg-[#22d3ee] border-[#22d3ee] text-[#0a0f1e]"
                    : i === step
                    ? "border-[#22d3ee] text-[#22d3ee] bg-[#22d3ee]/10"
                    : "border-white/[0.15] text-[#5f7798]",
                )}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] truncate",
                  i === step ? "text-white font-medium" : "text-[#5f7798]",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-white/[0.08] mx-1 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 0 && <StepBasic state={state} onChange={patch} />}
          {step === 1 && <StepLimits state={state} onChange={patch} />}
          {step === 2 && <StepConfirm state={state} />}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[12px] text-[#ff9a68]">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.08]">
          <button
            onClick={step === 0 ? onClose : prev}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-[13px] text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition disabled:opacity-40"
          >
            <ChevronRight size={14} />
            {step === 0 ? "إلغاء" : "السابق"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#22d3ee] px-5 py-2 text-[13px] font-semibold text-[#0a0f1e] hover:bg-[#22d3ee]/90 transition"
            >
              التالي
              <ChevronLeft size={14} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#22d3ee] px-5 py-2 text-[13px] font-semibold text-[#0a0f1e] hover:bg-[#22d3ee]/90 transition disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> جارٍ الإنشاء…</>
              ) : (
                <><Check size={14} /> إنشاء الباقة</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
