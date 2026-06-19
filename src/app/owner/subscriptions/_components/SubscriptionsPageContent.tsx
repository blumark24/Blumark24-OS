"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  Plus,
  Layers,
  PauseCircle,
  XCircle,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import {
  fetchSubscriptionsPage, type DisplaySubscriptionFull,
  fetchPlanOptions, type PlanOption,
  fetchOrganizationsPage, type DisplayOrgFull,
  changeSubscriptionPlan,
  updateSubscriptionStatus,
  createSubscriptionForOrg,
} from "../../_lib/ownerQueries";

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const SUB_STATUS_BADGE: Record<string, string> = {
  "نشطة":    "bg-[#10b981]/15 text-[#34d399]",
  "تجريبية": "bg-[#22d3ee]/15 text-[#22d3ee]",
  "متأخرة":  "bg-[#ef4444]/15 text-[#f87171]",
  "معلقة":   "bg-[#f59e0b]/15 text-[#fbbf24]",
  "ملغاة":   "bg-[#6b7280]/15 text-[#9ca3af]",
};

const BILLING_BADGE: Record<string, string> = {
  "شهري":  "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  "سنوي":  "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  "داخلي": "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
};

type FilterKey = "all" | "active" | "suspended" | "cancelled" | "internal";

type ModalState =
  | null
  | { type: "create" }
  | { type: "change-plan"; sub: DisplaySubscriptionFull }
  | { type: "suspend"; sub: DisplaySubscriptionFull }
  | { type: "cancel"; sub: DisplaySubscriptionFull };

// ─── Loading skeletons ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] py-4 px-1">
          <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
            </div>
            <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-3 rounded bg-white/[0.06]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Modal overlay wrapper ─────────────────────────────────────────────────────

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Modal: Change Plan ────────────────────────────────────────────────────────

