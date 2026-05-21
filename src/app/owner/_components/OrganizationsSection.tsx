"use client";

import { Building2, Eye, ArrowUpCircle, PauseCircle } from "lucide-react";
import { ORGANIZATIONS, type Organization, type PlanName, type OrgStatus, type InvoiceStatus } from "../_data";
import { cn } from "@/lib/utils";

const PLAN_BADGE: Record<PlanName, string> = {
  "بسيط":  "bg-[#22d3ee]/12 text-[#22d3ee] border border-[#22d3ee]/25",
  "نمو":   "bg-[#1e6fd9]/14 text-[#5b9bf0] border border-[#1e6fd9]/30",
  "متقدم": "bg-[#a855f7]/14 text-[#c084fc] border border-[#a855f7]/30",
};

const STATUS_BADGE: Record<OrgStatus, string> = {
  "نشطة": "bg-[#10b981]/15 text-[#34d399]",
  "معلقة": "bg-[#f59e0b]/15 text-[#fbbf24]",
};

const INVOICE_BADGE: Record<InvoiceStatus, string> = {
  "مدفوعة": "bg-[#10b981]/15 text-[#34d399]",
  "متأخرة": "bg-[#ef4444]/15 text-[#f87171]",
  "معلقة":  "bg-[#f59e0b]/15 text-[#fbbf24]",
};

function AiBar({ value }: { value: number }) {
  const warn = value >= 90;
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={cn("h-full rounded-full", warn ? "bg-gradient-to-l from-[#ff7a3d] to-[#ef4444]" : "bg-gradient-to-l from-[#22d3ee] to-[#1e6fd9]")}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn("text-[11px] tabular-nums", warn ? "text-[#ff9a68]" : "text-[#8ba3c7]")}>{value}%</span>
    </div>
  );
}

function ActionButtons() {
  return (
    <div className="flex items-center gap-1.5">
      <button className="inline-flex items-center gap-1 rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/[0.08] px-2.5 py-1 text-[11px] text-[#22d3ee] hover:bg-[#22d3ee]/15 transition-colors">
        <Eye size={12} /> عرض
      </button>
      <button className="inline-flex items-center gap-1 rounded-lg border border-[#a855f7]/25 bg-[#a855f7]/[0.08] px-2.5 py-1 text-[11px] text-[#c084fc] hover:bg-[#a855f7]/15 transition-colors">
        <ArrowUpCircle size={12} /> ترقية
      </button>
      <button className="inline-flex items-center gap-1 rounded-lg border border-[#ff7a3d]/25 bg-[#ff7a3d]/[0.08] px-2.5 py-1 text-[11px] text-[#ff9a68] hover:bg-[#ff7a3d]/15 transition-colors">
        <PauseCircle size={12} /> تعليق
      </button>
    </div>
  );
}

function OrgCardMobile({ org }: { org: Organization }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1e6fd9]/15 text-[#5b9bf0]">
            <Building2 size={16} />
          </span>
          <span className="text-[13px] font-medium text-white truncate">{org.name}</span>
        </div>
        <span className={cn("badge text-[10px] flex-shrink-0", STATUS_BADGE[org.status])}>{org.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الباقة:</span>
          <span className={cn("badge text-[10px]", PLAN_BADGE[org.plan])}>{org.plan}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الموظفين:</span>
          <span className="text-white tabular-nums">{org.employees}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">الفاتورة:</span>
          <span className={cn("badge text-[10px]", INVOICE_BADGE[org.invoice])}>{org.invoice}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#8ba3c7]">AI:</span>
          <span className="text-white tabular-nums">{org.aiUsage}%</span>
        </div>
      </div>

      <AiBar value={org.aiUsage} />
      <ActionButtons />
    </div>
  );
}

export default function OrganizationsSection() {
  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <Building2 size={18} className="text-[#22d3ee]" />
          المنشآت المشتركة
        </h2>
        <span className="text-[11px] text-[#8ba3c7]">{ORGANIZATIONS.length} منشآت</span>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="text-[11px] text-[#8ba3c7] border-b border-white/[0.07]">
              <th className="font-medium pb-3 pr-1">المنشأة</th>
              <th className="font-medium pb-3">الباقة</th>
              <th className="font-medium pb-3">الحالة</th>
              <th className="font-medium pb-3">الموظفين</th>
              <th className="font-medium pb-3">استهلاك AI</th>
              <th className="font-medium pb-3">حالة الفاتورة</th>
              <th className="font-medium pb-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {ORGANIZATIONS.map((org) => (
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
                  <span className={cn("badge text-[11px]", PLAN_BADGE[org.plan])}>{org.plan}</span>
                </td>
                <td className="py-3">
                  <span className={cn("badge text-[11px]", STATUS_BADGE[org.status])}>{org.status}</span>
                </td>
                <td className="py-3 text-[13px] text-white tabular-nums">{org.employees}</td>
                <td className="py-3"><AiBar value={org.aiUsage} /></td>
                <td className="py-3">
                  <span className={cn("badge text-[11px]", INVOICE_BADGE[org.invoice])}>{org.invoice}</span>
                </td>
                <td className="py-3"><ActionButtons /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {ORGANIZATIONS.map((org) => (
          <OrgCardMobile key={org.id} org={org} />
        ))}
      </div>
    </section>
  );
}
