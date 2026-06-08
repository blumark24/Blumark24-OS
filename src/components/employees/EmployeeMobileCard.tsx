"use client";

import { Star, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { departmentColor } from "@/lib/services/departments";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { WS_CARD } from "@/components/ui/workspaceVisual";
import { PublicCodeBadge } from "@/components/ui/PublicCodeBadge";
import type { UserRole } from "@/contexts/PermissionsContext";

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
  onDelete,
  departmentColorFn = departmentColor,
}: {
  emp: EmployeeRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  departmentColorFn?: (name: string) => string;
}) {
  const isActive = emp.status === "نشط";
  const deptColor = departmentColorFn(emp.department);

  return (
    <article className={cn(WS_CARD, "p-3.5 space-y-3 min-w-0")}>
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-white/10"
          style={{ background: `linear-gradient(135deg,${deptColor},#0a1628)` }}
        >
          {emp.name.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white font-semibold text-sm truncate">{emp.name}</div>
          <div className="text-[11px] text-[#8ba3c7] truncate mt-0.5">{emp.email}</div>
          <div className="mt-1">
            <PublicCodeBadge code={emp.publicCode} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="badge text-[10px] max-w-full truncate"
              style={{
                background: `${deptColor}20`,
                color: deptColor,
              }}
            >
              {emp.department}
            </span>
            <span className="badge text-[10px] bg-white/[0.06] text-[#8ba3c7]">
              {emp.jobTitle || getTenantRoleLabel(emp.role as UserRole)}
            </span>
          </div>
        </div>
        <span className={cn("badge text-[10px] shrink-0", isActive ? "status-active" : "status-inactive")}>
          {isActive ? "نشط" : "غير نشط"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
          <div className="flex justify-center gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={10}
                fill={s <= (emp.performance ?? 0) ? "#fbbf24" : "none"}
                className={s <= (emp.performance ?? 0) ? "text-amber-400" : "text-[#1e3a5f]"}
              />
            ))}
          </div>
          <div className="text-[10px] text-[#8ba3c7]">الأداء</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2">
          <div className="text-sm font-bold text-white">
            {emp.completedTasks ?? 0}
            <span className="text-[#8ba3c7] font-normal">/{emp.tasks ?? 0}</span>
          </div>
          <div className="text-[10px] text-[#8ba3c7]">المهام</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2 min-w-0">
          <div className="text-[11px] font-medium text-white truncate">{emp.joinDate ?? "—"}</div>
          <div className="text-[10px] text-[#8ba3c7]">الانضمام</div>
        </div>
      </div>

      {canManage && (
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 text-xs text-[#8ba3c7] hover:text-cyan-300 transition-colors min-h-10"
          >
            <Edit2 size={14} />
            تعديل
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors min-h-10"
          >
            <Trash2 size={14} />
            حذف
          </button>
        </div>
      )}
    </article>
  );
}
