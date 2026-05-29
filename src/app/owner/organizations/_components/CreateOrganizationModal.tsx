"use client";

import { useEffect, useState } from "react";
import { X, Building2, AlertCircle, ShieldCheck } from "lucide-react";
import {
  createOrganization,
  fetchPlanOptions,
  provisionTenant,
  type PlanOption,
  type NewOrganizationInput,
  type ProvisionTenantResult,
} from "../../_lib/ownerQueries";

type Status = NewOrganizationInput["status"];
type BillingCycle = "monthly" | "annual";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "active",    label: "نشطة" },
  { value: "trial",     label: "تجريبية" },
  { value: "suspended", label: "معلقة" },
  { value: "cancelled", label: "ملغاة" },
];

const BILLING_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "شهري" },
  { value: "annual",  label: "سنوي" },
];

const FAILED_STEP_AR: Record<string, string> = {
  create_subscription: "إنشاء الاشتراك",
  tenant_workspace_settings: "إعدادات مساحة العمل",
  create_auth_user: "إنشاء حساب الدخول",
  link_profile: "ربط الملف الشخصي",
};

const EMPTY_FORM = {
  name: "",
  managerName: "",
  slug: "",
  ownerEmail: "",
  password: "",
  planId: "",
  status: "active" as Status,
  billingCycle: "monthly" as BillingCycle,
};

export interface CreateOrganizationSuccess {
  organizationName: string;
  ownerEmail: string;
  organizationCode: string | null;
  planName: string | null;
  partial?: boolean;
  failedStep?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateOrganizationSuccess) => void;
}

function formatProvisionError(res: ProvisionTenantResult): string {
  if (res.partial) {
    const step = res.failedStep
      ? FAILED_STEP_AR[res.failedStep] ?? res.failedStep
      : null;
    const base = "تم إنشاء جزء من العميل، ويحتاج مراجعة من لوحة المالك";
    return step ? `${base} (توقف عند: ${step})` : base;
  }
  const msg = res.error ?? "تعذّر إنشاء العميل الكامل";
  if (/بريد|email|مسجّل|مرتبط/i.test(msg)) {
    return msg;
  }
  if (/كلمة المرور|password/i.test(msg)) {
    return msg;
  }
  if (/باقة|plan/i.test(msg)) {
    return msg;
  }
  return msg;
}

