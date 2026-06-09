"use client";

import {
  X, Star, Edit2, UserMinus, UserCheck, Unlink,
  Mail, Building2, Briefcase, CalendarDays, ListChecks, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { departmentColor } from "@/lib/services/departments";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { isEmployeeActive, employeeStatusLabel } from "@/lib/tenant/employeeStatus";
import type { UserRole } from "@/contexts/PermissionsContext";
import type { EmployeeRow } from "@/components/employees/EmployeeMobileCard";

const NEEDS_LINK_MSG = "هذا الحساب يحتاج مراجعة قبل التحكم به. يرجى التواصل مع الدعم.";
const FALLBACK = "—";

function DetailField({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#1e3a5f]/70 bg-[#0d1f3c]/40 px-3 py-2.5 min-w-0">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-cyan-500/10">
        <Icon size={13} className="text-cyan-300" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-[#8ba3c7]">{label}</div>
        <div
          className="text-[13px] font-medium text-white truncate"
          dir={ltr ? "ltr" : undefined}
          style={ltr ? { textAlign: "right" } : undefined}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight details sheet opened from the mobile "قائمة ذكية" list. Shows the
 * full read-only profile plus the same lifecycle actions as the card/table —
 * gated identically: unlinked ("يتطلب مراجعة") accounts disable every mutation
 * and surface the support message. No business logic lives here; it only calls
 * the handlers passed from the Employees page.
 */
export function EmployeeDetailsSheet({
  emp,
  canManage,
  needsLink = false,
  busy = false,
  onEdit,
  onDeactivate,
  onReactivate,
  onClose,
  departmentColorFn = departmentColor,
}: {
  emp: EmployeeRow;
  canManage: boolean;
  needsLink?: boolean;
  busy?: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onClose: () => void;
  departmentColorFn?: (name: string) => string;
}) {
  const isActive = isEmployeeActive(emp.status);
  const deptColor = departmentColorFn(emp.department);
  const roleLabel = emp.jobTitle || getTenantRoleLabel(emp.role as UserRole);
  const actionsDisabled = busy || needsLink;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0 ring-1 ring-white/10"
            style={{ background: `linear-gradient(135deg,${deptColor},#0a1628)` }}
          >
            {emp.name.slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-heading font-bold text-base truncate">{emp.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={cn("badge text-[10px]", isActive ? "status-active" : "status-inactive")}>
                {employeeStatusLabel(emp.status)}
              </span>
              {needsLink && (
                <span className="badge text-[10px] bg-amber-500/10 text-amber-300 flex items-center gap-1">
                  <Unlink size={10} />
                  يتطلب مراجعة
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white shrink-0" aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-2">
          <DetailField icon={Mail} label="البريد الإلكتروني" value={emp.email || FALLBACK} ltr />
          <div className="grid grid-cols-2 gap-2">
            <DetailField icon={Hash} label="المعرّف العام" value={emp.publicCode || FALLBACK} ltr />
            <DetailField icon={Building2} label="الوحدة التنظيمية" value={emp.department || FALLBACK} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DetailField icon={Briefcase} label="الدور الوظيفي" value={roleLabel} />
            <DetailField icon={CalendarDays} label="تاريخ الانضمام" value={emp.joinDate || FALLBACK} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <DetailField
              icon={ListChecks}
              label="المهام"
              value={
                <span>
                  {emp.completedTasks ?? 0}
                  <span className="text-[#8ba3c7] font-normal">/{emp.tasks ?? 0}</span>
                </span>
              }
            />
            <DetailField
              icon={Star}
              label="الأداء"
              value={
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={12}
                      fill={s <= (emp.performance ?? 0) ? "#fbbf24" : "none"}
                      className={s <= (emp.performance ?? 0) ? "text-amber-400" : "text-[#1e3a5f]"}
                    />
                  ))}
                </span>
              }
            />
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="space-y-2 pt-1">
            {needsLink && (
              <p className="text-[12px] text-amber-300/90 leading-relaxed rounded-xl border border-amber-400/20 bg-amber-500/[0.06] px-3 py-2.5">
                {NEEDS_LINK_MSG}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={actionsDisabled}
                title={needsLink ? NEEDS_LINK_MSG : undefined}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-11 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Edit2 size={14} />
                تعديل
              </button>
              {isActive ? (
                <button
                  type="button"
                  onClick={onDeactivate}
                  disabled={actionsDisabled}
                  title={needsLink ? NEEDS_LINK_MSG : undefined}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors min-h-11 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserMinus size={14} />
                  حذف من الفريق
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onReactivate}
                  disabled={actionsDisabled}
                  title={needsLink ? NEEDS_LINK_MSG : undefined}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-2.5 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors min-h-11 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserCheck size={14} />
                  تفعيل الموظف
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
