"use client";

import {
  ShieldCheck,
  Users,
  Lock,
  Key,
  Eye,
  ShieldHalf,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENT } from "../../_accent";
import OwnerPlaceholderCard from "../../_components/OwnerPlaceholderCard";
import { OWNER_EMAILS } from "@/lib/owner";

const OWNER_PERMISSIONS = [
  { label: "إنشاء منشآت",          scope: "owner_audit_logs",      status: "مفعّل" },
  { label: "تعديل المنشآت",         scope: "organizations",         status: "مفعّل" },
  { label: "تعليق / حذف منشأة",   scope: "organizations",         status: "مفعّل" },
  { label: "تغيير باقة منشأة",     scope: "subscriptions",         status: "مفعّل" },
  { label: "إنشاء حساب عميل",      scope: "auth.admin",            status: "مفعّل" },
  { label: "إعادة كلمة مرور",      scope: "auth.admin",            status: "مفعّل" },
  { label: "إدارة الباقات والأسعار", scope: "plans / plan_limits",  status: "مفعّل" },
  { label: "عرض سجل التدقيق",      scope: "owner_audit_logs",      status: "مفعّل" },
  { label: "إضافة مالك إضافي",     scope: "OWNER_EMAILS",          status: "يدوي" },
  { label: "إدارة الصلاحيات",      scope: "متعدد الجداول",          status: "غير مفعّل بعد" },
];

export default function OwnerRolesPageContent() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 flex-wrap">
          <ShieldCheck size={28} className="text-[#a855f7]" />
          الصلاحيات والأدوار
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          نظرة عامة على صلاحيات مالك المنصة والأدوار المتاحة — قائمة المالكين ثابتة في
          التطبيق حالياً وتتطلب تغييراً في الكود للتعديل.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OwnerPlaceholderCard
          title="حسابات المالك"
          description="عناوين البريد الإلكتروني المعتمدة كمالكين للمنصة."
          icon={Users}
          accent="purple"
          value={String(OWNER_EMAILS.length)}
          hint="OWNER_EMAILS في src/lib/owner.ts"
        />
        <OwnerPlaceholderCard
          title="الصلاحيات المفعّلة"
          description="إجمالي العمليات التي يملكها المالك حالياً."
          icon={ShieldCheck}
          accent="green"
          value={String(OWNER_PERMISSIONS.filter((p) => p.status === "مفعّل").length)}
          hint="من إجمالي صلاحيات المالك"
        />
        <OwnerPlaceholderCard
          title="أدوار إضافية"
          description="مساعدون أو مراقبون إضافيون لمركز القيادة."
          icon={UserPlus}
          accent="cyan"
          value="—"
          hint="غير مدعوم بعد — مالك واحد فقط"
        />
        <OwnerPlaceholderCard
          title="سياسة الوصول"
          description="طريقة التحقق من هوية المالك عند الدخول."
          icon={Lock}
          accent="orange"
          value="Email Gate"
          hint="تحقق بالبريد من OWNER_EMAILS"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Permissions table */}
        <section className="glass-card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Key size={17} className="text-[#a855f7]" />
              <h2 className="font-heading text-[15px] font-bold text-white">صلاحيات مالك المنصة</h2>
            </div>
            <button
              disabled
              className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2 text-[12px] text-white/40 cursor-not-allowed"
              title="إدارة الصلاحيات — غير متاحة بعد"
            >
              <ShieldCheck size={13} />
              تعديل الصلاحيات
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["الصلاحية", "النطاق / الجدول", "الحالة"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-medium text-[#5f7798]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {OWNER_PERMISSIONS.map((perm) => (
                  <tr key={perm.label} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-white">{perm.label}</td>
                    <td className="px-5 py-3.5 text-[#8ba3c7] font-mono text-[11px]">{perm.scope}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] px-2.5 py-1 rounded-full",
                          perm.status === "مفعّل"
                            ? ACCENT.green.chip
                            : perm.status === "يدوي"
                            ? ACCENT.orange.chip
                            : "bg-white/[0.06] text-white/40 border border-white/[0.10]",
                        )}
                      >
                        {perm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Owner accounts */}
        <section className="glass-card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldHalf size={17} className="text-[#a855f7]" />
            <h2 className="font-heading text-[15px] font-bold text-white">حسابات المالك</h2>
          </div>

          <ul className="space-y-2 mb-4">
            {OWNER_EMAILS.map((email) => (
              <li
                key={email}
                className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5"
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#a855f7,#1E6FD9)" }}
                >
                  {email.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[12px] text-[#8ba3c7] truncate min-w-0">{email}</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full flex-shrink-0", ACCENT.purple.chip)}>
                  مالك
                </span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] p-4 text-center">
            <Eye size={20} className="text-white/30 mx-auto mb-2" />
            <p className="text-[11px] text-[#5f7798] leading-relaxed">
              لإضافة مالك جديد، عدّل OWNER_EMAILS في
              <span className="text-[#8ba3c7] font-mono"> src/lib/owner.ts</span>
            </p>
          </div>

          <button
            disabled
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white/40 cursor-not-allowed"
          >
            <UserPlus size={14} />
            دعوة مالك إضافي
          </button>
          <p className="text-[11px] text-[#5f7798] text-center mt-1.5">غير مدعوم بعد</p>
        </section>
      </div>
    </div>
  );
}