export default function CreateOrganizationModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansError, setPlansError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgOnlyMode, setOrgOnlyMode] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError(null);
    setOrgOnlyMode(false);
    setPlansError(false);
    let active = true;
    fetchPlanOptions()
      .then((data) => active && setPlans(data))
      .catch(() => active && setPlansError(true));
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const selectedPlanName =
    plans.find((p) => p.id === form.planId)?.name ?? (form.planId ? "—" : null);

  const handleOrgOnlySubmit = async () => {
    if (!form.name.trim()) {
      setError("اسم المنشأة مطلوب");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await createOrganization({
        name: form.name,
        slug: form.slug || null,
        ownerEmail: form.ownerEmail.trim() || null,
        planId: form.planId || null,
        status: form.status,
        notes: null,
      });
      if (!res.ok) {
        setError(res.error ?? "تعذّر إنشاء المنشأة");
        return;
      }
      onCreated({
        organizationName: form.name.trim(),
        ownerEmail: form.ownerEmail.trim() || "—",
        organizationCode: null,
        planName: selectedPlanName,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!form.name.trim()) {
      setError("اسم المنشأة مطلوب");
      return;
    }
    if (!form.ownerEmail.trim()) {
      setError("بريد مدير المنشأة مطلوب");
      return;
    }
    if (!form.password) {
      setError("كلمة المرور المؤقتة مطلوبة");
      return;
    }

    setSaving(true);
    try {
      const res = await provisionTenant({
        name: form.name,
        slug: form.slug || undefined,
        ownerEmail: form.ownerEmail,
        password: form.password,
        planId: form.planId || undefined,
        status: form.status,
        billingCycle: form.billingCycle,
      });

      if (res.partial) {
        setError(formatProvisionError(res));
        onCreated({
          organizationName: form.name.trim(),
          ownerEmail: form.ownerEmail.trim().toLowerCase(),
          organizationCode: res.organizationCode ?? null,
          planName: selectedPlanName,
          partial: true,
          failedStep: res.failedStep,
        });
        return;
      }

      if (!res.ok) {
        setError(formatProvisionError(res));
        return;
      }

      onCreated({
        organizationName: form.name.trim(),
        ownerEmail: res.email ?? form.ownerEmail.trim().toLowerCase(),
        organizationCode: res.organizationCode ?? null,
        planName: selectedPlanName,
      });
      onClose();
    } catch {
      setError("تعذّر إنشاء العميل الكامل — حاول مجدداً");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto border border-[#22d3ee]/20">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22d3ee]/12 border border-[#22d3ee]/25">
              <Building2 size={16} className="text-[#22d3ee]" />
            </span>
            {orgOnlyMode ? "إنشاء منشأة (سجل فقط)" : "إنشاء عميل كامل"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-[#8ba3c7] hover:text-white transition-colors disabled:opacity-50"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {!orgOnlyMode && (
          <div className="mb-4 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/[0.06] px-4 py-3 text-[12px] text-[#b9d8ff] leading-relaxed">
            <div className="flex items-center gap-2 text-[#22d3ee] font-medium mb-1">
              <ShieldCheck size={14} />
              إنشاء تلقائي آمن
            </div>
            ينشئ المؤسسة والاشتراك وإعدادات مساحة العمل وحساب مدير المنشأة في عملية واحدة عبر الخادم.
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={orgOnlyMode ? (e) => { e.preventDefault(); void handleOrgOnlySubmit(); } : handleProvisionSubmit}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">اسم المنشأة *</label>
            <input
              className="input-dark text-sm"
              placeholder="مثال: شركة القمة التقنية"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          {!orgOnlyMode && (
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">اسم مدير المنشأة (اختياري)</label>
              <input
                className="input-dark text-sm"
                placeholder="يُعرض في رسالة النجاح — الملف يستخدم اسم المنشأة"
                value={form.managerName}
                onChange={(e) => setForm({ ...form, managerName: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">المعرّف (slug)</label>
              <input
                className="input-dark text-sm"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="example-co"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">
                بريد مدير المنشأة {orgOnlyMode ? "" : "*"}
              </label>
              <input
                className="input-dark text-sm"
                type="email"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="owner@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                spellCheck={false}
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              />
            </div>
          </div>

          {!orgOnlyMode && (
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">كلمة مرور مؤقتة *</label>
              <input
                className="input-dark text-sm"
                type="password"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="Temporary@123"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-[10px] text-[#8ba3c7] mt-1">
                8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">الباقة</label>
              <select
                className="input-dark text-sm"
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                disabled={plansError}
              >
                <option value="">بدون باقة</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {plansError && (
                <p className="text-[10px] text-amber-400/80 mt-1">تعذّر تحميل الباقات</p>
              )}
            </div>
            {!orgOnlyMode && (
              <div>
                <label className="block text-xs text-[#8ba3c7] mb-1.5">دورة الفوترة</label>
                <select
                  className="input-dark text-sm"
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
                >
                  {BILLING_OPTIONS.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">الحالة</label>
            <select
              className="input-dark text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving
                ? "جارٍ الحفظ..."
                : orgOnlyMode
                  ? "إنشاء السجل فقط"
                  : "إنشاء العميل الكامل"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setOrgOnlyMode((v) => !v);
              setError(null);
            }}
            className="w-full text-center text-[11px] text-[#8ba3c7] hover:text-[#22d3ee] transition-colors disabled:opacity-50"
          >
            {orgOnlyMode
              ? "← العودة إلى إنشاء عميل كامل (مؤسسة + حساب + اشتراك)"
              : "إنشاء سجل منشأة فقط (بدون حساب دخول) — للحالات الاستثنائية"}
          </button>
        </form>
      </div>
    </div>
  );
}
