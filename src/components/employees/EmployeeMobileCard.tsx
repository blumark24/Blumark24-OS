"use client";

import { Star, Edit2, UserMinus, UserCheck, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { departmentColor } from "@/lib/services/departments";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { isEmployeeActive, employeeStatusLabel } from "@/lib/tenant/employeeStatus";
import { WS_CARD } from "@/components/ui/workspaceVisual";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import type { UserRole } from "@/contexts/PermissionsContext";

const NEEDS_LINK_MSG = "هذا الحساب يحتاج مراجعة قبل التحكم به. يرجى التواصل مع الدعم.";

export interface EmployeeRow {
  id: string;
  name: string;
  email?: string;
  department: string;
  role: string;
  jobTitle?: string;
  performance?: number;
  completedTasks?: number;
  tasks?: number;
  joinDate?: string;
  status: string;
  publicCode?: string;
}

export function EmployeeMobileCard({
  emp,
  canManage,
  onEdit,
  onDeactivate,
  onReactivate,
  busy = false,
  needsLink = false,
  departmentColorFn = departmentColor,
}: {
  emp: EmployeeRow;
  canManage: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  busy?: boolean;
  /** Employee has no matching profile (by id) in this org — actions disabled. */
  needsLink?: boolean;
  departmentColorFn?: (name: string) => string;
}) {
  const isActive = isEmployeeActive(emp.status);
  const deptColor = departmentColorFn(emp.department);
  // Broken/unlinked records can never be safely mutated — disable all actions.
  const actionsDisabled = busy || needsLink;

  return (
    <article className={cn(WS_CARD, "p-3 space-y-2 min-w-0")}>
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-white/10"
          style={{ background: `linear-gradient(135deg,${deptColor},#0a1628)` }}
        >
          {emp.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          {/* Name + status badge on one line */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-white font-semibold text-sm truncate flex-1 min-w-0">{emp.name}</div>
            <span className={cn("badge text-[10px] shrink-0", isActive ? "status-active" : "status-inactive")}>
              {employeeStatusLabel(emp.status)}
            </span>
            {needsLink && (
              <span className="badge text-[10px] bg-amber-500/10 text-amber-300 flex items-center gap-0.5 shrink-0">
                <Unlink size={9} />
                مراجعة
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#8ba3c7] truncate mt-0.5">{emp.email}</div>
          <div className="mt-1">
            <PublicCodeBadge code={emp.publicCode} />
          </div>
          {/* Tags + folded secondary stats */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className="badge text-[10px] max-w-full truncate"
              style={{ background: `${deptColor}20`, color: deptColor }}
            >
              {emp.department}
            </span>
            <span className="badge text-[10px] bg-white/[0.06] text-[#8ba3c7]">
              {emp.jobTitle || getTenantRoleLabel(emp.role as UserRole)}
            </span>
            <span className="badge text-[10px] bg-white/[0.06] text-[#8ba3c7] flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={8}
                  fill={s <= (emp.performance ?? 0) ? "#fbbf24" : "none"}
                  className={s <= (emp.performance ?? 0) ? "text-amber-400" : "text-[#1e3a5f]"}
                />
              ))}
            </span>
            <span className="badge text-[10px] bg-white/[0.06] text-[#8ba3c7]">
              {emp.completedTasks ?? 0}/{emp.tasks ?? 0}
            </span>
            {emp.joinDate && (
              <span className="badge text-[10px] bg-white/[0.06] text-[#8ba3c7]">{emp.joinDate}</span>
            )}
          </div>
        </div>
      </div>

      {canManage && (
        <>
          {needsLink && (
            <p className="text-[11px] text-amber-300/90 leading-relaxed">{NEEDS_LINK_MSG}</p>
          )}
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onEdit}
              disabled={actionsDisabled}
              title={needsLink ? NEEDS_LINK_MSG : undefined}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-10 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors min-h-10 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors min-h-10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserCheck size={14} />
                تفعيل الموظف
              </button>
            )}
          </div>
        </>
      )}
    </article>
  );
}
