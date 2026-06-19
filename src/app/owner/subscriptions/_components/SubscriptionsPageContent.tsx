"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Building2,
  Plus,
  Layers,
  PauseCircle,
  XCircle,
  Eye,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import {
  fetchSubscriptionsPage,
  fetchPlanOptions,
  fetchOrganizationsPage,
  changeSubscriptionPlan,
  updateSubscriptionStatus,
  createSubscriptionForOrg,
  type DisplaySubscriptionFull,
  type PlanOption,
  type DisplayOrgFull,
} from "../../_lib/ownerQueries";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "active" | "suspended" | "cancelled" | "internal";

type ModalState =
  | null
  | { type: "create" }
  | { type: "change-plan"; sub: DisplaySubscriptionFull }
  | { type: "suspend"; sub: DisplaySubscriptionFull }
  | { type: "cancel"; sub: DisplaySubscriptionFull };

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

// ─── Loading skeleton ──────────────────────────────────────────────────────────

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
          <div className="h-7 w-24 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

// ─── Modal overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Change plan modal ─────────────────────────────────────────────────────────

function ChangePlanModal({
  sub,
  planOptions,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  planOptions: PlanOption[];
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(sub.planId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit() {
    if (selectedPlanId === sub.planId) { onClose(); return; }
    setBusy(true);
    setErr(null);
    const result = await changeSubscriptionPlan({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      planId: selectedPlanId,
    });
    setBusy(false);
    if (!result.ok) { setErr(result.error ?? "تعذّر تغيير الباقة"); return; }
    onDone(`تم تغيير باقة ${sub.orgName} بنجاح`);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0a1628] p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]">
      <h2 className="text-[15px] font-semibold text-white mb-1">تغيير الباقة</h2>
      <p className="text-[12px] text-white/50 mb-5">{sub.orgName} — الباقة الحالية: {sub.planName}</p>

      <label className="block text-[12px] text-white/60 mb-1.5">الباقة الجديدة</label>
      <select
        value={selectedPlanId}
        onChange={(e) => setSelectedPlanId(e.target.value)}
        className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50 mb-4"
      >
        {planOptions.map((p) => (
          <option key={p.id} value={p.id} className="bg-[#0a1628]">{p.name}</option>
        ))}
      </select>

      {err && <p className="text-[12px] text-[#f87171] mb-3">{err}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="flex-1 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium py-2.5 hover:bg-[#22d3ee]/20 transition-colors disabled:opacity-50"
        >
          {busy ? "جارٍ الحفظ..." : "حفظ التغيير"}
        </button>
        <button
          onClick={onClose}
          className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-[13px] hover:bg-white/[0.07] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ─── Suspend modal ─────────────────────────────────────────────────────────────

function SuspendModal({
  sub,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit() {
    setBusy(true);
    setErr(null);
    const result = await updateSubscriptionStatus({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      status: "suspended",
    });
    setBusy(false);
    if (!result.ok) { setErr(result.error ?? "تعذّر تعليق الاشتراك"); return; }
    onDone(`تم تعليق اشتراك ${sub.orgName}`);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0a1628] p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-[#f59e0b]/12 flex items-center justify-center flex-shrink-0">
          <PauseCircle size={20} className="text-[#fbbf24]" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white">تعليق الاشتراك</h2>
          <p className="text-[12px] text-white/50">{sub.orgName}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] p-4 mb-5">
        <div className="flex gap-2">
          <AlertTriangle size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#fbbf24]/90">
            سيتم تعليق الاشتراك فوراً. لن تتمكن المنشأة من الوصول إلى الخدمات حتى يتم إعادة التفعيل.
          </p>
        </div>
      </div>

      {err && <p className="text-[12px] text-[#f87171] mb-3">{err}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="flex-1 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#fbbf24] text-[13px] font-medium py-2.5 hover:bg-[#f59e0b]/20 transition-colors disabled:opacity-50"
        >
          {busy ? "جارٍ التعليق..." : "تأكيد التعليق"}
        </button>
        <button
          onClick={onClose}
          className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-[13px] hover:bg-white/[0.07] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ─── Cancel modal ──────────────────────────────────────────────────────────────

function CancelModal({
  sub,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit() {
    setBusy(true);
    setErr(null);
    const result = await updateSubscriptionStatus({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      status: "cancelled",
    });
    setBusy(false);
    if (!result.ok) { setErr(result.error ?? "تعذّر إلغاء الاشتراك"); return; }
    onDone(`تم إلغاء اشتراك ${sub.orgName}`);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0a1628] p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-[#ef4444]/12 flex items-center justify-center flex-shrink-0">
          <XCircle size={20} className="text-[#f87171]" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white">إلغاء الاشتراك</h2>
          <p className="text-[12px] text-white/50">{sub.orgName}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] p-4 mb-5">
        <div className="flex gap-2">
          <AlertTriangle size={14} className="text-[#f87171] flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#f87171]/90">
            سيتم إلغاء الاشتراك نهائياً. لا يتم حذف البيانات — يمكنك إنشاء اشتراك جديد لاحقاً.
          </p>
        </div>
      </div>

      {err && <p className="text-[12px] text-[#f87171] mb-3">{err}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="flex-1 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#f87171] text-[13px] font-medium py-2.5 hover:bg-[#ef4444]/20 transition-colors disabled:opacity-50"
        >
          {busy ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
        </button>
        <button
          onClick={onClose}
          className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-[13px] hover:bg-white/[0.07] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ─── Create subscription modal ─────────────────────────────────────────────────

function CreateSubscriptionModal({
  planOptions,
  onClose,
  onDone,
}: {
  planOptions: PlanOption[];
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [orgs, setOrgs] = useState<DisplayOrgFull[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(planOptions[0]?.id ?? "");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual" | "internal">("monthly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationsPage()
      .then((data) => {
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(data[0].id);
      })
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  async function handleSubmit() {
    if (!selectedOrgId || !selectedPlanId) { setErr("يرجى اختيار المنشأة والباقة"); return; }
    setBusy(true);
    setErr(null);
    const result = await createSubscriptionForOrg({
      organizationId: selectedOrgId,
      planId: selectedPlanId,
      billingCycle,
    });
    setBusy(false);
    if (!result.ok) { setErr(result.error ?? "تعذّر إنشاء الاشتراك"); return; }
    const org = orgs.find((o) => o.id === selectedOrgId);
    onDone(`تم إنشاء اشتراك جديد لـ${org?.name ?? "المنشأة"}`);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#0a1628] p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.9)]">
      <h2 className="text-[15px] font-semibold text-white mb-1">إنشاء اشتراك</h2>
      <p className="text-[12px] text-white/50 mb-5">إنشاء اشتراك جديد لمنشأة موجودة</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-[12px] text-white/60 mb-1.5">المنشأة</label>
          {orgsLoading ? (
            <div className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          ) : (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#0a1628]">{o.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[12px] text-white/60 mb-1.5">الباقة</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full rounded-xl bg-[rgba(13,31,60,0.8)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50"
          >
            {planOptions.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0a1628]">{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] text-white/60 mb-1.5">دورة الفاتورة</label>
          <div className="flex gap-2">
            {(["monthly", "annual", "internal"] as const).map((cycle) => {
              const label = cycle === "monthly" ? "شهري" : cycle === "annual" ? "سنوي" : "داخلي";
              return (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "flex-1 rounded-xl border text-[12px] font-medium py-2 transition-colors",
                    billingCycle === cycle
                      ? "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:bg-white/[0.06]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {err && <p className="text-[12px] text-[#f87171] mb-3">{err}</p>}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={busy || orgsLoading}
          className="flex-1 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium py-2.5 hover:bg-[#22d3ee]/20 transition-colors disabled:opacity-50"
        >
          {busy ? "جارٍ الإنشاء..." : "إنشاء الاشتراك"}
        </button>
        <button
          onClick={onClose}
          className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-[13px] hover:bg-white/[0.07] transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
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
  const isInternal = sub.isInternal;
  const isCancelled = sub.statusRaw === "cancelled";
  const isSuspended = sub.statusRaw === "suspended";

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onChangePlan}
        disabled={isInternal}
        title="تغيير الباقة"
        className="p-1.5 rounded-lg text-white/40 hover:text-[#22d3ee] hover:bg-[#22d3ee]/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Layers size={14} />
      </button>
      <button
        onClick={onSuspend}
        disabled={isInternal || isCancelled || isSuspended}
        title="تعليق الاشتراك"
        className="p-1.5 rounded-lg text-white/40 hover:text-[#fbbf24] hover:bg-[#f59e0b]/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <PauseCircle size={14} />
      </button>
      <button
        onClick={onCancel}
        disabled={isInternal || isCancelled}
        title="إلغاء الاشتراك"
        className="p-1.5 rounded-lg text-white/40 hover:text-[#f87171] hover:bg-[#ef4444]/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

// ─── Subscription card / row ───────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 sm:gap-4 border-b border-white/[0.04] py-3.5 px-1 hover:bg-white/[0.01] transition-colors group">
      <div className={cn("h-9 w-9 flex-shrink-0 rounded-lg flex items-center justify-center", a.iconBg)}>
        <Building2 size={16} className={a.text} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-white leading-tight truncate">{sub.orgName}</p>
        <p className="text-[11px] text-[#8ba3c7] mt-0.5 truncate">
          {sub.planName} · {sub.startedAt}
        </p>
      </div>

      <div className="hidden md:flex items-center gap-2">
        <span className={cn("inline-flex text-[11px] font-medium rounded-full px-2 py-0.5", SUB_STATUS_BADGE[sub.statusAr] ?? "bg-white/[0.08] text-white/50")}>
          {sub.statusAr}
        </span>
        <span className={cn("inline-flex text-[11px] rounded-full px-2 py-0.5", BILLING_BADGE[sub.billingCycleAr] ?? "bg-white/[0.08] text-white/50")}>
          {sub.billingCycleAr}
        </span>
      </div>

      <RowActions
        sub={sub}
        onChangePlan={onChangePlan}
        onSuspend={onSuspend}
        onCancel={onCancel}
      />
    </div>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-[#22d3ee]/10 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-[#22d3ee]" />
      </div>
      <div>
        <p className="text-[12px] text-white/50">{label}</p>
        <p className="text-[18px] font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطة" },
  { key: "suspended", label: "معلقة" },
  { key: "cancelled", label: "ملغاة" },
  { key: "internal", label: "داخلية" },
];

function applyFilter(subs: DisplaySubscriptionFull[], filter: FilterKey): DisplaySubscriptionFull[] {
  if (filter === "all") return subs;
  if (filter === "internal") return subs.filter((s) => s.isInternal);
  if (filter === "active") return subs.filter((s) => s.isActive && !s.isInternal);
  if (filter === "suspended") return subs.filter((s) => s.statusRaw === "suspended");
  if (filter === "cancelled") return subs.filter((s) => s.statusRaw === "cancelled");
  return subs;
}

// ─── Main page component ───────────────────────────────────────────────────────

export default function SubscriptionsPageContent() {
  const [subs, setSubs] = useState<DisplaySubscriptionFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubscriptionsPage();
      setSubs(data);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    fetchPlanOptions()
      .then(setPlanOptions)
      .catch(() => {/* silent */});
  }, [load]);

  function handleDone(msg: string) {
    setModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
    void load();
  }

  const filtered = applyFilter(subs, filter);
  const activeCount = subs.filter((s) => s.isActive && !s.isInternal).length;
  const suspendedCount = subs.filter((s) => s.statusRaw === "suspended").length;
  const internalCount = subs.filter((s) => s.isInternal).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-white">الاشتراكات</h1>
          <p className="text-[13px] text-white/50 mt-0.5">إدارة اشتراكات المنشآت والباقات المفعّلة</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium px-4 py-2.5 hover:bg-[#22d3ee]/20 transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">إنشاء اشتراك</span>
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#10b981]/25 bg-[#10b981]/[0.08] px-4 py-3">
          <CheckCircle2 size={15} className="text-[#34d399] flex-shrink-0" />
          <p className="text-[13px] text-[#34d399]">{successMsg}</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="إجمالي الاشتراكات" value={subs.length} icon={CreditCard} />
        <KpiCard label="نشطة" value={activeCount} icon={Eye} />
        <KpiCard label="معلقة" value={suspendedCount} icon={PauseCircle} />
        <KpiCard label="داخلية" value={internalCount} icon={Building2} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              filter === tab.key
                ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/25"
                : "text-white/50 hover:text-white/70",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-[#22d3ee]" />
          <h2 className="text-[14px] font-semibold text-white">
            {filter === "all" ? "جميع الاشتراكات" : FILTER_TABS.find((t) => t.key === filter)?.label}
          </h2>
          <span className="text-[11px] text-white/40 border border-white/[0.08] rounded-full px-2 py-0.5">
            {filtered.length}
          </span>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard size={32} className="text-white/15 mb-3" strokeWidth={1.2} />
            <p className="text-[13px] text-white/40">لا توجد اشتراكات</p>
          </div>
        ) : (
          <div>
            {filtered.map((sub) => (
              <SubCard
                key={sub.id}
                sub={sub}
                onChangePlan={() => setModal({ type: "change-plan", sub })}
                onSuspend={() => setModal({ type: "suspend", sub })}
                onCancel={() => setModal({ type: "cancel", sub })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <CreateSubscriptionModal
            planOptions={planOptions}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        </ModalOverlay>
      )}
      {modal?.type === "change-plan" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <ChangePlanModal
            sub={modal.sub}
            planOptions={planOptions}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        </ModalOverlay>
      )}
      {modal?.type === "suspend" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <SuspendModal
            sub={modal.sub}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        </ModalOverlay>
      )}
      {modal?.type === "cancel" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <CancelModal
            sub={modal.sub}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
