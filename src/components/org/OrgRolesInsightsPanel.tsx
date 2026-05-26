"use client";

import { useMemo } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks } from "@/hooks/useData";
import {
  ORG_ROLES_INSIGHTS_READONLY_AR,
  RISK_LABEL_AR,
  buildRolesIntelligence,
  type OrgRolesIntelligence,
} from "@/lib/org/buildRolesIntelligence";
import type { Employee } from "@/types";
import type { OrgStructureSnapshot } from "@/lib/org/types";

interface Props {
  employees: Employee[] | undefined;
  orgSnapshot: OrgStructureSnapshot | null | undefined;
}

function InsightStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-[#8ba3c7]">{label}</span>
      <span className="text-white font-medium tabular-nums">{value}</span>
    </div>
  );
}

function RolesInsightsBody({ intel }: { intel: OrgRolesIntelligence }) {
  const { summary, activeRoleInsights, organizationalInsights, recommendations } = intel;

  return (
    <div className="space-y-3">
      <p className="text-[#6b87ab] text-[10px] leading-relaxed">{ORG_ROLES_INSIGHTS_READONLY_AR}</p>

      <div className="space-y-1.5 rounded-xl border border-[#1e3a5f]/80 p-3 bg-[rgba(8,18,32,0.4)]">
        <InsightStat label="مدير المنشأة (نشط)" value={summary.activeByRole.organization_manager} />
        <InsightStat label="مدير مالي (نشط)" value={summary.activeByRole.finance_manager} />
        <InsightStat label="موظف (نشط)" value={summary.activeByRole.employee} />
        <InsightStat label="غير مربوطين بالهيكل" value={summary.unlinkedEmployees} />
        <InsightStat label="بدون تسمية قسم" value={summary.withoutDepartmentLabel} />
        <InsightStat label="وحدات بلا مدير" value={summary.departmentsWithoutManager} />
        <InsightStat label="فرق بلا أعضاء" value={summary.teamsWithoutMembers} />
        {summary.tasksAvailable && summary.overdueTasksOrgWide !== null && (
          <InsightStat label="مهام متأخرة (المنشأة)" value={summary.overdueTasksOrgWide} />
        )}
      </div>

      {recommendations.length > 0 && (
        <ul className="space-y-1.5">
          {recommendations.map((line) => (
            <li key={line} className="text-[#8ba3c7] text-[10px] leading-relaxed flex gap-2">
              <span className="text-[#22d3ee] shrink-0">•</span>
              {line}
            </li>
          ))}
        </ul>
      )}

      {activeRoleInsights.map((row) => (
        <div
          key={row.roleSlug}
          className="rounded-xl border border-[#1e3a5f]/80 p-3 space-y-1"
          style={{ borderRightWidth: 3, borderRightColor: "#1e6fd9" }}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-white text-xs font-semibold">{row.roleName}</span>
            <span className="text-[#6b87ab] text-[10px] shrink-0">دور فعلي</span>
          </div>
          <p className="text-[#8ba3c7] text-[10px]">الحاملون: {row.assignedCount}</p>
          {intel.summary.tasksAvailable && row.taskLoad !== null && (
            <p className="text-[#8ba3c7] text-[10px]">
              مهام مفتوحة: {row.taskLoad}
              {row.overdueCount !== null && row.overdueCount > 0
                ? ` · متأخرة: ${row.overdueCount}`
                : ""}
              {row.completionRate !== null
                ? ` · إنجاز: ${Math.round(row.completionRate * 100)}%`
                : ""}
            </p>
          )}
          <p className="text-[#6b87ab] text-[10px]">
            المخاطر: <span className="text-[#8ba3c7]">{RISK_LABEL_AR[row.riskLevel]}</span>
          </p>
          <p className="text-[#6b87ab] text-[10px] leading-relaxed">{row.recommendation}</p>
        </div>
      ))}

      <div className="space-y-1.5 pt-2 border-t border-[#1e3a5f]/50">
        <p className="text-[#6b87ab] text-[10px]">مسميات تنظيمية (قراءة فقط):</p>
        {organizationalInsights.map((row) => (
          <div
            key={row.title}
            className="flex flex-col gap-0.5 text-[10px] rounded-lg px-2 py-1.5 bg-white/[0.02]"
          >
            <div className="flex justify-between gap-2">
              <span className="text-[#8ba3c7]">{row.title}</span>
              <span className="text-[#6b87ab] shrink-0">مسمى تنظيمي</span>
            </div>
            <span className="text-[#6b87ab]">
              وحدات: {row.structureCount} · مرتبطون بالهيكل: {row.linkedEmployees}
            </span>
            <span className="text-[#6b87ab]">{row.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrgRolesInsightsPanel({ employees, orgSnapshot }: Props) {
  const { managedUsers } = usePermissions();
  const { data: tasks, error: tasksError } = useTasks();

  const intel = useMemo(() => {
    const employeeRows = (employees ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      role: String(e.role),
      department: String(e.department ?? ""),
      status: String(e.status),
    }));

    const profiles =
      managedUsers.length > 0
        ? managedUsers.map((u) => ({
            userId: u.userId,
            name: u.name,
            role: u.role,
            isActive: u.isActive,
          }))
        : null;

    return buildRolesIntelligence({
      employees: employeeRows,
      managedProfiles: profiles,
      orgSnapshot: orgSnapshot ?? null,
      tasks: tasksError ? null : (tasks ?? []),
      tasksAvailable: !tasksError && tasks !== undefined,
    });
  }, [employees, managedUsers, orgSnapshot, tasks, tasksError]);

  return (
    <div
      className="rounded-2xl border border-[#1e3a5f] p-4 space-y-3 max-h-[420px] overflow-y-auto"
      style={{ background: "rgba(10,22,40,0.75)" }}
    >
      <h3 className="text-white text-sm font-bold">متابعة الأدوار</h3>
      <RolesInsightsBody intel={intel} />
    </div>
  );
}
