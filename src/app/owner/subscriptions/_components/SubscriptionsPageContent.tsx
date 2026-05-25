"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  Building2,
  Plus,
  Layers,
  PauseCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { ACCENT } from "../../_accent";
import {
  cancelSubscription,
  fetchSubscriptionsPage,
  setOrganizationStatus,
  type DisplayOrgFull,
  type DisplaySubscriptionFull,
} from "../../_lib/ownerQueries";
import ChangePlanModal from "../../organizations/_components/ChangePlanModal";

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

function subToOrgFull(sub: DisplaySubscriptionFull): DisplayOrgFull {
  return {
    id: sub.organizationId,
    name: sub.orgName,
    slug: sub.orgSlug,
    customerCode: null,
    ownerEmail: null,
    isInternal: sub.isInternal,
    statusRaw: sub.statusRaw === "suspended" ? "suspended" : sub.statusRaw === "cancelled" ? "cancelled" : "active",
    statusAr: sub.statusAr,
    planId: sub.planId,
    planName: sub.planName,
    planSlug: sub.planSlug,
    hasSubscription: true,
    subStatusAr: sub.statusAr,
    subIsActive: sub.isActive,
    subBillingCycleAr: sub.billingCycleAr,
    hasClientLogin: false,
    createdAt: sub.createdAt,
  };
}

interface RowActionsProps {
  sub: DisplaySubscriptionFull;
  busy: boolean;
  onChangePlan: (sub: DisplaySubscriptionFull) => void;
  onSuspend: (sub: DisplaySubscriptionFull) => void;
  onCancel: (sub: DisplaySubscriptionFull) => void;
}

function RowActions({ sub, busy, onChangePlan, onSuspend, onCancel }: RowActionsProps) {
  if (sub.isInternal) {
    return <span className="text-[11px] text-[#8ba3c7]/60">داخلي — محمي</span>;
  }

  const suspended = sub.statusRaw === "suspended";
  const cancelled = sub.statusRaw === "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={busy || cancelled}
        onClick={() => onChangePlan(sub)}
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/[0.10] px-2.5 py-1 text-[11px] text-[#c084fc] hover:bg-[#a855f7]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Layers size={11} /> تغيير الباقة
      </button>
      <button
        type="button"
        disabled={busy || cancelled}
        onClick={() => onSuspend(sub)}
        className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/[0.10] px-2.5 py-1 text-[11px] text-[#fbbf24] hover:bg-[#f59e0b]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PauseCircle size={11} /> {suspended ? "إعادة تفعيل" : "تعليق الاشتراك"}
      </button>
      <button
        type="button"
        disabled={busy || cancelled}
        onClick={() => onCancel(sub)}
        className="inline-flex items-center gap-1 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/[0.10] px-2.5 py-1 text-[11px] text-[#f87171] hover:bg-[#ef4444]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <XCircle size={11} /> إلغاء الاشتراك
      </button>
    </div>
  );
}

function SubCard(props: RowActionsProps) {
  const { sub } = props;
  const a = ACCENT[sub.accent];
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] font-medium text-white truncate">{sub.orgName}</span>
              {sub.isInternal && (
                <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-1.5 py-0.5 text-[10px] text-[#22d3ee]">
                  داخلي
                </span>
              )}
            </div>
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

      <RowActions {...props} />
    </div>
  );
}

