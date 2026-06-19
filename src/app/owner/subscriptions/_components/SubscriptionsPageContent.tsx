"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreditCard,
  Building2,
  Plus,
  Layers,
  PauseCircle,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  MoreVertical,
  Trash2,
  ShieldAlert,
  Info,
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
  hardDeleteSubscription,
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
  | { type: "cancel"; sub: DisplaySubscriptionFull }
  | { type: "hard-delete"; sub: DisplaySubscriptionFull };

// ─── Badge maps ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  "نشطة":    "bg-[#10b981]/12 text-[#34d399] border border-[#10b981]/20",
  "تجريبية": "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/20",
  "متأخرة":  "bg-[#ef4444]/12 text-[#f87171] border border-[#ef4444]/20",
  "معلقة":   "bg-[#f59e0b]/12 text-[#fbbf24] border border-[#f59e0b]/20",
  "ملغاة":   "bg-white/[0.06] text-white/40 border border-white/[0.08]",
};

const BILLING_BADGE: Record<string, string> = {
  "شهري":  "bg-[#22d3ee]/10 text-[#22d3ee]/80",
  "سنوي":  "bg-[#1e6fd9]/10 text-[#5b9bf0]",
  "داخلي": "bg-[#a855f7]/10 text-[#c084fc]",
};

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-white/[0.04]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-2">
          <div className="h-9 w-9 rounded-xl bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-white/[0.06]" />
            <div className="h-3 w-28 rounded bg-white/[0.04]" />
          </div>
          <div className="hidden md:flex gap-2">
            <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
            <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
          </div>
          <div className="h-8 w-8 rounded-lg bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

// ─── Modal overlay ─────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={onClose}
    >
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

// ─── Shared modal shell ────────────────────────────────────────────────────────

