"use client";

import { useEffect, useState } from "react";
import { X, Layers, AlertCircle, Building2 } from "lucide-react";
import {
  fetchPlanOptions,
  type PlanOption,
  type DisplayOrgFull,
} from "../../_lib/ownerQueries";
import { ownerSupabase } from "@/lib/supabase/ownerClient";

interface Props {
  org: DisplayOrgFull | null;
  onClose: () => void;
  onChanged: () => void;
}

interface ChangePlanResult {
  ok: boolean;
  error?: string;
  organizationId?: string;
  planId?: string | null;
  planSlug?: string | null;
  updatedAt?: string;
}

const WORKSPACE_CONTEXT_REFRESH_KEY = "blumark_workspace_context_refresh";
const WORKSPACE_CONTEXT_REFRESH_EVENT = "blumark:workspace-context-refresh";
const WORKSPACE_CONTEXT_REFRESH_CHANNEL = "blumark:workspace-plan-events";

function signalWorkspacePlanChanged(payload: {
  organizationId: string;
  planId: string | null;
  planSlug?: string | null;
  updatedAt?: string;
}) {
  if (typeof window === "undefined") return;
  const message = {
    type: "plan_changed",
    organizationId: payload.organizationId,
    planId: payload.planId,
    planSlug: payload.planSlug ?? null,
    updatedAt: payload.updatedAt ?? new Date().toISOString(),
    stamp: Date.now(),
  };

  try {
    window.localStorage.setItem(WORKSPACE_CONTEXT_REFRESH_KEY, JSON.stringify(message));
  } catch {
    /* storage may be unavailable in restricted browsers */
  }

  try {
    window.dispatchEvent(new CustomEvent(WORKSPACE_CONTEXT_REFRESH_EVENT, { detail: message }));
  } catch {
    /* custom events may be unavailable in older embedded browsers */
  }

  try {
    const channel = new BroadcastChannel(WORKSPACE_CONTEXT_REFRESH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    /* BroadcastChannel is best-effort; focus/pageshow refresh remains as fallback */
  }
}

async function changeOrganizationPlan(input: {
  id: string;
  planId: string | null;
}): Promise<ChangePlanResult> {
  const { data: { session } } = await ownerSupabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, error: "انتهت جلسة المالك — سجّل الدخول مجدداً" };
  }

  let resp: Response;
  try {
    resp = await fetch("/api/owner/change-organization-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      body: JSON.stringify({ organizationId: input.id, planId: input.planId }),
    });
  } catch {
    return { ok: false, error: "تعذّر الاتصال بالخادم — حاول مرة أخرى" };
  }

  let payload: {
    success?: boolean;
    error?: string;
    organizationId?: string;
    planId?: string | null;
    planSlug?: string | null;
    updatedAt?: string;
  } = {};
  try {
    payload = await resp.json();
  } catch {
    /* non-JSON */
  }

  if (!resp.ok || payload.success !== true) {
    return { ok: false, error: payload.error ?? "تعذّر تغيير الباقة" };
  }

  return {
    ok: true,
    organizationId: payload.organizationId ?? input.id,
    planId: payload.planId ?? input.planId,
    planSlug: payload.planSlug ?? null,
    updatedAt: payload.updatedAt,
  };
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
    signalWorkspacePlanChanged({
      organizationId: res.organizationId ?? org.id,
      planId: res.planId ?? (planId || null),
      planSlug: res.planSlug ?? null,
      updatedAt: res.updatedAt,
    });
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
