"use client";

import { Building2, Eye, ArrowUpCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisplayOrg } from "../_lib/ownerQueries";

const PLAN_BADGE: Record<string, string> = {
  "بسيط":  "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  "نمو":   "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  "متقدم": "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
};

const STATUS_BADGE: Record<string, string> = {
  "نشطة": "bg-[#10b981]/15 text-[#34d399]",
  "معلقة": "bg-[#f59e0b]/15 text-[#fbbf24]",
};

function ActionButtons() {
  return (
    <div className="flex items-center gap-1.5">
      <button disabled className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-2.5 py-1 text-[11px] text-[#22d3ee]/50 cursor-not-allowed">
        <Eye size={12} /> عرض
      </button>
      <button disabled className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/25 bg-[#a855f7]/[0.08] px-2.5 py-1 text-[11px] text-[#c084fc]/50 cursor-not-allowed">
        <ArrowUpCircle size={12} /> ترقية
      </button>
      <button disabled className="inline-flex items-center gap-1 rounded-lg border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.08] px-2.5 py-1 text-[11px] text-[#ff9a68]/50 cursor-not-allowed">
        <PauseCircle size={12} /> تعليق
      </button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04]">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <td key={i} className="py-3">
          <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: i === 1 ? "140px" : "60px" }} />
        </td>
      ))}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-28 rounded bg-white/[0.06]" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 rounded bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}

function OrgCardMobile({ org }: { org: DisplayOrg }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
            <Building2 size={16} />
          </span>
          <span className="text-[13px] font-medium text-white truncate">
            {org.name}
            {org.isInternal && (
              <span className="mr-1.5 text-[10px] text-[#8ba3c7]">(داخلي)</span>
            )}
          </span>
        </div>
        <span className={cn("badge text-[10px] flex-shrink-0", STATUS_BADGE[org.statusAr])}>
          {org.statusAr}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الباقة:</span>
          <span className={cn("badge text-[10px]", PLAN_BADGE[org.planName] ?? "text-[#8ba3c7]")}>
            {org.planName}
          </span>
        </div>
      </div>

      <ActionButtons />
    </div>
  );
}

interface Props {
  organizations?: DisplayOrg[];
  loading?: boolean;
  error?: string | null;
}

export default function OrganizationsSection({ organizations, loading, error }: Props) {
  const count = organizations?.length ?? 0;

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <Building2 size={18} className="text-[#22d3ee]" />
          المنشآت المشتركة
        </h2>
        <span className="text-[11px] text-[#8ba3c7]">
          {loading ? "…" : `${count} منشآت`}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.06] px-4 py-3 text-[13px] text-[#ff9a68]">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
                  <th className="font-medium pb-3 pr-1">المنشأة</th>
                  <th className="font-medium pb-3">الباقة</th>
                  <th className="font-medium pb-3">الحالة</th>
                  <th className="font-medium pb-3">النوع</th>
                  <th className="font-medium pb-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1, 2].map((i) => <SkeletonRow key={i} />)
                  : organizations?.map((org) => (
                      <tr key={org.id} className="table-row border-b border-white/[0.04] transition-colors">
                        <td className="py-3 pr-1">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
                              <Building2 size={16} />
                            </span>
                            <span className="text-[13px] font-medium text-white">{org.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={cn("badge text-[11px]", PLAN_BADGE[org.planName] ?? "text-[#8ba3c7]")}>
                            {org.planName}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={cn("badge text-[11px]", STATUS_BADGE[org.statusAr])}>
                            {org.statusAr}
                          </span>
                        </td>
                        <td className="py-3 text-[12px] text-[#8ba3c7]">
                          {org.isInternal ? "داخلي" : "عميل"}
                        </td>
                        <td className="py-3"><ActionButtons /></td>
                      </tr>
                    ))}
                {!loading && count === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[13px] text-[#8ba3c7]">
                      لا توجد منشآت بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {loading
              ? [1, 2].map((i) => <SkeletonCard key={i} />)
              : organizations?.map((org) => <OrgCardMobile key={org.id} org={org} />)}
            {!loading && count === 0 && (
              <p className="py-6 text-center text-[13px] text-[#8ba3c7]">لا توجد منشآت بعد</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
