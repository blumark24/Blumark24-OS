import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { Task } from "@/types";
import {
  buildRolesIntelligence,
  RISK_LABEL_AR,
  type EmployeeRow,
  type OrgRolesIntelligence,
  type ProfileRow,
  type RiskLevel,
} from "./buildRolesIntelligence";
import { allowedStructureLevels, getLevelFromDepartment, STRUCTURE_LEVEL_LABELS } from "./packageHierarchy";
import type { OrgStructureSnapshot, StructureLevel } from "./types";

export const ORG_LEADERSHIP_STUDIO_TITLE_AR = "استوديو القيادة الذكي";

export const ORG_LEADERSHIP_STUDIO_HELPER_AR =
  "مساحة تشغيلية تربط القيادة بالهيكل والموظفين والمهام، وتعرض قرارات وتقييمات مبدئية بدون تغيير صلاحيات الدخول.";

export const ORG_ASSIGNMENT_ORG_ONLY_AR =
  "هذه مسؤوليات تنظيمية وليست صلاحيات دخول.";

export const ORGANIZATIONAL_RESPONSIBILITIES = [
  "رئيس قسم",
  "مدير إدارة",
  "مدير وكالة",
  "مسؤول فريق",
] as const;

export const TRACKING_GOALS = [
  "ضبط الهيكل",
  "تقليل التأخير",
  "رفع الإنتاجية",
  "متابعة العملاء",
  "تحسين الالتزام",
] as const;

export const TRANSFER_MODES = [
  { id: "role_only", label: "نقل المسؤولية فقط" },
  { id: "role_plus_open_tasks", label: "المسؤولية + المهام المفتوحة" },
  { id: "role_plus_team", label: "المسؤولية + قيادة الفريق" },
] as const;

export type OrganizationalResponsibility = (typeof ORGANIZATIONAL_RESPONSIBILITIES)[number];

/** Package-aware labels only — does not change access. */
export function organizationalResponsibilitiesForPlan(
  plan: PlanSlug,
): readonly OrganizationalResponsibility[] {
  switch (plan) {
    case "advanced":
      return ORGANIZATIONAL_RESPONSIBILITIES;
    case "growth":
      return ["رئيس قسم", "مدير إدارة", "مسؤول فريق"];
    default:
      return ["رئيس قسم", "مسؤول فريق"];
  }
}

export type LeadershipMapRow = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
};

export type EmployeeHealthPreview = {
  employeeId: string;
  name: string;
  score: number;
  riskLevel: RiskLevel;
  openTasks: number;
  overdueTasks: number;
  linked: boolean;
};

export type ScopeOption = {
  id: string;
  label: string;
  kind: "department" | "team";
};

export type LeadershipStudioPreview = {
  intel: OrgRolesIntelligence;
  packageTierLabel: string;
  packageStructureHint: string;
  mapRows: LeadershipMapRow[];
  employeeOptions: { id: string; name: string }[];
  scopeOptions: ScopeOption[];
  healthByEmployee: EmployeeHealthPreview[];
  orgAvgOpenTasks: number;
};

const COMPLETED_STATUS = "مكتملة";
const OVERDUE_STATUS = "متأخرة";

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function isTaskCompleted(task: Task): boolean {
  return task.status === COMPLETED_STATUS;
}

function isTaskOverdue(task: Task, today: string): boolean {
  if (isTaskCompleted(task)) return false;
  if (task.status === OVERDUE_STATUS) return true;
  const due = String(task.dueDate ?? "").slice(0, 10);
  return Boolean(due && due < today);
}

function taskMetricsForEmployee(
  tasks: Task[],
  employeeId: string,
  today: string,
): { open: number; overdue: number; completionRate: number | null; total: number } {
  const relevant = tasks.filter((t) => String(t.assigneeId ?? "").trim() === employeeId);
  if (relevant.length === 0) {
    return { open: 0, overdue: 0, completionRate: null, total: 0 };
  }
  const completed = relevant.filter(isTaskCompleted).length;
  const open = relevant.filter((t) => !isTaskCompleted(t)).length;
  const overdue = relevant.filter((t) => isTaskOverdue(t, today)).length;
  return {
    open,
    overdue,
    completionRate: completed / relevant.length,
    total: relevant.length,
  };
}

