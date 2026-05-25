"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Eye, ArrowUpCircle, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { setOrganizationStatus, type DisplayOrg } from "../_lib/ownerQueries";

const PLAN_BADGE: Record<string, string> = {
  "بسيط":  "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  "نمو":   "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  "متقدم": "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
};

const STATUS_BADGE: Record<string, string> = {
  "نشطة": "bg-[#10b981]/15 text-[#34d399]",
  "معلقة": "bg-[#f59e0b]/15 text-[#fbbf24]",
};

interface ActionButtonsProps {
  org: DisplayOrg;
  busy: boolean;
  onToggleStatus: (org: DisplayOrg) => void;
}

function ActionButtons({ org, busy, onToggleStatus }: ActionButtonsProps) {
  if (org.isInternal) {
    return (
      <span className="text-[11px] text-[#8ba3c7]/60">محمية</span>
    );
  }

  const suspended = org.statusAr === "معلقة";

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/owner/organizations"
        className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/15 transition-colors"
      >
        <Eye size={12} /> عرض
      </Link>
      <Link
        href="/owner/organizations"
        className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/25 bg-[#a855f7]/[0.08] px-2.5 py-1 text-[11px] text-[#c084fc] hover:bg-[#a855f7]/15 transition-colors"
      >
        <ArrowUpCircle size={12} /> ترقية
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => onToggleStatus(org)}
        className="inline-flex items-center gap-1 rounded-lg border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.08] px-2.5 py-1 text-[11px] text-[#ff9a68] hover:bg-[#ff7a3d]/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PauseCircle size={12} /> {suspended ? "تفعيل" : "تعليق"}
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

function OrgCardMobile({
  org,
  busy,
  onToggleStatus,
}: {
  org: DisplayOrg;
  busy: boolean;
  onToggleStatus: (org: DisplayOrg) => void;
}) {
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

      <ActionButtons org={org} busy={busy} onToggleStatus={onToggleStatus} />
    </div>
  );
}

interface Props {
  organizations?: DisplayOrg[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => Promise<void>;
}

export default function OrganizationsSection({ organizations, loading, error, onRefresh }: Props) {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const count = organizations?.length ?? 0;

  const handleToggleStatus = async (org: DisplayOrg) => {
    if (org.isInternal) return;
    const suspended = org.statusAr === "معلقة";
    const nextStatus = suspended ? "active" : "suspended";
    const msg = suspended
      ? `إعادة تفعيل منشأة «${org.name}»؟`
      : `تعليق منشأة «${org.name}»؟ لن يتمكن العملاء من استخدام المنصة.`;
    if (!window.confirm(msg)) return;

    setBusyId(org.id);
    const result = await setOrganizationStatus({ id: org.id, status: nextStatus });
    setBusyId(null);

    if (result.ok) {
      toast.success(suspended ? "تم إعادة تفعيل المنشأة" : "تم تعليق المنشأة");
      await onRefresh?.();
    } else {
      toast.error(result.error ?? "تعذّر تحديث الحالة");
    }
  };

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
                        <td className="py-3">
                          <ActionButtons
                            org={org}
                            busy={busyId === org.id}
                            onToggleStatus={handleToggleStatus}
                          />
                        </td>
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

          <div className="lg:hidden space-y-3">
            {loading
              ? [1, 2].map((i) => <SkeletonCard key={i} />)
              : organizations?.map((org) => (
                  <OrgCardMobile
                    key={org.id}
                    org={org}
                    busy={busyId === org.id}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
            {!loading && count === 0 && (
              <p className="py-6 text-center text-[13px] text-[#8ba3c7]">لا توجد منشآت بعد</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
