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
import { LEADERSHIP_ACTION_ACCENTS } from "./leadershipActionVisual";

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
    <section className="space-y-3 min-w-0" aria-label={ORG_LEADERSHIP_ACTIONS_TITLE_AR}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h4 className="text-white text-xs font-bold tracking-wide">{ORG_LEADERSHIP_ACTIONS_TITLE_AR}</h4>
        <span className="text-[#6b87ab] text-[10px] shrink-0">معاينة تشغيلية</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
        {cards.map((card) => {
          const Icon = CARD_ICONS[card.id];
          const accent = LEADERSHIP_ACTION_ACCENTS[card.id];
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveAction(card.id)}
              className={cn(
                "group relative text-right overflow-hidden",
                "rounded-2xl border-2 p-3.5 sm:p-4 min-w-0 w-full",
                "backdrop-blur-sm transition-all duration-200 touch-manipulation min-h-[148px]",
                "flex flex-col",
                accent.cardBorder,
                accent.cardBorderHover,
                accent.cardGlow,
                accent.cardGradient,
                accent.activeRing,
                "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:content-['']",
                accent.cardHighlight,
              )}
            >
              <div className="relative flex items-start justify-between gap-2.5 min-w-0 mb-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    accent.iconWrap,
                  )}
                >
                  <Icon size={18} className={accent.iconColor} strokeWidth={2} />
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-wide",
                    accent.badge,
                  )}
                >
                  معاينة
                </span>
              </div>

              <p className="relative text-white text-[13px] sm:text-sm font-bold leading-snug break-words">
                {card.title}
              </p>
              <p className="relative text-[#8ba3c7] text-[11px] mt-2 leading-relaxed break-words line-clamp-2 flex-1">
                {card.value}
              </p>

              {card.metric ? (
                <p
                  className={cn(
                    "relative text-[11px] font-semibold mt-2.5 tabular-nums",
                    accent.metric,
                  )}
                >
                  {card.metric}
                </p>
              ) : (
                <span className="mt-2.5 block h-0" aria-hidden />
              )}

              <span
                className={cn(
                  "relative mt-3 inline-flex items-center gap-1.5 justify-end w-full",
                  "text-[11px] font-medium min-h-10 rounded-xl",
                  "border border-white/[0.06] bg-white/[0.04] px-3 py-2",
                  "group-hover:bg-white/[0.07] group-active:scale-[0.99]",
                  accent.cta,
                  accent.ctaHover,
                )}
              >
                فتح المعاينة
                <ChevronLeft size={14} className="rotate-180 shrink-0 opacity-80" />
              </span>
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