export default function SubscriptionsPageContent() {
  const toast = useToast();
  const [subs, setSubs] = useState<DisplaySubscriptionFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [changePlanOrg, setChangePlanOrg] = useState<DisplayOrgFull | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubscriptionsPage();
      setSubs(data);
    } catch {
      setError("فشل تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSuspend = async (sub: DisplaySubscriptionFull) => {
    if (sub.isInternal) return;
    const suspended = sub.statusRaw === "suspended";
    const msg = suspended
      ? `إعادة تفعيل اشتراك «${sub.orgName}»؟`
      : `تعليق اشتراك «${sub.orgName}»؟`;
    if (!window.confirm(msg)) return;

    setBusyId(sub.id);
    const result = await setOrganizationStatus({
      id: sub.organizationId,
      status: suspended ? "active" : "suspended",
    });
    setBusyId(null);

    if (result.ok) {
      toast.success(suspended ? "تم إعادة تفعيل الاشتراك" : "تم تعليق الاشتراك");
      await load();
    } else {
      toast.error(result.error ?? "تعذّر تحديث الاشتراك");
    }
  };

  const handleCancel = async (sub: DisplaySubscriptionFull) => {
    if (sub.isInternal) return;
    if (!window.confirm(`إلغاء اشتراك «${sub.orgName}»؟ ستُعلّم المنشأة كملغاة.`)) return;

    setBusyId(sub.id);
    const result = await cancelSubscription({ organizationId: sub.organizationId });
    setBusyId(null);

    if (result.ok) {
      toast.success("تم إلغاء الاشتراك");
      await load();
    } else {
      toast.error(result.error ?? "تعذّر إلغاء الاشتراك");
    }
  };

  const rowProps = (sub: DisplaySubscriptionFull) => ({
    sub,
    busy: busyId === sub.id,
    onChangePlan: (s: DisplaySubscriptionFull) => setChangePlanOrg(subToOrgFull(s)),
    onSuspend: handleSuspend,
    onCancel: handleCancel,
  });

  const total = subs?.length ?? 0;
  const activeCount = subs?.filter((s) => s.isActive).length ?? 0;
  const internalCount = subs?.filter((s) => s.isInternal).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <CreditCard size={26} className="text-[#22d3ee]" />
            الاشتراكات
          </h1>
          <p className="text-[13px] text-[#8ba3c7] leading-relaxed max-w-2xl">
            إدارة اشتراكات منشآت منصة Blumark24 — تغيير الباقة، التعليق، والإلغاء.
          </p>
        </div>
        <Link
          href="/owner/organizations"
          className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/40 bg-[#22d3ee]/[0.12] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee] hover:bg-[#22d3ee]/20 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          إنشاء اشتراك
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي الاشتراكات", value: loading ? "…" : String(total),         color: "text-[#22d3ee]", border: "border-[#22d3ee]/20" },
          { label: "نشطة",             value: loading ? "…" : String(activeCount),    color: "text-[#10b981]", border: "border-[#10b981]/20" },
          { label: "داخلية",           value: loading ? "…" : String(internalCount),  color: "text-[#a855f7]", border: "border-[#a855f7]/20" },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={cn("glass-card p-4 border text-center", border)}>
            <div className={cn("font-heading text-2xl font-bold tabular-nums", color, loading && "animate-pulse opacity-40")}>
              {value}
            </div>
            <div className="mt-1 text-[11px] text-[#8ba3c7]">{label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <CreditCard size={16} className="text-[#22d3ee]" />
            قائمة الاشتراكات
          </h2>
          <div className="flex items-center gap-2">
            {!loading && subs && (
              <span className="text-[11px] text-[#8ba3c7]">{total} اشتراك</span>
            )}
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-[#8ba3c7] hover:text-white transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[13px] text-[#ff9a68]">
            <RefreshCw size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!error && (
          <>
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
                      <td colSpan={9} className="pt-2">
                        <TableSkeleton />
                      </td>
                    </tr>
                  ) : subs && subs.length > 0 ? (
                    subs.map((sub) => {
                      const a = ACCENT[sub.accent];
                      return (
                        <tr key={sub.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 pr-1">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
                                <Building2 size={16} />
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] font-medium text-white">{sub.orgName}</span>
                                {sub.isInternal && (
                                  <span className="rounded-full bg-[#22d3ee]/12 border border-[#22d3ee]/25 px-1.5 py-0.5 text-[10px] text-[#22d3ee]">
                                    داخلي
                                  </span>
                                )}
                              </div>
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
                            <RowActions {...rowProps(sub)} />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[13px] text-[#8ba3c7]">
                        لا توجد اشتراكات بعد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {loading ? (
                <CardSkeleton />
              ) : subs && subs.length > 0 ? (
                subs.map((sub) => <SubCard key={sub.id} {...rowProps(sub)} />)
              ) : (
                <p className="py-8 text-center text-[13px] text-[#8ba3c7]">لا توجد اشتراكات بعد</p>
              )}
            </div>
          </>
        )}
      </div>

      <ChangePlanModal
        org={changePlanOrg}
        onClose={() => setChangePlanOrg(null)}
        onChanged={() => {
          setChangePlanOrg(null);
          load();
          toast.success("تم تغيير الباقة");
        }}
      />
    </div>
  );
}
