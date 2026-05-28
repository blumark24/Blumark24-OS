"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Compass,
  Map,
} from "lucide-react";
import { MOBILE_BOTTOM_NAV_INSET } from "@/components/layout/MobileBottomNav";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks } from "@/hooks/useData";
import type { Employee } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import {
  ORG_LEADERSHIP_STUDIO_HELPER_AR,
  ORG_LEADERSHIP_STUDIO_TITLE_AR,
  RISK_LABEL_AR,
  buildLeadershipStudioPreview,
} from "@/lib/org/buildLeadershipStudio";
import type { LeadershipGap } from "@/lib/org/buildRolesIntelligence";
import { OrgLeadershipActionCards } from "./OrgLeadershipActionCards";

function riskBadgeClass(level: "low" | "medium" | "high"): string {
  if (level === "high") return "border-red-400/35 text-red-200 bg-red-500/10";
  if (level === "medium") return "border-amber-400/35 text-amber-200 bg-amber-500/10";
  return "border-cyan-400/30 text-cyan-200 bg-cyan-500/10";
}

interface OrgLeadershipStudioProps {
  employees: Employee[] | undefined;
  orgSnapshot: OrgStructureSnapshot | null | undefined;
  plan: PlanSlug;
}

export default function OrgLeadershipStudio({
  employees,
  orgSnapshot,
  plan,
}: OrgLeadershipStudioProps) {
  const { managedUsers } = usePermissions();
  const { data: tasks, error: tasksError } = useTasks();
  const tasksAvailable = !tasksError && tasks !== undefined;
  const taskList = tasksError ? [] : (tasks ?? []);

  const studio = useMemo(() => {
    const employeeRows = (employees ?? []).map((e) => ({
      id: e.id,
      name: e.name || e.email || "موظف",
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

    return buildLeadershipStudioPreview({
      employees: employeeRows,
      managedProfiles: profiles,
      orgSnapshot: orgSnapshot ?? null,
      tasks: tasksError ? null : (tasks ?? []),
      tasksAvailable,
      plan,
    });
  }, [employees, managedUsers, orgSnapshot, tasks, tasksError, plan, tasksAvailable]);

  const { intel } = studio;

  const structureGaps = useMemo((): LeadershipGap[] => {
    const gaps = [...intel.leadershipGaps];
    if (
      intel.summary.tasksAvailable &&
      intel.summary.overdueTasksOrgWide !== null &&
      intel.summary.overdueTasksOrgWide > 0
    ) {
      gaps.push({
        id: "overdue-tasks",
        label: "مهام متأخرة",
        count: intel.summary.overdueTasksOrgWide,
      });
    }
    return gaps;
  }, [intel.leadershipGaps, intel.summary]);

  const orgHealthScore = useMemo(() => {
    if (studio.healthByEmployee.length === 0) return null;
    const sum = studio.healthByEmployee.reduce((a, r) => a + r.score, 0);
    return Math.round(sum / studio.healthByEmployee.length);
  }, [studio.healthByEmployee]);

  const panelClass =
    "rounded-xl border border-[#1e3a5f]/80 p-2.5 sm:p-3 space-y-2 min-w-0 max-w-full";
  const panelBg = { background: "rgba(10,22,40,0.55)" } as const;

  return (
    <div
      className={`rounded-2xl border border-[#1e3a5f] p-3 sm:p-4 space-y-3 max-h-none xl:max-h-[min(78vh,760px)] overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0 w-full ${MOBILE_BOTTOM_NAV_INSET}`}
      style={{
        background:
          "linear-gradient(180deg, rgba(10,22,40,0.9) 0%, rgba(8,18,32,0.94) 100%)",
      }}
      dir="rtl"
      aria-label={ORG_LEADERSHIP_STUDIO_TITLE_AR}
    >
      <header className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Brain size={16} className="text-[#22d3ee] shrink-0" />
          <h3 className="text-white text-sm font-bold truncate">{ORG_LEADERSHIP_STUDIO_TITLE_AR}</h3>
        </div>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed break-words">
          {ORG_LEADERSHIP_STUDIO_HELPER_AR}
        </p>
        <p className="text-[#8ba3c7] text-[10px] break-words">
          {studio.packageTierLabel}
          {studio.packageStructureHint ? ` · ${studio.packageStructureHint}` : ""}
        </p>
      </header>

      <OrgLeadershipActionCards
        studio={studio}
        employees={employees}
        orgSnapshot={orgSnapshot}
        tasks={taskList}
        tasksAvailable={tasksAvailable}
        plan={plan}
      />

      <p className="text-[#6b87ab] text-[10px] -mt-1">قراءة تنفيذية</p>

      <article
        className={panelClass}
        style={{ ...panelBg, borderColor: "rgba(245,158,11,0.35)" }}
      >
        <div className="flex items-center gap-2">
          <Compass size={14} className="text-amber-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">قرار اليوم</h4>
        </div>
        <p className="text-[#b8cce8] text-[11px] leading-relaxed break-words">
          {intel.primaryAction.body}
        </p>
      </article>

      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <Map size={14} className="text-sky-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">خريطة القيادة</h4>
        </div>
        {studio.mapRows.length === 0 ? (
          <p className="text-[#6b87ab] text-[10px]">لا توجد قيادات مرتبطة بالهيكل بعد.</p>
        ) : (
          <ul className="space-y-1.5 max-h-36 sm:max-h-40 overflow-y-auto overflow-x-hidden">
            {studio.mapRows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-[#1e3a5f]/60 px-2 py-1.5 bg-white/[0.02] min-w-0"
              >
                <p className="text-white text-[11px] font-medium break-words">{row.title}</p>
                <p className="text-[#8ba3c7] text-[10px] mt-0.5 break-words">{row.subtitle}</p>
                <p className="text-[#6b87ab] text-[10px] break-words">{row.meta}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className={panelClass} style={panelBg}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-emerald-300 shrink-0" />
            <h4 className="text-white text-xs font-bold">صحة القيادة</h4>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {orgHealthScore !== null && (
              <span className="rounded-full border border-[#1e3a5f] bg-black/20 px-2 py-0.5 text-[10px] text-white tabular-nums">
                مؤشر {orgHealthScore}
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${riskBadgeClass(intel.leadershipPulse.orgRiskLevel)}`}
            >
              {RISK_LABEL_AR[intel.leadershipPulse.orgRiskLevel]}
            </span>
          </div>
        </div>
        <p className="text-[#6b87ab] text-[10px] leading-relaxed break-words">
          {intel.leadershipPulse.todayInsight}
        </p>
        {studio.healthByEmployee.length === 0 ? (
          <p className="text-[#6b87ab] text-[10px]">لا يوجد موظفون نشطون لحساب الصحة.</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {studio.healthByEmployee.slice(0, 8).map((row) => (
              <div
                key={row.employeeId}
                className="rounded-lg border border-[#1e3a5f]/50 px-2 py-1.5 bg-black/15 min-w-0"
              >
                <p className="text-[#b8cce8] text-[10px] truncate" title={row.name}>
                  {row.name}
                </p>
                <span
                  className={`inline-block mt-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${riskBadgeClass(row.riskLevel)}`}
                >
                  {RISK_LABEL_AR[row.riskLevel]} · {row.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className={panelClass} style={panelBg}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-300 shrink-0" />
          <h4 className="text-white text-xs font-bold">فجوات الهيكل</h4>
        </div>
        {structureGaps.length === 0 ? (
          <p className="text-[#6b87ab] text-[10px]">لا فجوات حرجة ظاهرة في القراءة الحالية.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {structureGaps.map((gap) => (
              <span
                key={gap.id}
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100 max-w-full"
              >
                <span className="truncate">{gap.label}</span>
                <span className="tabular-nums font-semibold shrink-0">{gap.count}</span>
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
