"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  PauseCircle,
  Layers,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchOrganizationsPage, type DisplayOrgFull } from "../../_lib/ownerQueries";

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

// ─── Row actions (all disabled — read-only phase) ─────────────────────────────

function RowActions() {
  return (
    <div className="flex items-center gap-1.5">
      <button
        disabled
        title="قريباً"
        className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/20 bg-[#22d3ee]/[0.06] px-2.5 py-1 text-[11px] text-[#22d3ee]/40 cursor-not-allowed"
      >
        <Edit2 size={11} /> تعديل
      </button>
      <button
        disabled
        title="قريباً"
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/20 bg-[#a855f7]/[0.06] px-2.5 py-1 text-[11px] text-[#c084fc]/40 cursor-not-allowed"
      >
        <Layers size={11} /> تغيير الباقة
      </button>
      <button
        disabled
        title="قريباً"
        className="inline-flex items-center gap-1 rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/[0.06] px-2.5 py-1 text-[11px] text-[#fbbf24]/40 cursor-not-allowed"
      >
        <PauseCircle size={11} /> تعليق
      </button>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function OrgCard({ org }: { org: DisplayOrgFull }) {
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

      <RowActions />
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function OrganizationsPageContent() {
  const [orgs, setOrgs] = useState<DisplayOrgFull[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationsPage()
      .then(setOrgs)
      .catch(() => setError("فشل تحميل بيانات المنشآت"))
      .finally(() => setLoading(false));
  }, []);

  const activeCount  = orgs?.filter((o) => o.statusRaw === "active").length ?? 0;
  const internalCount = orgs?.filter((o) => o.isInternal).length ?? 0;
  const total = orgs?.length ?? 0;

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
          disabled
          title="قريباً"
          className="inline-flex items-center gap-2 rounded-xl border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-4 py-2.5 text-[13px] font-medium text-[#22d3ee]/40 cursor-not-allowed flex-shrink-0"
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <Building2 size={16} className="text-[#22d3ee]" />
            قائمة المنشآت
          </h2>
          {!loading && orgs && (
            <span className="text-[11px] text-[#8ba3c7]">{total} منشأة</span>
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
              <table className="w-full text-right border-collapse min-w-[900px]">
                <thead>
                  <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
                    <th className="font-medium pb-3 pr-1 text-right">المنشأة</th>
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
                      <td colSpan={9} className="pt-2">
                        <TableSkeleton />
                      </td>
                    </tr>
                  ) : orgs && orgs.length > 0 ? (
                    orgs.map((org) => (
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
                          <RowActions />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[13px] text-[#8ba3c7]">
                        لا توجد منشآت بعد
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
              ) : orgs && orgs.length > 0 ? (
                orgs.map((org) => <OrgCard key={org.id} org={org} />)
              ) : (
                <p className="py-8 text-center text-[13px] text-[#8ba3c7]">
                  لا توجد منشآت بعد
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
