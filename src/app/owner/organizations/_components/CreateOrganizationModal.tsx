"use client";

import { useEffect, useState } from "react";
import { X, Building2, AlertCircle } from "lucide-react";
import {
  createOrganization,
  fetchPlanOptions,
  type PlanOption,
  type NewOrganizationInput,
} from "../../_lib/ownerQueries";

type Status = NewOrganizationInput["status"];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "active",    label: "نشطة" },
  { value: "trial",     label: "تجريبية" },
  { value: "suspended", label: "معلقة" },
  { value: "cancelled", label: "ملغاة" },
];

const EMPTY_FORM = {
  name: "",
  slug: "",
  ownerEmail: "",
  planId: "",
  status: "active" as Status,
  notes: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOrganizationModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansError, setPlansError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plan options + reset the form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError(null);
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

    if (!form.name.trim()) {
      setError("اسم المنشأة مطلوب");
      return;
    }

    setSaving(true);
    const res = await createOrganization({
      name: form.name,
      slug: form.slug,
      ownerEmail: form.ownerEmail,
      planId: form.planId || null,
      status: form.status,
      notes: form.notes,
    });
    setSaving(false);

    if (!res.ok) {
      setError(res.error ?? "تعذّر إنشاء المنشأة");
      return;
    }

    onCreated();
    onClose();
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
            إنشاء منشأة جديدة
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

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            <AlertCircle size={15} className="flex-shrink-0" />
            {error}
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
              <label className="block text-xs text-[#8ba3c7] mb-1.5">بريد المالك</label>
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
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">ملاحظات</label>
            <textarea
              className="input-dark text-sm min-h-[80px] resize-y"
              placeholder="ملاحظات داخلية (اختياري)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الإنشاء..." : "إنشاء المنشأة"}
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