function riskFromHealthScore(score: number): RiskLevel {
  if (score < 50) return "high";
  if (score < 75) return "medium";
  return "low";
}

export function computeEmployeeHealthScore(input: {
  employeeId: string;
  linked: boolean;
  hasTeam: boolean;
  openTasks: number;
  overdueTasks: number;
  completionRate: number | null;
  orgAvgOpen: number;
}): number {
  const completionRate = input.completionRate ?? 0.5;
  const overdueRatio =
    input.openTasks > 0 ? input.overdueTasks / input.openTasks : 0;
  const linkScore = input.linked ? 1 : 0;
  const scopeScore = input.linked ? (input.hasTeam ? 1 : 0.7) : 0;
  const balanceScore =
    input.orgAvgOpen > 0
      ? 1 - Math.min(1, input.openTasks / input.orgAvgOpen)
      : input.openTasks === 0
        ? 1
        : 0.5;

  const raw =
    30 * completionRate +
    25 * (1 - overdueRatio) +
    20 * linkScore +
    10 * scopeScore +
    10 * balanceScore +
    5 * 0.5;

  return Math.max(0, Math.min(100, Math.round(raw)));
}

function packageStudioCopy(plan: PlanSlug): { tierLabel: string; structureHint: string } {
  switch (plan) {
    case "advanced":
      return {
        tierLabel: "باقة متقدم",
        structureHint: "وكالة · إدارة · قسم · فريق",
      };
    case "growth":
      return {
        tierLabel: "باقة نمو",
        structureHint: "إدارة · قسم · فريق",
      };
    default:
      return {
        tierLabel: "باقة بسيط",
        structureHint: "قسم · فريق — عرض قيادي مبسّط",
      };
  }
}

function nameForId(
  id: string | null | undefined,
  employees: EmployeeRow[],
  profiles: ProfileRow[],
): string | null {
  if (!id) return null;
  const e = employees.find((x) => x.id === id);
  if (e) return e.name;
  const p = profiles.find((x) => x.userId === id);
  return p?.name ?? null;
}

