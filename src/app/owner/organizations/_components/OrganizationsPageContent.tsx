"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Edit2,
  PauseCircle,
  Layers,
  RefreshCw,
  Power,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Hash,
  Search,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import {
  fetchOrganizationsPage,
  setOrganizationStatus,
  softDeleteOrganization,
  type DisplayOrgFull,
} from "../../_lib/ownerQueries";
import CreateOrganizationModal from "./CreateOrganizationModal";
import ActivateSubscriptionModal from "./ActivateSubscriptionModal";
import CreateClientLoginModal from "./CreateClientLoginModal";
import ResetClientPasswordModal from "./ResetClientPasswordModal";
import EditOrganizationModal from "./EditOrganizationModal";
import ChangePlanModal from "./ChangePlanModal";

// ─── Badge helpers ────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  "بسيط":  "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  "نمو":   "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  "متقدم": "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
};

const ORG_STATUS_BADGE: Record<string, string> = {
  "نشطة":    "bg-[#10b981]/15 text-[#34d399]",
  "تجريبية": "bg-[#22d3ee]/15 text-[#22d3ee]",
  "معلقة":   "bg-[#f59e0b]/15 text-[#fbbf24]",
  "ملغاة":   "bg-[#ef4444]/15 text-[#f87171]",
};

const SUB_STATUS_BADGE: Record<string, string> = {
  "نشطة":    "bg-[#10b981]/15 text-[#34d399]",
  "تجريبية": "bg-[#22d3ee]/15 text-[#22d3ee]",
  "متأخرة":  "bg-[#ef4444]/15 text-[#f87171]",
  "معلقة":   "bg-[#f59e0b]/15 text-[#fbbf24]",
  "ملغاة":   "bg-[#6b7280]/15 text-[#9ca3af]",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/[0.04] py-4 px-1"
        >
          <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-36 rounded bg-white/[0.06]" />
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
          </div>
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-14 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
          <div className="h-3 w-24 rounded bg-white/[0.06]" />
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

// ─── Row actions ───────────────────────────────────────────────────────────────
// Customer tenants (is_internal = false) get the full management set: activate
// subscription, create client login, edit, change plan, suspend/reactivate, and
// soft-delete. The internal Blumark24 org is action-protected — it shows a
// "محمية" marker instead, and the DB trigger rejects any destructive change.

interface RowActionsProps {
  org: DisplayOrgFull;
  busy: boolean;
  onActivate: (org: DisplayOrgFull) => void;
  onCreateClientLogin: (org: DisplayOrgFull) => void;
  onResetPassword: (org: DisplayOrgFull) => void;
  onEdit: (org: DisplayOrgFull) => void;
  onChangePlan: (org: DisplayOrgFull) => void;
  onToggleStatus: (org: DisplayOrgFull) => void;
  onDelete: (org: DisplayOrgFull) => void;
}

function RowActions({
  org,
  busy,
  onActivate,
  onCreateClientLogin,
  onResetPassword,
  onEdit,
  onChangePlan,
  onToggleStatus,
  onDelete,
}: RowActionsProps) {
  // Internal org: protected from customer-management actions; detail view is read-only.
  if (org.isInternal) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/owner/organizations/${org.id}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/30 bg-[#22d3ee]/[0.10] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/50 transition-colors"
        >
          <Eye size={11} /> عرض
        </Link>
        <span
          title="منشأة داخلية محمية — غير قابلة للتعديل أو الحذف كعميل"
          className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/[0.06] px-2.5 py-1 text-[11px] text-[#22d3ee]/70 cursor-default"
        >
          <ShieldCheck size={11} /> محمية
        </span>
      </div>
    );
  }

  const suspended = org.statusRaw === "suspended";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/owner/organizations/${org.id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/30 bg-[#22d3ee]/[0.10] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/50 transition-colors"
      >
        <Eye size={11} /> عرض
      </Link>
      {!org.hasSubscription && (
        <button
          type="button"
          onClick={() => onActivate(org)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#10b981]/40 bg-[#10b981]/15 px-2.5 py-1 text-[11px] text-[#34d399] hover:bg-[#10b981]/25 hover:border-[#10b981]/60 transition-colors"
        >
          <Power size={11} /> تفعيل الاشتراك
        </button>
      )}
      {org.hasClientLogin ? (
        <span
          title="تم إنشاء حساب الدخول وربطه"
          className="inline-flex items-center gap-1 rounded-lg border border-[#10b981]/25 bg-[#10b981]/10 px-2.5 py-1 text-[11px] text-[#34d399]/70 cursor-default"
        >
          <CheckCircle2 size={11} /> تم الربط
        </span>
      ) : org.ownerEmail ? (
        <button
          type="button"
          onClick={() => onCreateClientLogin(org)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#1e6fd9]/40 bg-[#1e6fd9]/15 px-2.5 py-1 text-[11px] text-[#5b9bf0] hover:bg-[#1e6fd9]/25 hover:border-[#1e6fd9]/60 transition-colors"
        >
          <KeyRound size={11} /> إنشاء حساب دخول
        </button>
      ) : null}
      {org.ownerEmail && (
        <button
          type="button"
          onClick={() => onResetPassword(org)}
          disabled={busy}
          title="إرسال رابط آمن لإعادة تعيين كلمة مرور مدير المنشأة"
          className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.10] px-2.5 py-1 text-[11px] text-[#fbbf24] hover:bg-[#f59e0b]/20 hover:border-[#f59e0b]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={11} /> إعادة تعيين كلمة مرور المدير
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(org)}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/30 bg-[#22d3ee]/[0.10] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/20 hover:border-[#22d3ee]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Edit2 size={11} /> تعديل
      </button>
      <button
        type="button"
        onClick={() => onChangePlan(org)}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/[0.10] px-2.5 py-1 text-[11px] text-[#c084fc] hover:bg-[#a855f7]/20 hover:border-[#a855f7]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Layers size={11} /> تغيير الباقة
      </button>
      {suspended ? (
        <button
          type="button"
          onClick={() => onToggleStatus(org)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-[#10b981]/40 bg-[#10b981]/15 px-2.5 py-1 text-[11px] text-[#34d399] hover:bg-[#10b981]/25 hover:border-[#10b981]/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Power size={11} /> إعادة تفعيل
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggleStatus(org)}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.10] px-2.5 py-1 text-[11px] text-[#fbbf24] hover:bg-[#f59e0b]/20 hover:border-[#f59e0b]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PauseCircle size={11} /> تعليق
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(org)}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.10] px-2.5 py-1 text-[11px] text-[#f87171] hover:bg-[#ef4444]/20 hover:border-[#ef4444]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Trash2 size={11} /> حذف
      </button>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function OrgCard(props: RowActionsProps) {
  const { org } = props;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-medium text-white truncate">{org.name}</span>
              {org.isInternal && (
                <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-1.5 py-0.5 text-[10px] text-[#22d3ee]">
                  داخلي
                </span>
              )}
            </div>
            {org.slug && (
              <div className="text-[11px] text-[#8ba3c7] font-mono mt-0.5 truncate">{org.slug}</div>
            )}
          </div>
        </div>
        <span className={cn("badge text-[10px] flex-shrink-0", ORG_STATUS_BADGE[org.statusAr])}>
          {org.statusAr}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        <div className="col-span-2 flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">رقم العميل:</span>
          <span className="font-mono tabular-nums text-[#22d3ee]">{org.customerCode ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الباقة:</span>
          <span className={cn("badge text-[10px]", PLAN_BADGE[org.planName] ?? "text-[#8ba3c7]")}>
            {org.planName}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الاشتراك:</span>
          <span className={cn("badge text-[10px]", SUB_STATUS_BADGE[org.subStatusAr] ?? "text-[#8ba3c7]")}>
            {org.subStatusAr}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الفوترة:</span>
          <span className="text-white">{org.subBillingCycleAr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">تاريخ الإنشاء:</span>
          <span className="text-white tabular-nums">{org.createdAt}</span>
        </div>
        {org.ownerEmail && (
          <div className="col-span-2 flex items-center gap-1.5">
            <span className="text-[#8ba3c7]">البريد:</span>
            <span className="text-white truncate">{org.ownerEmail}</span>
          </div>
        )}
      </div>

      <RowActions {...props} />
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function OrganizationsPageContent() {
  const toast = useToast();
  const [orgs, setOrgs] = useState<DisplayOrgFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activateOrg, setActivateOrg] = useState<DisplayOrgFull | null>(null);
  const [clientLoginOrg, setClientLoginOrg] = useState<DisplayOrgFull | null>(null);
  const [resetPwOrg, setResetPwOrg] = useState<DisplayOrgFull | null>(null);
  const [editOrg, setEditOrg] = useState<DisplayOrgFull | null>(null);
  const [changePlanOrg, setChangePlanOrg] = useState<DisplayOrgFull | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadOrgs = useCallback(async () => {
    try {
      const data = await fetchOrganizationsPage();
      setOrgs(data);
      setError(null);
    } catch {
      setError("فشل تحميل بيانات المنشآت");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  const handleCreated = useCallback(() => {
    toast.success("تم إنشاء المنشأة بنجاح");
    void loadOrgs();
  }, [toast, loadOrgs]);

  const handleActivated = useCallback(() => {
    toast.success("تم تفعيل الاشتراك بنجاح");
    void loadOrgs();
  }, [toast, loadOrgs]);

  const handleClientLoginCreated = useCallback(() => {
    toast.success("تم إنشاء حساب الدخول وربطه بالمنشأة");
    void loadOrgs();
  }, [toast, loadOrgs]);

  const handlePasswordResetSent = useCallback(() => {
    toast.success("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد مدير المنشأة");
  }, [toast]);

  const handleSaved = useCallback(() => {
    toast.success("تم تحديث بيانات المنشأة");
    void loadOrgs();
  }, [toast, loadOrgs]);

  const handlePlanChanged = useCallback(() => {
    toast.success("تم تغيير الباقة بنجاح");
    void loadOrgs();
  }, [toast, loadOrgs]);

  // Suspend / reactivate — guarded against internal orgs and confirmed first.
  const handleToggleStatus = useCallback(async (org: DisplayOrgFull) => {
    if (org.isInternal) return;
    const suspending = org.statusRaw !== "suspended";
    const msg = suspending
      ? `تعليق المنشأة "${org.name}"؟ ستظهر كمعلّقة حتى تعيد تفعيلها.`
      : `إعادة تفعيل المنشأة "${org.name}"؟`;
    if (!window.confirm(msg)) return;
    setBusyId(org.id);
    const res = await setOrganizationStatus({ id: org.id, status: suspending ? "suspended" : "active" });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر تحديث حالة المنشأة");
      return;
    }
    toast.success(suspending ? "تم تعليق المنشأة" : "تمت إعادة تفعيل المنشأة");
    void loadOrgs();
  }, [toast, loadOrgs]);

  // Soft-delete — non-destructive (deleted_at), confirmed, internal-protected.
  const handleDelete = useCallback(async (org: DisplayOrgFull) => {
    if (org.isInternal) return;
    if (!window.confirm(
      `حذف المنشأة "${org.name}"؟\nهذا حذف ناعم — تبقى البيانات في قاعدة البيانات ويمكن استرجاعها. متابعة؟`,
    )) return;
    setBusyId(org.id);
    const res = await softDeleteOrganization({ id: org.id });
    setBusyId(null);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر حذف المنشأة");
      return;
    }
    toast.success("تم حذف المنشأة (حذف ناعم)");
    void loadOrgs();
  }, [toast, loadOrgs]);

  const activeCount  = orgs?.filter((o) => o.statusRaw === "active").length ?? 0;
  const internalCount = orgs?.filter((o) => o.isInternal).length ?? 0;
  const total = orgs?.length ?? 0;

  // Client-side filter — matches name, customer code, slug, or owner email.
  const q = query.trim().toLowerCase();
  const visibleOrgs = !orgs
    ? null
    : !q
      ? orgs
      : orgs.filter((o) =>
          [o.name, o.customerCode, o.slug, o.ownerEmail]
            .some((field) => (field ?? "").toLowerCase().includes(q)),
        );
  const visibleCount = visibleOrgs?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Building2 size={26} className="text-[#22d3ee]" />
            المنشآت المشتركة
          </h1>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            جميع المنشآت المسجلة في المنصة — باقاتها واشتراكاتها وحالتها.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/15 px-4 py-2.5 text-[13px] font-medium text-[#22d3ee] hover:bg-[#22d3ee]/25 hover:border-[#22d3ee]/60 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          إنشاء منشأة
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي المنشآت", value: loading ? "…" : String(total),         color: "text-[#22d3ee]", border: "border-[#22d3ee]/20" },
          { label: "نشطة",           value: loading ? "…" : String(activeCount),   color: "text-[#10b981]", border: "border-[#10b981]/20" },
          { label: "داخلية",         value: loading ? "…" : String(internalCount), color: "text-[#a855f7]", border: "border-[#a855f7]/20" },
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <Building2 size={16} className="text-[#22d3ee]" />
            قائمة المنشآت
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="بحث: رقم العميل، الاسم، البريد..."
                className="w-full rounded-xl bg-[rgba(13,31,60,0.7)] border border-white/[0.08] text-[12px] text-white placeholder:text-white/40 pr-9 pl-3 py-2 outline-none transition-colors focus:border-[#22d3ee]/50"
              />
            </div>
            {!loading && orgs && (
              <span className="text-[11px] text-[#8ba3c7] whitespace-nowrap">
                {q ? `${visibleCount} / ${total}` : `${total} منشأة`}
              </span>
            )}
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
              <table className="w-full text-right border-collapse min-w-[900px]">
                <thead>
                  <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
                    <th className="font-medium pb-3 pr-1 text-right">المنشأة</th>
                    <th className="font-medium pb-3 text-right">رقم العميل</th>
                    <th className="font-medium pb-3 text-right">المعرف</th>
                    <th className="font-medium pb-3 text-right">المالك</th>
                    <th className="font-medium pb-3 text-right">الباقة</th>
                    <th className="font-medium pb-3 text-right">حالة المنشأة</th>
                    <th className="font-medium pb-3 text-right">الاشتراك</th>
                    <th className="font-medium pb-3 text-right">الفوترة</th>
                    <th className="font-medium pb-3 text-right">تاريخ الإنشاء</th>
                    <th className="font-medium pb-3 text-right">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="pt-2">
                        <TableSkeleton />
                      </td>
                    </tr>
                  ) : visibleOrgs && visibleOrgs.length > 0 ? (
                    visibleOrgs.map((org) => (
                      <tr
                        key={org.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Name */}
                        <td className="py-3.5 pr-1">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
                              <Building2 size={16} />
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-medium text-white">{org.name}</span>
                                {org.isInternal && (
                                  <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-1.5 py-0.5 text-[10px] text-[#22d3ee]">
                                    داخلي
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Customer code */}
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1 text-[12px] text-[#22d3ee] font-mono tabular-nums">
                            <Hash size={11} className="text-[#22d3ee]/60" />
                            {org.customerCode ?? "—"}
                          </span>
                        </td>
                        {/* Slug */}
                        <td className="py-3.5">
                          <span className="text-[12px] text-[#8ba3c7] font-mono">
                            {org.slug ?? "—"}
                          </span>
                        </td>
                        {/* Owner email */}
                        <td className="py-3.5">
                          <span className="text-[12px] text-[#8ba3c7] max-w-[160px] truncate block">
                            {org.ownerEmail ?? "—"}
                          </span>
                        </td>
                        {/* Plan */}
                        <td className="py-3.5">
                          <span className={cn("badge text-[11px]", PLAN_BADGE[org.planName] ?? "text-[#8ba3c7]")}>
                            {org.planName}
                          </span>
                        </td>
                        {/* Org status */}
                        <td className="py-3.5">
                          <span className={cn("badge text-[11px]", ORG_STATUS_BADGE[org.statusAr])}>
                            {org.statusAr}
                          </span>
                        </td>
                        {/* Sub status */}
                        <td className="py-3.5">
                          <span className={cn("badge text-[11px]", SUB_STATUS_BADGE[org.subStatusAr] ?? "text-[#8ba3c7]")}>
                            {org.subStatusAr}
                          </span>
                        </td>
                        {/* Billing cycle */}
                        <td className="py-3.5 text-[12px] text-[#8ba3c7]">
                          {org.subBillingCycleAr}
                        </td>
                        {/* Created */}
                        <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">
                          {org.createdAt}
                        </td>
                        {/* Actions */}
                        <td className="py-3.5">
                          <RowActions
                            org={org}
                            busy={busyId === org.id}
                            onActivate={setActivateOrg}
                            onCreateClientLogin={setClientLoginOrg}
                            onResetPassword={setResetPwOrg}
                            onEdit={setEditOrg}
                            onChangePlan={setChangePlanOrg}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDelete}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[13px] text-[#8ba3c7]">
                        {q ? "لا توجد منشآت مطابقة للبحث" : "لا توجد منشآت بعد"}
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
              ) : visibleOrgs && visibleOrgs.length > 0 ? (
                visibleOrgs.map((org) => (
                  <OrgCard
                    key={org.id}
                    org={org}
                    busy={busyId === org.id}
                    onActivate={setActivateOrg}
                    onCreateClientLogin={setClientLoginOrg}
                    onResetPassword={setResetPwOrg}
                    onEdit={setEditOrg}
                    onChangePlan={setChangePlanOrg}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <p className="py-8 text-center text-[13px] text-[#8ba3c7]">
                  {q ? "لا توجد منشآت مطابقة للبحث" : "لا توجد منشآت بعد"}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <CreateOrganizationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ActivateSubscriptionModal
        org={activateOrg}
        onClose={() => setActivateOrg(null)}
        onActivated={handleActivated}
      />

      <CreateClientLoginModal
        org={clientLoginOrg}
        onClose={() => setClientLoginOrg(null)}
        onCreated={handleClientLoginCreated}
      />

      <ResetClientPasswordModal
        org={resetPwOrg}
        onClose={() => setResetPwOrg(null)}
        onDone={handlePasswordResetSent}
      />

      <EditOrganizationModal
        org={editOrg}
        onClose={() => setEditOrg(null)}
        onSaved={handleSaved}
      />

      <ChangePlanModal
        org={changePlanOrg}
        onClose={() => setChangePlanOrg(null)}
        onChanged={handlePlanChanged}
      />
    </div>
  );
}
