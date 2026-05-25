"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import { OWNER_READ_ONLY_ACTION } from "../../_data";
import OwnerReadOnlyBadge from "../../_components/OwnerReadOnlyBadge";
import { fetchSubscriptionsPage, type DisplaySubscriptionFull } from "../../_lib/ownerQueries";

// ─── Badge helpers ────────────────────────────────────────────────────────────

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

// ─── Row actions (disabled — read-only, no mutations) ───────────────────────

function RowActions() {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-[#5f7798] lg:hidden">{OWNER_READ_ONLY_ACTION}</p>
      <div className="flex flex-wrap items-center gap-1.5">
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/[0.06] px-2.5 py-1 text-[11px] text-[#c084fc]/40 cursor-not-allowed"
      >
        <Layers size={11} /> تغيير الباقة
      </button>
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] px-2.5 py-1 text-[11px] text-[#fbbf24]/40 cursor-not-allowed"
      >
        <PauseCircle size={11} /> تعليق الاشتراك
      </button>
      <button
        disabled
        title={OWNER_READ_ONLY_ACTION}
        className="inline-flex items-center gap-1 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/[0.06] px-2.5 py-1 text-[11px] text-[#f87171]/40 cursor-not-allowed"
      >
        <XCircle size={11} /> إلغاء الاشتراك
      </button>
      </div>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────
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

function SubCard({ sub }: { sub: DisplaySubscriptionFull }) {
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
        <div className="col-span-2 flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">تاريخ الإنشاء:</span>
          <span className="text-white tabular-nums">{sub.createdAt}</span>
        </div>
      </div>

      <RowActions />
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function SubscriptionsPageContent() {
  const [subs, setSubs] = useState<DisplaySubscriptionFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionsPage()
      .then(setSubs)
      .catch(() => setError("فشل تحميل بيانات الاشتراكات"))
      .finally(() => setLoading(false));
  }, []);

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
            اشتراكات المنشآت من جداول subscriptions و organizations و plans — عرض قراءة فقط.
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
          <OwnerReadOnlyBadge />
          <button
            disabled
            title={OWNER_READ_ONLY_ACTION}
            className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee]/40 cursor-not-allowed"
          >
            <Plus size={15} />
            إنشاء اشتراك
          </button>
        </div>
      </div>

      {/* KPI strip */}
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

      {/* Table card */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <CreditCard size={16} className="text-[#22d3ee]" />
            قائمة الاشتراكات
          </h2>
          {!loading && subs && (
            <span className="text-[11px] text-[#8ba3c7]">{total} اشتراك</span>
          )}
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
                      <td colSpan={9} className="pt-2">
                        <TableSkeleton />
                      </td>
                    </tr>
                  ) : subs && subs.length > 0 ? (
                    subs.map((sub) => {
                      const a = ACCENT[sub.accent];
                      return (
                        <tr key={sub.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          {/* Org */}
                          <td className="py-3.5 pr-1">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
                                <Building2 size={16} />
                              </span>
                              <div className="min-w-0">
                                <OrgNameLink sub={sub} />
                              </div>
                            </div>
                          </td>
                          {/* Slug */}
                          <td className="py-3.5">
                            <span className="text-[12px] text-[#8ba3c7] font-mono">{sub.orgSlug ?? "—"}</span>
                          </td>
                          {/* Plan */}
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", a.chip)}>{sub.planName}</span>
                          </td>
                          {/* Status */}
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", SUB_STATUS_BADGE[sub.statusAr] ?? "text-[#8ba3c7]")}>
                              {sub.statusAr}
                            </span>
                          </td>
                          {/* Billing */}
                          <td className="py-3.5">
                            <span className={cn("badge text-[11px]", BILLING_BADGE[sub.billingCycleAr] ?? "text-[#8ba3c7]")}>
                              {sub.billingCycleAr}
                            </span>
                          </td>
                          {/* Started */}
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.startedAt}</td>
                          {/* Ends */}
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.endsAt ?? "—"}</td>
                          {/* Created */}
                          <td className="py-3.5 text-[12px] text-[#8ba3c7] tabular-nums">{sub.createdAt}</td>
                          {/* Actions */}
                          <td className="py-3.5">
                            <RowActions />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12">
                        <div className="flex flex-col items-center justify-center text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-8">
                          <CreditCard size={32} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
                          <p className="text-[14px] font-medium text-white">لا توجد اشتراكات مسجّلة بعد</p>
                          <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-sm leading-relaxed">
                            تُفعَّل الاشتراكات من صفحة المنشآت — تظهر هنا تلقائياً عند إنشائها.
                          </p>
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
              ) : subs && subs.length > 0 ? (
                subs.map((sub) => <SubCard key={sub.id} sub={sub} />)
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02]">
                  <CreditCard size={28} className="text-[#22d3ee]/30 mb-3" strokeWidth={1.4} />
                  <p className="text-[14px] font-medium text-white">لا توجد اشتراكات مسجّلة بعد</p>
                  <p className="text-[12px] text-[#8ba3c7] mt-2 max-w-sm leading-relaxed">
                    تُفعَّل الاشتراكات من صفحة المنشآت — تظهر هنا تلقائياً عند إنشائها.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