function buildScopeOptions(
  snapshot: OrgStructureSnapshot | null,
  plan: PlanSlug,
): ScopeOption[] {
  if (!snapshot) return [];
  const levels = new Set(allowedStructureLevels(plan));
  const opts: ScopeOption[] = [];

  for (const d of snapshot.departments) {
    const level = getLevelFromDepartment(d);
    if (!levels.has(level)) continue;
    opts.push({
      id: `dept-${d.id}`,
      label: `${d.name} (${STRUCTURE_LEVEL_LABELS[level]})`,
      kind: "department",
    });
  }
  for (const t of snapshot.teams) {
    const dept = snapshot.departments.find((d) => d.id === t.department_id);
    if (dept && !levels.has(getLevelFromDepartment(dept))) continue;
    opts.push({
      id: `team-${t.id}`,
      label: `فريق ${t.name}${dept ? ` · ${dept.name}` : ""}`,
      kind: "team",
    });
  }
  return opts.sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

function buildLeadershipMapRows(
  snapshot: OrgStructureSnapshot | null,
  employees: EmployeeRow[],
  profiles: ProfileRow[],
  intel: OrgRolesIntelligence,
  plan: PlanSlug,
): LeadershipMapRow[] {
  const rows: LeadershipMapRow[] = [];
  const levels = allowedStructureLevels(plan);

  if (intel.summary.activeByRole.organization_manager > 0) {
    rows.push({
      id: "rbac-org-mgr",
      title: "مدير المنشأة (دور دخول)",
      subtitle: `${intel.summary.activeByRole.organization_manager} حامل${intel.summary.activeByRole.organization_manager === 1 ? "" : "ون"}`,
      meta: "صلاحيات تشغيل المنشأة",
    });
  }
  if (intel.summary.activeByRole.finance_manager > 0) {
    rows.push({
      id: "rbac-fin",
      title: "مدير مالي (دور دخول)",
      subtitle: `${intel.summary.activeByRole.finance_manager} حامل`,
      meta: "متابعة مالية",
    });
  }

  if (!snapshot) return rows;

  const levelOrder: StructureLevel[] = ["agency", "management", "department"];
  for (const level of levelOrder) {
    if (!levels.includes(level)) continue;
    const units = snapshot.departments.filter((d) => getLevelFromDepartment(d) === level);
    for (const dept of units) {
      const rels = snapshot.relations.filter((r) => r.department_id === dept.id);
      const mgr = nameForId(dept.manager_id, employees, profiles);
      rows.push({
        id: `dept-${dept.id}`,
        title: dept.name,
        subtitle: `${STRUCTURE_LEVEL_LABELS[level]} · ${rels.length} مرتبط`,
        meta: mgr ? `مسؤول مسجّل: ${mgr}` : "بدون مسؤول في السجل",
      });
    }
  }

  for (const team of snapshot.teams) {
    const dept = snapshot.departments.find((d) => d.id === team.department_id);
    const deptLevel = dept ? getLevelFromDepartment(dept) : "department";
    if (dept && !levels.includes(deptLevel)) continue;
    const members = snapshot.relations.filter((r) => r.team_id === team.id).length;
    const leader = nameForId(team.leader_id, employees, profiles);
    rows.push({
      id: `team-${team.id}`,
      title: `فريق ${team.name}`,
      subtitle: dept ? `تابع لـ ${dept.name}` : "—",
      meta: leader
        ? `قائد الفريق: ${leader} · ${members} عضو`
        : `${members} عضو · بدون قائد`,
    });
  }

  return rows.slice(0, 24);
}

function buildHealthPreviews(
  employees: EmployeeRow[],
  snapshot: OrgStructureSnapshot | null,
  tasks: Task[],
  tasksAvailable: boolean,
): { health: EmployeeHealthPreview[]; orgAvgOpen: number } {
  const today = todayIsoDate();
  const active = employees.filter((e) => e.status === "نشط");
  const openCounts: number[] = [];

  const health = active.map((e) => {
    const rel = snapshot?.relations.find((r) => r.employee_id === e.id);
    const linked = Boolean(rel);
    const hasTeam = Boolean(rel?.team_id);
    const m = tasksAvailable
      ? taskMetricsForEmployee(tasks, e.id, today)
      : { open: 0, overdue: 0, completionRate: null, total: 0 };
    if (m.open > 0) openCounts.push(m.open);
    return { employee: e, linked, hasTeam, m };
  });

  const orgAvgOpen =
    openCounts.length > 0
      ? openCounts.reduce((a, b) => a + b, 0) / openCounts.length
      : 0;

  const previews: EmployeeHealthPreview[] = health.map(({ employee, linked, hasTeam, m }) => {
    const score = computeEmployeeHealthScore({
      employeeId: employee.id,
      linked,
      hasTeam,
      openTasks: m.open,
      overdueTasks: m.overdue,
      completionRate: m.completionRate,
      orgAvgOpen,
    });
    return {
      employeeId: employee.id,
      name: employee.name,
      score,
      riskLevel: riskFromHealthScore(score),
      openTasks: m.open,
      overdueTasks: m.overdue,
      linked,
    };
  });

  return {
    health: previews.sort((a, b) => a.score - b.score),
    orgAvgOpen,
  };
}

export function buildAssignmentPreviewSentence(
  employeeName: string,
  responsibility: string,
  scopeLabel: string,
  goal: string,
): string {
  return `معاينة: تعيين ${employeeName} كـ «${responsibility}» ضمن ${scopeLabel} بهدف ${goal} — دون حفظ أو تغيير صلاحيات.`;
}

export function buildTransferImpactPreview(input: {
  fromEmployeeId: string;
  toEmployeeId: string;
  mode: string;
  employees: EmployeeRow[];
  snapshot: OrgStructureSnapshot | null;
  tasks: Task[];
  tasksAvailable: boolean;
}): { openTasks: number; teamsCount: number; summary: string } {
  const from = input.employees.find((e) => e.id === input.fromEmployeeId);
  const to = input.employees.find((e) => e.id === input.toEmployeeId);
  const fromName = from?.name ?? "الموظف المصدر";
  const toName = to?.name ?? "الموظف الهدف";

  const today = todayIsoDate();
  const openTasks = input.tasksAvailable
    ? input.tasks.filter(
        (t) =>
          String(t.assigneeId) === input.fromEmployeeId && !isTaskCompleted(t),
      ).length
    : 0;

  const teamsLed =
    input.snapshot?.teams.filter((t) => t.leader_id === input.fromEmployeeId) ?? [];
  const teamsCount = teamsLed.length;

  let summary = `معاينة نقل مسؤولية من ${fromName} إلى ${toName}: `;
  if (input.mode === "role_only") {
    summary += "تغيير تصوري للمسؤولية التنظيمية فقط.";
  } else if (input.mode === "role_plus_open_tasks") {
    summary +=
      openTasks > 0
        ? `${openTasks} مهمة مفتوحة قد تُعاد توزيعها عند التفعيل لاحقاً.`
        : "لا مهام مفتوحة مرتبطة بالمصدر حالياً.";
  } else if (input.mode === "role_plus_team") {
    summary +=
      teamsCount > 0
        ? `${teamsCount} فريقاً بقيادة المصدر (قد تنتقل عند التفعيل).`
        : "لا قيادة فريق مسجّلة للمصدر.";
  } else {
    summary += "—";
  }

  if (input.tasksAvailable && input.mode === "role_plus_open_tasks") {
    void today;
  }

  return { openTasks, teamsCount, summary };
}

export function buildDecisionOfTheDay(intel: OrgRolesIntelligence): {
  headline: string;
  body: string;
} {
  const { summary, primaryAction } = intel;
  let headline = "قرار اليوم";

  if (summary.unlinkedEmployees > 0) {
    headline = "أولوية: ربط الهيكل";
  } else if (summary.departmentsWithoutManager > 0) {
    headline = "أولوية: مسؤولية الوحدات";
  } else if (summary.teamsWithoutMembers > 0) {
    headline = "أولوية: اكتمال الفرق";
  } else if (summary.overdueTasksOrgWide && summary.overdueTasksOrgWide > 0) {
    headline = "أولوية: المهام المتأخرة";
  } else if (summary.activeByRole.organization_manager === 0) {
    headline = "تغطية القيادة";
  }

  let body = primaryAction.body;
  if (summary.activeByRole.organization_manager === 0) {
    body += " · لا يوجد مدير منشأة نشط في السجل.";
  }

  return { headline, body };
}

export function buildLeadershipStudioPreview(input: {
  employees: EmployeeRow[];
  managedProfiles: ProfileRow[] | null;
  orgSnapshot: OrgStructureSnapshot | null;
  tasks: Task[] | null;
  tasksAvailable: boolean;
  plan: PlanSlug;
}): LeadershipStudioPreview {
  const profiles = input.managedProfiles ?? [];
  const tasks = input.tasks ?? [];
  const intel = buildRolesIntelligence({
    employees: input.employees,
    managedProfiles: input.managedProfiles,
    orgSnapshot: input.orgSnapshot,
    tasks: input.tasks,
    tasksAvailable: input.tasksAvailable,
  });

  const { tierLabel, structureHint } = packageStudioCopy(input.plan);
  const { health: healthByEmployee, orgAvgOpen } = buildHealthPreviews(
    input.employees,
    input.orgSnapshot,
    tasks,
    input.tasksAvailable,
  );

  const activeEmployees = input.employees
    .filter((e) => e.status === "نشط")
    .map((e) => ({ id: e.id, name: e.name }));

  return {
    intel,
    packageTierLabel: tierLabel,
    packageStructureHint: structureHint,
    mapRows: buildLeadershipMapRows(
      input.orgSnapshot,
      input.employees,
      profiles,
      intel,
      input.plan,
    ),
    employeeOptions: activeEmployees,
    scopeOptions: buildScopeOptions(input.orgSnapshot, input.plan),
    healthByEmployee,
    orgAvgOpenTasks: Math.round(orgAvgOpen * 10) / 10,
  };
}

export { RISK_LABEL_AR };
