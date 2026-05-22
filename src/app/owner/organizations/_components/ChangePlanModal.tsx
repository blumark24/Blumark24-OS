"use client";

import { useEffect, useState } from "react";
import { X, Layers, AlertCircle, Building2 } from "lucide-react";
import {
  changeOrganizationPlan,
  fetchPlanOptions,
  type PlanOption,
  type DisplayOrgFull,
} from "../../_lib/ownerQueries";

interface Props {
  org: DisplayOrgFull | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function ChangePlanModal({ org, onClose, onChanged }: Props) {
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansError, setPlansError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!org) return;
    setPlanId(org.planId ?? "");
    setError(null);
    setPlansError(false);
    setSaving(false);
    let active = true;
    fetchPlanOptions()
      .then((data) => active && setPlans(data))
      .catch(() => active && setPlansError(true));
    return () => {
      active = false;
    };
  }, [org]);

  if (!org) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);
    const res = await changeOrganizationPlan({ id: org.id, planId: planId || null });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? "تعذّر تغيير الباقة");
      return;
    }
    onChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
      <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-[#a855f7]/25">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a855f7]/12 border border-[#a855f7]/25">
              <Layers size={16} className="text-[#c084fc]" />
            </span>
            تغيير الباقة
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

        {/* Organization summary */}
        <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#8ba3c7] flex items-center gap-1.5">
              <Building2 size={14} /> المنشأة
            </span>
            <span className="font-semibold text-white">{org.name}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#8ba3c7]">الباقة الحالية</span>
            <span className="font-semibold text-white">{org.planName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-[#8ba3c7] mb-1.5">الباقة الجديدة</label>
            <select
              className="input-dark text-sm"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? "جارٍ الحفظ..." : "تغيير الباقة"}
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
