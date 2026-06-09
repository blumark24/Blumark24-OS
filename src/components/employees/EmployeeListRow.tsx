"use client";

import { ChevronLeft, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";
import { departmentColor } from "@/lib/services/departments";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { isEmployeeActive, employeeStatusLabel } from "@/lib/tenant/employeeStatus";
import type { UserRole } from "@/contexts/PermissionsContext";
import type { EmployeeRow } from "@/components/employees/EmployeeMobileCard";

/**
 * Premium compact list row for the mobile "قائمة ذكية" directory view.
 * Deliberately minimal: avatar, name, status pill, public code, role/unit and a
 * details affordance. No email, action buttons, metrics or warning text — those
 * live in the details sheet. Target height ~58–76px for fast scanning.
 */
export function EmployeeListRow({
  emp,
  needsLink = false,
  departmentColorFn = departmentColor,
  onDetails,
}: {
  emp: EmployeeRow;
  needsLink?: boolean;
  departmentColorFn?: (name: string) => string;
  onDetails: () => void;
}) {
  const isActive = isEmployeeActive(emp.status);
  const deptColor = departmentColorFn(emp.department);
  const roleLabel = emp.jobTitle || getTenantRoleLabel(emp.role as UserRole);

  return (
    <button
      type="button"
      onClick={onDetails}
      className="group w-full flex items-center gap-3 rounded-xl border border-[#1e3a5f]/70 bg-[#0d1f3c]/40 px-3 py-2.5 text-right transition-all hover:border-cyan-400/30 hover:bg-[#0d1f3c]/70 active:scale-[0.99] min-h-14"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg,${deptColor},#0a1628)` }}
      >
        {emp.name.slice(0, 2)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-semibold text-[13px] truncate">{emp.name}</span>
          {needsLink ? (
            <span className="badge text-[9px] bg-amber-500/10 text-amber-300 flex items-center gap-0.5 shrink-0">
              <Unlink size={8} />
              مراجعة
            </span>
          ) : (
            <span className={cn("badge text-[9px] shrink-0", isActive ? "status-active" : "status-inactive")}>
              {employeeStatusLabel(emp.status)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0 text-[11px] text-[#8ba3c7]">
          <span className="truncate">{roleLabel}</span>
          {emp.department && (
            <>
              <span className="text-[#1e3a5f] shrink-0">·</span>
              <span
                className="truncate max-w-[40%]"
                style={{ color: deptColor }}
              >
                {emp.department}
              </span>
            </>
          )}
          {emp.publicCode && (
            <>
              <span className="text-[#1e3a5f] shrink-0">·</span>
              <span className="font-mono text-[10px] text-[#6b87ab] shrink-0" dir="ltr">{emp.publicCode}</span>
            </>
          )}
        </div>
      </div>

      <ChevronLeft
        size={16}
        className="text-[#8ba3c7] group-hover:text-cyan-300 transition-colors shrink-0"
      />
    </button>
  );
}
