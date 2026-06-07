"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  User, Mail, ShieldCheck, Building2, Briefcase, Network,
  UserCog, Phone, CalendarDays, Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getTenantRoleLabel, formatTenantDepartment } from "@/lib/tenant/tenantDisplay";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";

const FALLBACK = "غير محدد";

function Field({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#1e3a5f] bg-[#0d1f3c]/40 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-cyan-500/10">
        <Icon size={15} className="text-cyan-300" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] text-[#8ba3c7]">{label}</div>
        <div className={`text-sm font-medium truncate ${muted ? "text-white/40 italic" : "text-white"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  // Scoped to the CURRENT authenticated user only — never another profile.
  const { user } = useAuth();
  const { name: companyName, isFallback: companyIsFallback } = useTenantCompanyName();
  const { display: departmentDisplay } = useProfileOrgDepartment();

  const roleLabel = user?.role ? getTenantRoleLabel(user.role) : FALLBACK;
  const department = departmentDisplay.isEmpty ? FALLBACK : departmentDisplay.text;
  const initials = user?.name?.slice(0, 2) ?? "م";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Identity header */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0 ring-1 ring-white/10"
              style={{ background: "linear-gradient(135deg,#ff7a3d,#ff5722)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-heading font-bold text-white truncate">{user?.name ?? FALLBACK}</h1>
              <p className="text-[#8ba3c7] text-sm truncate">{user?.email ?? FALLBACK}</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] text-cyan-200">
                <ShieldCheck size={11} />
                {roleLabel}
              </span>
            </div>
            <Link
              href="/settings?tab=account"
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 shrink-0"
            >
              <Pencil size={12} />
              تعديل
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-white font-medium text-lg flex items-center gap-2">
            <User size={18} className="text-[#22d3ee]" />
            بيانات الملف الشخصي
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={User} label="الاسم" value={user?.name ?? FALLBACK} muted={!user?.name} />
            <Field icon={Mail} label="البريد الإلكتروني" value={user?.email ?? FALLBACK} muted={!user?.email} />
            <Field icon={ShieldCheck} label="الدور" value={roleLabel} />
            <Field icon={Briefcase} label="المسمى الوظيفي" value={department !== FALLBACK ? department : FALLBACK} muted={department === FALLBACK} />
            <Field icon={Building2} label="المنشأة" value={companyName} muted={companyIsFallback} />
            <Field icon={Network} label="الإدارة / القسم" value={department} muted={department === FALLBACK} />
            <Field icon={UserCog} label="المدير المباشر" value={FALLBACK} muted />
            <Field icon={Phone} label="الهاتف" value={FALLBACK} muted />
            <Field icon={CalendarDays} label="تاريخ الانضمام" value={FALLBACK} muted />
          </div>
          <p className="text-[11px] text-[#8ba3c7]">
            الهيكل التنظيمي: وكالة ← إدارة ← قسم. تُحدَّث المسميات تلقائياً عند تغيير موقعك في الهيكل الإداري.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
