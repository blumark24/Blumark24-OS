"use client";

import { useMemo } from "react";
import { Brain } from "lucide-react";
import { MOBILE_BOTTOM_NAV_INSET } from "@/components/layout/MobileBottomNav";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTasks } from "@/hooks/useData";
import type { Employee } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import {
  ORG_LEADERSHIP_STUDIO_HELPER_AR,
  ORG_LEADERSHIP_STUDIO_TITLE_AR,
  buildLeadershipStudioPreview,
} from "@/lib/org/buildLeadershipStudio";
import { OrgLeadershipActionCards } from "./OrgLeadershipActionCards";
import { OrgExecutiveReading } from "./OrgExecutiveReading";

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

      <OrgExecutiveReading studio={studio} plan={plan} />
    </div>
  );
}
