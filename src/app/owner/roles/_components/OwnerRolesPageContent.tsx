"use client";

import { ShieldCheck, UserCheck, Lock, ShieldHalf, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { OWNER_EMAILS } from "@/lib/owner";

interface Permission {
  label: string;
  scope: string;
  status: "مفعّل" | "يدوي" | "غير مفعّل بعد";
}

const OWNER_PERMISSIONS: Permission[] = [
  { label: "الوصول الكامل للوحة التحكم",        scope: "/owner/*",                      status: "مفعّل" },
  { label: "إنشاء وتعديل الباقات",              scope: "/owner/plans",                  status: "مفعّل" },
  { label: "إدارة المنشآت",                     scope: "/owner/organizations",           status: "مفعّل" },
  { label: "إدارة الاشتراكات",                  scope: "/owner/subscriptions",           status: "مفعّل" },
  { label: "الوصول لسجل الفواتير",              scope: "/owner/invoices",                status: "مفعّل" },
  { label: "مراقبة استخدام AI",                 scope: "/owner/ai-usage",               status: "مفعّل" },
  { label: "تفعيل/تعطيل ميزات النظام",          scope: "feature flags",                 status: "يدوي" },
  { label: "إصدار الفواتير الرسمية",             scope: "billing gateway",               status: "غير مفعّل بعد" },
  { label: "ربط WhatsApp Business API",         scope: "whatsapp integration",          status: "غير مفعّل بعد" },
  { label: "دعوة مالكين إضافيين",               scope: "OWNER_EMAILS allowlist",        status: "يدوي" },
];

const STATUS_CLASS: Record<Permission["status"], string> = {
  "مفعّل":          "bg-[#10b981]/15 text-[#34d399]",
  "يدوي":           "bg-[#f59e0b]/15 text-[#fbbf24]",
  "غير مفعّل بعد":  "bg-white/[0.06] text-white/40",
};

export default function OwnerRolesPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <ShieldCheck size={28} className="text-[#22d3ee]" />
          الصلاحيات والأدوار
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          تعريف صلاحيات مالك المنصة والوصول المميز — مبني على قائمة OWNER_EMAILS الثابتة في الكود.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Permissions table */}
        <section className="glass-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Lock size={17} className="text-[#22d3ee]" />
              <h2 className="font-heading text-[15px] font-bold text-white">مصفوفة الصلاحيات</h2>
            </div>
            <button
              disabled
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
              title="الصلاحيات مضبوطة في الكود المصدري"
            >
              <ShieldCheck size={13} />
              تعديل الصلاحيات
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["الصلاحية", "النطاق", "الحالة"].map((h) => (
                    <th key={h} className="px-4 sm:px-5 py-3 text-[11px] font-medium text-[#5f7798] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {OWNER_PERMISSIONS.map((perm) => (
                  <tr key={perm.label} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 sm:px-5 py-3 text-white font-medium">{perm.label}</td>
                    <td className="px-4 sm:px-5 py-3 text-[#5f7798] font-mono text-[11px] whitespace-nowrap">{perm.scope}</td>
                    <td className="px-4 sm:px-5 py-3">
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-full", STATUS_CLASS[perm.status])}>
                        {perm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 sm:px-6 py-3 border-t border-white/[0.06] text-[11px] text-[#5f7798]">
            {OWNER_PERMISSIONS.length} صلاحية — مصدرها الكود المصدري (src/lib/owner.ts)
          </div>
        </section>

        {/* Owner accounts */}
        <section className="glass-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShieldHalf size={17} className="text-[#22d3ee]" />
              <h2 className="font-heading text-[15px] font-bold text-white">حسابات المالك</h2>
            </div>
            <button
              disabled
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
              title="يتطلب تعديل OWNER_EMAILS في الكود"
            >
              <UserPlus size={13} />
              دعوة مالك إضافي
            </button>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {OWNER_EMAILS.map((email, idx) => (
              <div key={email} className="flex items-center gap-4 px-5 sm:px-6 py-4">
                <span
                  className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#a855f7,#1E6FD9)" }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-white font-medium truncate">{email}</p>
                  <p className="text-[11px] text-[#5f7798] mt-0.5">Platform Owner — وصول كامل</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]" />
                  <span className="text-[11px] text-[#34d399]">نشط</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] space-y-2">
            <div className="flex items-start gap-2 rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/[0.07] px-3.5 py-3">
              <UserCheck size={14} className="text-[#fbbf24] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#c8a96e] leading-relaxed">
                قائمة المالكين ثابتة في <span className="font-mono">src/lib/owner.ts</span>. لإضافة مالك جديد أو إزالته، يجب تعديل ملف الكود المصدري ونشر التحديث.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
