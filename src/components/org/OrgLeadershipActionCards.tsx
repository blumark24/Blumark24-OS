"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  UserCog,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useData";
import type { Employee, Task } from "@/types";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { LeadershipStudioPreview } from "@/lib/org/buildLeadershipStudio";
import {
  ORG_LEADERSHIP_ACTIONS_TITLE_AR,
  buildActionCardDefinitions,
  type LeadershipActionId,
} from "@/lib/org/buildLeadershipActionPreviews";
import type { EmployeeRow } from "@/lib/org/buildRolesIntelligence";
import type { OrgStructureSnapshot } from "@/lib/org/types";
import {
  OrgLeadershipActionModals,
  type LeadershipActionContext,
} from "./OrgLeadershipActionModals";

const CARD_ICONS: Record<LeadershipActionId, typeof UserCog> = {
  transfer_employee: ArrowLeftRight,
  assign_responsible: UserCog,
  distribute_tasks: ClipboardList,
  performance_review: BarChart3,
};

interface Props {
  studio: LeadershipStudioPreview;
  employees: Employee[] | undefined;
  orgSnapshot: OrgStructureSnapshot | null | undefined;
  tasks: Task[];
  tasksAvailable: boolean;
  plan: PlanSlug;
}

export function OrgLeadershipActionCards({
  studio,
  employees,
  orgSnapshot,
  tasks,
  tasksAvailable,
  plan,
}: Props) {
  const [activeAction, setActiveAction] = useState<LeadershipActionId | null>(null);
  const { data: clients } = useClients();

  const employeeRows = useMemo(
    (): EmployeeRow[] =>
      (employees ?? []).map((e) => ({
        id: e.id,
        name: e.name || e.email || "موظف",
        role: String(e.role),
        department: String(e.department ?? ""),
        status: String(e.status),
      })),
    [employees],
  );

  const cards = useMemo(
    () =>
      buildActionCardDefinitions({
        unlinkedEmployees: studio.intel.summary.unlinkedEmployees,
        departmentsWithoutManager: studio.intel.summary.departmentsWithoutManager,
        openTasksOrgWide: studio.intel.summary.openTasksOrgWide,
        overdueTasksOrgWide: studio.intel.summary.overdueTasksOrgWide,
        tasksAvailable,
        activeEmployees: studio.intel.summary.totalActiveEmployees,
      }),
    [studio.intel.summary, tasksAvailable],
  );

  const actionCtx: LeadershipActionContext = useMemo(
    () => ({
      studio,
      employeeRows,
      orgSnapshot: orgSnapshot ?? null,
      tasks,
      tasksAvailable,
      clients,
      plan,
    }),
    [studio, employeeRows, orgSnapshot, tasks, tasksAvailable, clients, plan],
  );

  return (
    <section className="space-y-2 min-w-0" aria-label={ORG_LEADERSHIP_ACTIONS_TITLE_AR}>
      <h4 className="text-white text-xs font-bold">{ORG_LEADERSHIP_ACTIONS_TITLE_AR}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
        {cards.map((card) => {
          const Icon = CARD_ICONS[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveAction(card.id)}
              className={cn(
                "group text-right rounded-xl border border-[#1e3a5f]/80 p-3 min-w-0 w-full",
                "bg-gradient-to-br from-white/[0.05] to-transparent",
                "hover:border-[#22d3ee]/35 hover:bg-[#22d3ee]/5 transition-all touch-manipulation",
              )}
              style={{ background: "rgba(10,22,40,0.65)" }}
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/25">
                  <Icon size={15} className="text-[#22d3ee]" />
                </div>
                <span className="shrink-0 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-200">
                  معاينة
                </span>
              </div>
              <p className="text-white text-xs font-semibold mt-2 break-words">{card.title}</p>
              <p className="text-[#6b87ab] text-[10px] mt-1 leading-relaxed break-words line-clamp-2">
                {card.value}
              </p>
              {card.metric ? (
                <p className="text-[#22d3ee] text-[10px] mt-1.5 tabular-nums">{card.metric}</p>
              ) : null}
              <p className="text-[#8ba3c7] text-[10px] mt-2 flex items-center gap-1 justify-end group-hover:text-[#22d3ee]">
                فتح المعاينة
                <ChevronLeft size={12} className="rotate-180" />
              </p>
            </button>
          );
        })}
      </div>

      <OrgLeadershipActionModals
        activeAction={activeAction}
        onClose={() => setActiveAction(null)}
        ctx={actionCtx}
      />
    </section>
  );
}