function ChangePlanModal({
  sub,
  plans,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  plans: PlanOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(sub.planId);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selectedPlanId) { setErr("يرجى اختيار الباقة"); return; }
    if (selectedPlanId === sub.planId) { onClose(); return; }
    setSaving(true);
    setErr(null);
    const res = await changeSubscriptionPlan({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      planId: selectedPlanId,
    });
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "تعذّر تغيير الباقة"); return; }
    onDone();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-white">تغيير الباقة</h3>
            <p className="text-[12px] text-[#8ba3c7] mt-1">{sub.orgName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-[12px] text-[#8ba3c7]">
            الباقة الحالية:{" "}
            <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded-full mr-1", ACCENT[sub.accent].chip)}>
              {sub.planName}
            </span>
          </p>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#8ba3c7] block">اختر الباقة الجديدة</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-3 py-2.5 text-[12px] text-[#ff9a68]">
            <AlertTriangle size={13} className="flex-shrink-0" />{err}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
            إلغاء
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving || !selectedPlanId}
            className="flex items-center gap-2 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/30 px-4 py-2 text-[13px] text-[#c084fc] hover:bg-[#a855f7]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Layers size={13} />}
            تأكيد التغيير
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Modal: Suspend Subscription ──────────────────────────────────────────────

function SuspendModal({
  sub,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  onClose: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    setSaving(true);
    setErr(null);
    const res = await updateSubscriptionStatus({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      status: "suspended",
    });
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "تعذّر تعليق الاشتراك"); return; }
    onDone();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-white">تعليق الاشتراك</h3>
            <p className="text-[12px] text-[#8ba3c7] mt-1">{sub.orgName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/[0.07] px-4 py-3 space-y-1">
          <p className="text-[13px] text-[#fbbf24] font-medium">سيتم تعليق اشتراك هذه المنشأة مؤقتاً.</p>
          <p className="text-[12px] text-[#c8a96e]">يمكن استئناف الاشتراك لاحقاً من صفحة المنشآت.</p>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-3 py-2.5 text-[12px] text-[#ff9a68]">
            <AlertTriangle size={13} className="flex-shrink-0" />{err}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
            إلغاء
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 px-4 py-2 text-[13px] text-[#fbbf24] hover:bg-[#f59e0b]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <PauseCircle size={13} />}
            تعليق الاشتراك
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Modal: Cancel Subscription ────────────────────────────────────────────────

function CancelModal({
  sub,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  onClose: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    setSaving(true);
    setErr(null);
    const res = await updateSubscriptionStatus({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      status: "cancelled",
    });
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "تعذّر إلغاء الاشتراك"); return; }
    onDone();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-white">إلغاء الاشتراك</h3>
            <p className="text-[12px] text-[#8ba3c7] mt-1">{sub.orgName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.07] px-4 py-3 space-y-1">
          <p className="text-[13px] text-[#f87171] font-medium">سيتم إلغاء اشتراك هذه المنشأة.</p>
          <p className="text-[12px] text-[#c89a9a]">البيانات تبقى محفوظة — لا يتأثر إمكانية الوصول للسجلات.</p>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-3 py-2.5 text-[12px] text-[#ff9a68]">
            <AlertTriangle size={13} className="flex-shrink-0" />{err}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
            إلغاء
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 px-4 py-2 text-[13px] text-[#f87171] hover:bg-[#ef4444]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
            تأكيد الإلغاء
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Modal: Create Subscription ────────────────────────────────────────────────

function CreateSubscriptionModal({
  plans,
  onClose,
  onDone,
}: {
  plans: PlanOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [orgs, setOrgs] = useState<DisplayOrgFull[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [billing, setBilling] = useState<"monthly" | "annual" | "internal">("monthly");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationsPage()
      .then((data) => {
        const customerOrgs = data.filter((o) => !o.isInternal);
        setOrgs(customerOrgs);
        if (customerOrgs.length > 0) setOrgId(customerOrgs[0].id);
      })
      .catch(() => setErr("تعذّر تحميل قائمة المنشآت"))
      .finally(() => setLoadingOrgs(false));
  }, []);

  async function handleSubmit() {
    if (!orgId || !planId) { setErr("يرجى اختيار المنشأة والباقة"); return; }
    setSaving(true);
    setErr(null);
    const res = await createSubscriptionForOrg({ organizationId: orgId, planId, billingCycle: billing });
    setSaving(false);
    if (!res.ok) { setErr(res.error ?? "تعذّر إنشاء الاشتراك"); return; }
    onDone();
  }

  const BILLING_OPTS: { key: "monthly" | "annual" | "internal"; label: string }[] = [
    { key: "monthly", label: "شهري" },
    { key: "annual", label: "سنوي" },
    { key: "internal", label: "داخلي" },
  ];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-[16px] font-bold text-white">إنشاء اشتراك جديد</h3>
            <p className="text-[12px] text-[#8ba3c7] mt-1">للمنشآت بدون اشتراك نشط</p>
          </div>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#8ba3c7] block">المنشأة</label>
            {loadingOrgs ? (
              <div className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
            ) : orgs.length === 0 ? (
              <p className="text-[12px] text-[#8ba3c7]">لا توجد منشآت عميل متاحة</p>
            ) : (
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] text-[#8ba3c7] block">الباقة</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] text-[#8ba3c7] block">دورة الفوترة</label>
            <div className="flex gap-2">
              {BILLING_OPTS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBilling(key)}
                  className={cn(
                    "flex-1 rounded-xl border py-2 text-[12px] transition-colors",
                    billing === key
                      ? "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]"
                      : "border-white/[0.08] text-white/50 hover:text-white hover:border-white/[0.15]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-3 py-2.5 text-[12px] text-[#ff9a68]">
            <AlertTriangle size={13} className="flex-shrink-0" />{err}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
            إلغاء
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={saving || loadingOrgs || !orgId || !planId}
            className="flex items-center gap-2 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 px-4 py-2 text-[13px] text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            إنشاء الاشتراك
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─── Org name link ─────────────────────────────────────────────────────────────

function OrgNameLink({ sub }: { sub: DisplaySubscriptionFull }) {
  const label = (
    <>
      <span className="text-[13px] font-medium text-white">{sub.orgName}</span>
      {sub.isInternal && (
        <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-1.5 py-0.5 text-[10px] text-[#22d3ee]">
          داخلي
        </span>
      )}
    </>
  );

  if (sub.organizationId && sub.orgName !== "—") {
    return (
      <Link
        href={`/owner/organizations/${sub.organizationId}`}
        className="inline-flex items-center gap-1.5 flex-wrap hover:text-[#22d3ee] transition-colors"
      >
        {label}
        <Eye size={11} className="text-[#22d3ee]/60" />
      </Link>
    );
  }

  return <div className="flex items-center gap-1.5 flex-wrap">{label}</div>;
}

// ─── Row actions ───────────────────────────────────────────────────────────────

function RowActions({
  sub,
  onChangePlan,
  onSuspend,
  onCancel,
}: {
  sub: DisplaySubscriptionFull;
  onChangePlan: () => void;
  onSuspend: () => void;
  onCancel: () => void;
}) {
  const isProtected = sub.isInternal;
  const isCancelled = sub.statusRaw === "cancelled";
  const isSuspended = sub.statusRaw === "suspended";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Change plan */}
      <button
        onClick={isProtected || isCancelled ? undefined : onChangePlan}
        disabled={isProtected || isCancelled}
        title={isProtected ? "المنشآت الداخلية محمية" : isCancelled ? "الاشتراك ملغى" : "تغيير الباقة"}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
          isProtected || isCancelled
            ? "border-[#a855f7]/20 bg-[#a855f7]/[0.06] text-[#c084fc]/40 cursor-not-allowed"
            : "border-[#a855f7]/30 bg-[#a855f7]/[0.08] text-[#c084fc] hover:bg-[#a855f7]/15 cursor-pointer",
        )}
      >
        <Layers size={11} /> تغيير الباقة
      </button>

      {/* Suspend */}
      <button
        onClick={isProtected || isSuspended || isCancelled ? undefined : onSuspend}
        disabled={isProtected || isSuspended || isCancelled}
        title={
          isProtected ? "المنشآت الداخلية محمية"
          : isCancelled ? "الاشتراك ملغى"
          : isSuspended ? "الاشتراك معلق بالفعل"
          : "تعليق الاشتراك"
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
          isProtected || isSuspended || isCancelled
            ? "border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] text-[#fbbf24]/40 cursor-not-allowed"
            : "border-[#f59e0b]/30 bg-[#f59e0b]/[0.08] text-[#fbbf24] hover:bg-[#f59e0b]/15 cursor-pointer",
        )}
      >
        <PauseCircle size={11} /> تعليق
      </button>

      {/* Cancel */}
      <button
        onClick={isProtected || isCancelled ? undefined : onCancel}
        disabled={isProtected || isCancelled}
        title={isProtected ? "المنشآت الداخلية محمية" : isCancelled ? "الاشتراك ملغى بالفعل" : "إلغاء الاشتراك"}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
          isProtected || isCancelled
            ? "border-[#ef4444]/20 bg-[#ef4444]/[0.06] text-[#f87171]/40 cursor-not-allowed"
            : "border-[#ef4444]/30 bg-[#ef4444]/[0.08] text-[#f87171] hover:bg-[#ef4444]/15 cursor-pointer",
        )}
      >
        <XCircle size={11} /> إلغاء
      </button>
    </div>
  );
}

// ─── Mobile card ───────────────────────────────────────────────────────────────

function SubCard({
  sub,
  onChangePlan,
  onSuspend,
  onCancel,
}: {
  sub: DisplaySubscriptionFull;
  onChangePlan: () => void;
  onSuspend: () => void;
  onCancel: () => void;
}) {
  const a = ACCENT[sub.accent];
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <OrgNameLink sub={sub} />
            {sub.orgSlug && (
              <div className="text-[11px] text-[#8ba3c7] font-mono mt-0.5 truncate">{sub.orgSlug}</div>
            )}
          </div>
        </div>
        <span className={cn("badge text-[10px] flex-shrink-0", SUB_STATUS_BADGE[sub.statusAr] ?? "text-[#8ba3c7]")}>
          {sub.statusAr}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الباقة:</span>
          <span className={cn("badge text-[10px]", a.chip)}>{sub.planName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الفوترة:</span>
          <span className={cn("badge text-[10px]", BILLING_BADGE[sub.billingCycleAr] ?? "text-[#8ba3c7]")}>
            {sub.billingCycleAr}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">البدء:</span>
          <span className="text-white tabular-nums">{sub.startedAt}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الانتهاء:</span>
          <span className="text-white tabular-nums">{sub.endsAt ?? "—"}</span>
        </div>
      </div>

      <RowActions sub={sub} onChangePlan={onChangePlan} onSuspend={onSuspend} onCancel={onCancel} />
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "الكل" },
  { key: "active",    label: "نشطة" },
  { key: "suspended", label: "معلقة" },
  { key: "cancelled", label: "ملغاة" },
  { key: "internal",  label: "داخلية" },
];

export default function SubscriptionsPageContent() {
  const [subs, setSubs] = useState<DisplaySubscriptionFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptionsPage();
      setSubs(data);
      setError(null);
    } catch {
      setError("فشل تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    fetchPlanOptions()
      .then(setPlanOptions)
      .catch(() => {/* silent */});
  }, []);

  function handleDone(msg: string) {
    setModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
    void load();
  }

  const filteredSubs = (subs ?? []).filter((s) => {
    switch (filter) {
      case "active":    return s.isActive || s.statusRaw === "trialing" || s.statusRaw === "past_due";
      case "suspended": return s.statusRaw === "suspended";
      case "cancelled": return s.statusRaw === "cancelled";
      case "internal":  return s.isInternal;
      default:          return true;
    }
  });

  const total = subs?.length ?? 0;
  const activeCount = subs?.filter((s) => s.isActive).length ?? 0;
  const internalCount = subs?.filter((s) => s.isInternal).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <CreditCard size={26} className="text-[#22d3ee]" />
            الاشتراكات
          </h1>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            إدارة اشتراكات المنشآت — تغيير الباقة، التعليق، الإلغاء، وإنشاء اشتراكات جديدة.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.07] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
          <button
            onClick={() => setModal({ type: "create" })}
            className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/30 bg-[#22d3ee]/[0.10] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee] hover:bg-[#22d3ee]/15 transition-colors"
          >
            <Plus size={15} />
            إنشاء اشتراك
          </button>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-[#10b981]/30 bg-[#10b981]/[0.08] px-4 py-3 text-[13px] text-[#34d399]">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الاشتراكات", value: loading ? "…" : String(total),        color: "text-[#22d3ee]", border: "border-[#22d3ee]/20" },
          { label: "نشطة",              value: loading ? "…" : String(activeCount),   color: "text-[#10b981]", border: "border-[#10b981]/20" },
          { label: "داخلية",            value: loading ? "…" : String(internalCount), color: "text-[#a855f7]", border: "border-[#a855f7]/20" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={cn("glass-card p-4 border text-center", border)}>
            <div className={cn("font-heading text-2xl font-bold tabular-nums", color, loading && "animate-pulse opacity-40")}>
              {value}
            </div>
            <div className="mt-1 text-[11px] text-[#8ba3c7]">{label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="glass-card p-5 sm:p-6">
        {/* Table header + filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <CreditCard size={16} className="text-[#22d3ee]" />
            قائمة الاشتراكات
            {!loading && subs && (
              <span className="text-[11px] font-normal text-[#8ba3c7]">({total})</span>
            )}
          </h2>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] transition-colors border",
                  filter === key
                    ? "bg-[#22d3ee]/12 border-[#22d3ee]/30 text-[#22d3ee]"
                    : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[13px] text-[#ff9a68]">
            <RefreshCw size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!error && (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[960px]">
                <thead>
                  <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
                    <th className="font-medium pb-3 pr-1 text-right">المنشأة</th>
                    <th className="font-medium pb-3 text-right">المعرّف</th>
                    <th className="font-medium pb-3 text-right">الباقة</th>
                    <th className="font-medium pb-3 text-right">حالة الاشتراك</th>
                    <th className="font-medium pb-3 text-right">دورة الفوترة</th>
                    <th className="font-medium pb-3 text-right">تاريخ البدء</th>
                    <th className="font-medium pb-3 text-right">تاريخ الانتهاء</th>
                    <th className="font-medium pb-3 text-right">تاريخ الإنشاء</th>
                    <th className="font-medium pb-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="pt-2"><TableSkeleton /></td>
                    </tr>
                  ) : filteredSubs.length > 0 ? (
                    filteredSubs.map((sub) => {
                      const a = ACCENT[sub.accent];
                      return (
                        <tr key={sub.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pr-1">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
                                <Building2 size={16} />
                              </span>
                              <div className="min-w-0"><OrgNameLink sub={sub} /></div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="text-[12px] text-[#8ba3c7] font-mono">{sub.orgSlug ?? "—"}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", a.chip)}>{sub.planName}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", SUB_STATUS_BADGE[sub.statusAr] ?? "text-[#8ba3c7]")}>
                              {sub.statusAr}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", BILLING_BADGE[sub.billingCycleAr] ?? "text-[#8ba3c7]")}>
                              {sub.billingCycleAr}
                            </span>
                          </td>
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.startedAt}</td>
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.endsAt ?? "—"}</td>
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.createdAt}</td>
                          <td className="py-3.5">
                            <RowActions
                              sub={sub}
                              onChangePlan={() => setModal({ type: "change-plan", sub })}
                              onSuspend={() => setModal({ type: "suspend", sub })}
                              onCancel={() => setModal({ type: "cancel", sub })}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12">
                        <div className="flex flex-col items-center justify-center text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-8">
                          <CreditCard size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
                          <p className="text-[14px] font-medium text-white">
                            {filter === "all" ? "لا توجد اشتراكات مسجّلة بعد" : `لا توجد اشتراكات بحالة "${FILTER_TABS.find(t => t.key === filter)?.label}"`}
                          </p>
                          {filter === "all" && (
                            <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-sm leading-relaxed">
                              أنشئ اشتراكاً باستخدام زر &quot;إنشاء اشتراك&quot; أعلاه.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {loading ? (
                <CardSkeleton />
              ) : filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => (
                  <SubCard
                    key={sub.id}
                    sub={sub}
                    onChangePlan={() => setModal({ type: "change-plan", sub })}
                    onSuspend={() => setModal({ type: "suspend", sub })}
                    onCancel={() => setModal({ type: "cancel", sub })}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
                  <CreditCard size={28} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
                  <p className="text-[14px] font-medium text-white">لا توجد اشتراكات</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "change-plan" && (
        <ChangePlanModal
          sub={modal.sub}
          plans={planOptions}
          onClose={() => setModal(null)}
          onDone={() => handleDone("تم تغيير الباقة بنجاح")}
        />
      )}
      {modal?.type === "suspend" && (
        <SuspendModal
          sub={modal.sub}
          onClose={() => setModal(null)}
          onDone={() => handleDone("تم تعليق الاشتراك")}
        />
      )}
      {modal?.type === "cancel" && (
        <CancelModal
          sub={modal.sub}
          onClose={() => setModal(null)}
          onDone={() => handleDone("تم إلغاء الاشتراك")}
        />
      )}
      {modal?.type === "create" && (
        <CreateSubscriptionModal
          plans={planOptions}
          onClose={() => setModal(null)}
          onDone={() => handleDone("تم إنشاء الاشتراك بنجاح")}
        />
      )}
    </div>
  );
}