function ModalShell({
  icon,
  iconClass,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.10] bg-[#07111f] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.95)] overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", iconClass)}>
          {icon}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-white leading-tight">{title}</h2>
          <p className="text-[12px] text-white/45 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
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
    setBusy(true); setErr(null);
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
    <ModalShell
      icon={<Layers size={18} className="text-[#22d3ee]" />}
      iconClass="bg-[#22d3ee]/12"
      title="تغيير الباقة"
      subtitle={`${sub.orgName} — الحالية: ${sub.planName}`}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] text-white/55 mb-2">اختر الباقة الجديدة</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full rounded-xl bg-[rgba(255,255,255,0.04)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50 transition-colors"
          >
            {planOptions.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#07111f]">{p.name}</option>
            ))}
          </select>
        </div>

        {err && (
          <div className="flex gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-3 py-2.5">
            <AlertTriangle size={13} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#f87171]">{err}</p>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium py-2.5 hover:bg-[#22d3ee]/22 transition-colors disabled:opacity-50"
          >
            {busy ? "جارٍ الحفظ..." : "تأكيد التغيير"}
          </button>
          <button
            onClick={onClose}
            className="px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-[13px] hover:bg-white/[0.07] transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </ModalShell>
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
    setBusy(true); setErr(null);
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
    <ModalShell
      icon={<PauseCircle size={18} className="text-[#fbbf24]" />}
      iconClass="bg-[#f59e0b]/12"
      title="تعليق الاشتراك"
      subtitle={sub.orgName}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] px-4 py-3.5">
          <p className="text-[12.5px] text-[#fbbf24]/90 leading-relaxed">
            سيتم تعليق الاشتراك فوراً. لن تتمكن المنشأة من الوصول إلى الخدمات حتى تتم إعادة التفعيل يدوياً.
          </p>
        </div>

        {err && (
          <div className="flex gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-3 py-2.5">
            <AlertTriangle size={13} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#f87171]">{err}</p>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#fbbf24] text-[13px] font-medium py-2.5 hover:bg-[#f59e0b]/22 transition-colors disabled:opacity-50"
          >
            {busy ? "جارٍ التعليق..." : "تأكيد التعليق"}
          </button>
          <button
            onClick={onClose}
            className="px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-[13px] hover:bg-white/[0.07] transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </ModalShell>
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
    setBusy(true); setErr(null);
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
    <ModalShell
      icon={<XCircle size={18} className="text-[#f87171]" />}
      iconClass="bg-[#ef4444]/12"
      title="إلغاء الاشتراك"
      subtitle={sub.orgName}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-4 py-3.5">
          <p className="text-[12.5px] text-[#f87171]/90 leading-relaxed">
            سيتم إلغاء الاشتراك وإيقاف الوصول. البيانات تبقى محفوظة — يمكن إنشاء اشتراك جديد لاحقاً.
          </p>
        </div>

        {err && (
          <div className="flex gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-3 py-2.5">
            <AlertTriangle size={13} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#f87171]">{err}</p>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 rounded-xl bg-[#ef4444]/12 border border-[#ef4444]/25 text-[#f87171] text-[13px] font-medium py-2.5 hover:bg-[#ef4444]/18 transition-colors disabled:opacity-50"
          >
            {busy ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
          </button>
          <button
            onClick={onClose}
            className="px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-[13px] hover:bg-white/[0.07] transition-colors"
          >
            رجوع
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Hard delete modal ─────────────────────────────────────────────────────────

function HardDeleteModal({
  sub,
  onClose,
  onDone,
}: {
  sub: DisplaySubscriptionFull;
  onClose: () => void;
  onDone: (msg: string) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canDelete = confirmText === "DELETE";

  async function handleSubmit() {
    if (!canDelete) return;
    setBusy(true); setErr(null);
    const result = await hardDeleteSubscription({
      subscriptionId: sub.id,
      organizationId: sub.organizationId,
      planId: sub.planId,
      previousStatus: sub.statusRaw,
    });
    setBusy(false);
    if (!result.ok) { setErr(result.error ?? "تعذّر الحذف النهائي"); return; }
    onDone(`تم حذف اشتراك ${sub.orgName} نهائياً`);
  }

  return (
    <ModalShell
      icon={<Trash2 size={18} className="text-[#f87171]" />}
      iconClass="bg-[#ef4444]/12"
      title="حذف نهائي"
      subtitle={sub.orgName}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/[0.08] px-4 py-4">
          <div className="flex gap-2.5">
            <ShieldAlert size={15} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#f87171] mb-1">هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              <p className="text-[12px] text-[#f87171]/75 leading-relaxed">
                سيتم حذف سجل الاشتراك نهائياً من قاعدة البيانات. تبقى بيانات المنشأة والموظفين والسجلات الأخرى محفوظة.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">المنشأة</span>
            <span className="text-white/70">{sub.orgName}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">الباقة</span>
            <span className="text-white/70">{sub.planName}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-white/40">الحالة</span>
            <span className="text-white/70">{sub.statusAr}</span>
          </div>
        </div>

        <div>
          <label className="block text-[12px] text-white/55 mb-1.5">
            اكتب <span className="font-mono font-bold text-[#f87171]">DELETE</span> للتأكيد
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-xl bg-[rgba(239,68,68,0.06)] border border-[#ef4444]/20 focus:border-[#ef4444]/50 text-[13px] text-white placeholder:text-white/25 px-3 py-2.5 outline-none transition-colors font-mono"
            autoComplete="off"
          />
        </div>

        {err && (
          <div className="flex gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-3 py-2.5">
            <AlertTriangle size={13} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#f87171]">{err}</p>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!canDelete || busy}
            className="flex-1 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#f87171] text-[13px] font-medium py-2.5 hover:bg-[#ef4444]/22 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {busy ? "جارٍ الحذف..." : "حذف نهائي"}
          </button>
          <button
            onClick={onClose}
            className="px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-[13px] hover:bg-white/[0.07] transition-colors"
          >
            رجوع
          </button>
        </div>
      </div>
    </ModalShell>
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
      .then((data) => { setOrgs(data); if (data.length > 0) setSelectedOrgId(data[0].id); })
      .catch(() => setOrgs([]))
      .finally(() => setOrgsLoading(false));
  }, []);

  async function handleSubmit() {
    if (!selectedOrgId || !selectedPlanId) { setErr("يرجى اختيار المنشأة والباقة"); return; }
    setBusy(true); setErr(null);
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
    <ModalShell
      icon={<CreditCard size={18} className="text-[#22d3ee]" />}
      iconClass="bg-[#22d3ee]/12"
      title="إنشاء اشتراك جديد"
      subtitle="ربط منشأة موجودة بباقة"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] text-white/55 mb-1.5">المنشأة</label>
          {orgsLoading ? (
            <div className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          ) : (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full rounded-xl bg-[rgba(255,255,255,0.04)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50 transition-colors"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id} className="bg-[#07111f]">{o.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[12px] text-white/55 mb-1.5">الباقة</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="w-full rounded-xl bg-[rgba(255,255,255,0.04)] border border-white/[0.10] text-[13px] text-white px-3 py-2.5 outline-none focus:border-[#22d3ee]/50 transition-colors"
          >
            {planOptions.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#07111f]">{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[12px] text-white/55 mb-1.5">دورة الفاتورة</label>
          <div className="flex gap-2">
            {(["monthly", "annual", "internal"] as const).map((cycle) => {
              const label = cycle === "monthly" ? "شهري" : cycle === "annual" ? "سنوي" : "داخلي";
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "flex-1 rounded-xl border text-[12px] font-medium py-2 transition-colors",
                    billingCycle === cycle
                      ? "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]"
                      : "border-white/[0.08] bg-white/[0.03] text-white/45 hover:bg-white/[0.06]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {err && (
          <div className="flex gap-2 rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-3 py-2.5">
            <AlertTriangle size={13} className="text-[#f87171] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#f87171]">{err}</p>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={handleSubmit}
            disabled={busy || orgsLoading}
            className="flex-1 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium py-2.5 hover:bg-[#22d3ee]/22 transition-colors disabled:opacity-50"
          >
            {busy ? "جارٍ الإنشاء..." : "إنشاء الاشتراك"}
          </button>
          <button
            onClick={onClose}
            className="px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/55 text-[13px] hover:bg-white/[0.07] transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Action menu (dropdown) ────────────────────────────────────────────────────

function ActionMenu({
  sub,
  onChangePlan,
  onSuspend,
  onCancel,
  onHardDelete,
}: {
  sub: DisplaySubscriptionFull;
  onChangePlan: () => void;
  onSuspend: () => void;
  onCancel: () => void;
  onHardDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInternal = sub.isInternal;
  const isCancelled = sub.statusRaw === "cancelled";
  const isSuspended = sub.statusRaw === "suspended";

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function action(fn: () => void) {
    setOpen(false);
    fn();
  }

  const internalReason = isInternal ? "منشأة داخلية محمية" : undefined;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        aria-label="الإجراءات"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 min-w-[180px] rounded-xl border border-white/[0.10] bg-[#07111f] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.85)] overflow-hidden py-1">

          {/* تغيير الباقة */}
          <button
            onClick={() => action(onChangePlan)}
            disabled={isInternal}
            title={internalReason}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] text-[#22d3ee] hover:bg-[#22d3ee]/[0.08] transition-colors disabled:opacity-35 disabled:cursor-not-allowed text-right"
          >
            <Layers size={13} className="flex-shrink-0" />
            تغيير الباقة
          </button>

          {/* تعليق */}
          <button
            onClick={() => action(onSuspend)}
            disabled={isInternal || isCancelled || isSuspended}
            title={isInternal ? internalReason : isCancelled ? "الاشتراك ملغى" : isSuspended ? "الاشتراك معلق مسبقاً" : undefined}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] text-[#fbbf24] hover:bg-[#f59e0b]/[0.08] transition-colors disabled:opacity-35 disabled:cursor-not-allowed text-right"
          >
            <PauseCircle size={13} className="flex-shrink-0" />
            تعليق
          </button>

          {/* إلغاء */}
          <button
            onClick={() => action(onCancel)}
            disabled={isInternal || isCancelled}
            title={isInternal ? internalReason : isCancelled ? "الاشتراك ملغى مسبقاً" : undefined}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] text-[#f87171] hover:bg-[#ef4444]/[0.08] transition-colors disabled:opacity-35 disabled:cursor-not-allowed text-right"
          >
            <XCircle size={13} className="flex-shrink-0" />
            إلغاء
          </button>

          <div className="my-1 border-t border-white/[0.06]" />

          {/* حذف نهائي */}
          {isCancelled && !isInternal ? (
            <button
              onClick={() => action(onHardDelete)}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] text-[#f87171] hover:bg-[#ef4444]/[0.10] transition-colors text-right font-medium"
            >
              <Trash2 size={13} className="flex-shrink-0" />
              حذف نهائي
            </button>
          ) : (
            <div
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12.5px] text-white/25 cursor-not-allowed text-right"
              title={isInternal ? "منشأة داخلية محمية" : "يجب إلغاء الاشتراك أولاً قبل الحذف النهائي"}
            >
              <Trash2 size={13} className="flex-shrink-0" />
              <span>حذف نهائي</span>
              <Info size={11} className="mr-auto opacity-60" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Subscription row ──────────────────────────────────────────────────────────

function SubRow({
  sub,
  onChangePlan,
  onSuspend,
  onCancel,
  onHardDelete,
}: {
  sub: DisplaySubscriptionFull;
  onChangePlan: () => void;
  onSuspend: () => void;
  onCancel: () => void;
  onHardDelete: () => void;
}) {
  const a = ACCENT[sub.accent];
  return (
    <div className="flex items-center gap-3 sm:gap-4 border-b border-white/[0.04] py-3.5 px-2 hover:bg-white/[0.015] transition-colors group last:border-0">
      {/* Icon */}
      <div className={cn("h-9 w-9 flex-shrink-0 rounded-xl flex items-center justify-center", a.iconBg)}>
        <Building2 size={15} className={a.text} />
      </div>

      {/* Name + plan/date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-white leading-tight truncate">{sub.orgName}</p>
          {sub.isInternal && (
            <span className="flex-shrink-0 text-[10px] text-[#a855f7]/80 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-md px-1.5 py-0.5">
              داخلي
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/40 mt-0.5 truncate">
          {sub.planName} · {sub.startedAt}
        </p>
      </div>

      {/* Badges — desktop */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <span className={cn("inline-flex text-[11px] font-medium rounded-full px-2.5 py-0.5", STATUS_BADGE[sub.statusAr] ?? "bg-white/[0.06] text-white/40")}>
          {sub.statusAr}
        </span>
        <span className={cn("inline-flex text-[11px] rounded-full px-2.5 py-0.5", BILLING_BADGE[sub.billingCycleAr] ?? "bg-white/[0.06] text-white/40")}>
          {sub.billingCycleAr}
        </span>
      </div>

      {/* Actions */}
      <ActionMenu
        sub={sub}
        onChangePlan={onChangePlan}
        onSuspend={onSuspend}
        onCancel={onCancel}
        onHardDelete={onHardDelete}
      />
    </div>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "text-[#22d3ee]",
  iconBg = "bg-[#22d3ee]/10",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  iconBg?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
        <Icon size={16} className={accent} />
      </div>
      <div>
        <p className="text-[11.5px] text-white/45">{label}</p>
        <p className="text-[20px] font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Filter + search bar ───────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "active", label: "نشطة" },
  { key: "suspended", label: "معلقة" },
  { key: "cancelled", label: "ملغاة" },
  { key: "internal", label: "داخلية" },
];

function applyFilter(
  subs: DisplaySubscriptionFull[],
  filter: FilterKey,
  search: string,
): DisplaySubscriptionFull[] {
  let result = subs;
  if (filter === "internal") result = result.filter((s) => s.isInternal);
  else if (filter === "active") result = result.filter((s) => s.isActive && !s.isInternal);
  else if (filter === "suspended") result = result.filter((s) => s.statusRaw === "suspended");
  else if (filter === "cancelled") result = result.filter((s) => s.statusRaw === "cancelled");

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (s) =>
        s.orgName.toLowerCase().includes(q) ||
        (s.orgSlug ?? "").toLowerCase().includes(q),
    );
  }
  return result;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SubscriptionsPageContent() {
  const [subs, setSubs] = useState<DisplaySubscriptionFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSubs(await fetchSubscriptionsPage()); }
    catch { setSubs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    fetchPlanOptions().then(setPlanOptions).catch(() => {/* silent */});
  }, [load]);

  function handleDone(msg: string) {
    setModal(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
    void load();
  }

  const filtered = applyFilter(subs, filter, search);
  const activeCount = subs.filter((s) => s.isActive && !s.isInternal).length;
  const suspendedCount = subs.filter((s) => s.statusRaw === "suspended").length;
  const cancelledCount = subs.filter((s) => s.statusRaw === "cancelled").length;
  const internalCount = subs.filter((s) => s.isInternal).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-white">الاشتراكات</h1>
          <p className="text-[12.5px] text-white/45 mt-1 max-w-md leading-relaxed">
            إدارة الاشتراكات التشغيلية للمنشآت، مع تسجيل كل إجراء في سجل المالك.
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-xl bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] text-[13px] font-medium px-4 py-2.5 hover:bg-[#22d3ee]/20 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">إنشاء اشتراك</span>
        </button>
      </div>

      {/* ── Success banner ───────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#10b981]/25 bg-[#10b981]/[0.07] px-4 py-3">
          <CheckCircle2 size={15} className="text-[#34d399] flex-shrink-0" />
          <p className="text-[13px] text-[#34d399]">{successMsg}</p>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="إجمالي الاشتراكات" value={subs.length} icon={CreditCard} />
        <KpiCard label="نشطة" value={activeCount} icon={CheckCircle2} accent="text-[#34d399]" iconBg="bg-[#10b981]/10" />
        <KpiCard label="معلقة" value={suspendedCount} icon={PauseCircle} accent="text-[#fbbf24]" iconBg="bg-[#f59e0b]/10" />
        <KpiCard label="ملغاة" value={cancelledCount} icon={XCircle} accent="text-white/40" iconBg="bg-white/[0.06]" />
      </div>

      {/* ── Filter + search ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto flex-shrink-0">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all" ? subs.length
              : tab.key === "active" ? activeCount
              : tab.key === "suspended" ? suspendedCount
              : tab.key === "cancelled" ? cancelledCount
              : internalCount;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap",
                  filter === tab.key
                    ? "bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/25"
                    : "text-white/45 hover:text-white/65",
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[10px] rounded-full px-1.5",
                  filter === tab.key ? "bg-[#22d3ee]/20 text-[#22d3ee]" : "bg-white/[0.06] text-white/30",
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المنشأة أو الرمز..."
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] text-[13px] text-white placeholder:text-white/30 pr-9 pl-3 py-2 outline-none focus:border-[#22d3ee]/40 transition-colors"
          />
        </div>
      </div>

      {/* ── Table card ───────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
          <CreditCard size={15} className="text-[#22d3ee]" />
          <h2 className="text-[13.5px] font-semibold text-white">
            {filter === "all" ? "جميع الاشتراكات" : FILTER_TABS.find((t) => t.key === filter)?.label}
          </h2>
          <span className="text-[11px] text-white/35 border border-white/[0.07] rounded-full px-2 py-0.5 mr-1">
            {filtered.length}
          </span>
          {search && (
            <span className="text-[11px] text-[#22d3ee]/70 mr-auto">
              نتائج البحث عن &ldquo;{search}&rdquo;
            </span>
          )}
        </div>

        {/* Column headers — desktop */}
        <div className="hidden md:flex items-center gap-4 px-5 py-2.5 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="w-9 flex-shrink-0" />
          <div className="flex-1 text-[11px] text-white/35 font-medium">المنشأة</div>
          <div className="flex gap-2 w-[140px]">
            <span className="text-[11px] text-white/35 font-medium">الحالة</span>
          </div>
          <div className="w-8" />
        </div>

        <div className="px-3 pb-2">
          {loading ? (
            <div className="pt-2"><TableSkeleton /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <CreditCard size={34} className="text-white/12 mb-3" strokeWidth={1.2} />
              <p className="text-[13px] text-white/35">
                {search ? "لا توجد نتائج تطابق البحث" : "لا توجد اشتراكات"}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 text-[12px] text-[#22d3ee]/70 hover:text-[#22d3ee] transition-colors"
                >
                  مسح البحث
                </button>
              )}
            </div>
          ) : (
            filtered.map((sub) => (
              <SubRow
                key={sub.id}
                sub={sub}
                onChangePlan={() => setModal({ type: "change-plan", sub })}
                onSuspend={() => setModal({ type: "suspend", sub })}
                onCancel={() => setModal({ type: "cancel", sub })}
                onHardDelete={() => setModal({ type: "hard-delete", sub })}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && subs.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center gap-2">
            <Info size={12} className="text-white/25" />
            <p className="text-[11px] text-white/30">
              الحذف النهائي متاح فقط للاشتراكات الملغاة · كل إجراء يُسجَّل في سجل المالك
            </p>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
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
      {modal?.type === "hard-delete" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <HardDeleteModal
            sub={modal.sub}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        </ModalOverlay>
      )}
    </div>
  );
}
