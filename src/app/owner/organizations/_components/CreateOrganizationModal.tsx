"use client";

import { useEffect, useState } from "react";
import { X, Building2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchPlanOptions,
  type PlanOption,
  type NewOrganizationInput,
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

const EMPTY_FORM = {
  name: "",
  slug: "",
  ownerEmail: "",
  password: "",
  planId: "",
  status: "active" as Status,
  billingCycle: "monthly" as BillingCycle,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface ProvisionTenantResponse {
  success?: boolean;
  error?: string;
  organizationId?: string;
  organization_code?: string;
  customerCode?: string;
  partial?: boolean;
  failedStep?: string;
}

export default function CreateOrganizationModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansError, setPlansError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  // Load plan options + reset the form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError(null);
    setCreatedCode(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setCreatedCode(null);

    if (!form.name.trim()) {
      setError("اسم المنشأة مطلوب");
      return;
    }
    if (!form.ownerEmail.trim()) {
      setError("بريد مالك المنشأة مطلوب لإنشاء العميل الكامل");
      return;
    }
    if (!form.password) {
      setError("كلمة المرور المؤقتة مطلوبة");
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("انتهت الجلسة — سجّل الدخول مجدداً");
        return;
      }

      const res = await fetch("/api/owner/provision-tenant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          ownerEmail: form.ownerEmail,
          password: form.password,
          planId: form.planId || undefined,
          status: form.status,
          billingCycle: form.billingCycle,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as ProvisionTenantResponse;
      if (!res.ok || body.success !== true) {
        const partialHint = body.partial && body.failedStep
          ? ` — تم إنشاء جزء من العميل وتوقف عند: ${body.failedStep}`
          : "";
        setError((body.error ?? "تعذّر إنشاء العميل الكامل") + partialHint);
        return;
      }

      const code = body.organization_code ?? body.customerCode ?? null;
      setCreatedCode(code);
      onCreated();
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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22d3ee]/12 border border-[#22d3ee]/25">
              <Building2 size={16} className="text-[#22d3ee]" />
            </span>
            إنشاء عميل كامل
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

        <div className="mb-4 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/[0.06] px-4 py-3 text-[12px] text-[#b9d8ff] leading-relaxed">
          <div className="flex items-center gap-2 text-[#22d3ee] font-medium mb-1">
            <ShieldCheck size={14} />
            إنشاء تلقائي آمن
          </div>
          ينشئ المؤسسة والاشتراك وإعدادات مساحة العمل وحساب مدير المنشأة في عملية واحدة.
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {createdCode && (
          <div className="mb-4 rounded-xl border border-[#10b981]/25 bg-[#10b981]/10 px-4 py-3 text-[13px] text-[#34d399]">
            تم إنشاء العميل بالكود: <span className="font-mono">{createdCode}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Slug */}
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
            {/* Owner email */}
            <div>
              <label className="block text-xs text-[#8ba3c7] mb-1.5">بريد مالك المنشأة *</label>
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
              يجب أن تحتوي على 8 أحرف على الأقل وحرف كبير وصغير ورقم ورمز.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan */}
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
            {/* Billing */}
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
          </div>

          {/* Status */}
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ إنشاء العميل..." : "إنشاء العميل الكامل"}
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
        </form>
      </div>
    </div>
  );
}
