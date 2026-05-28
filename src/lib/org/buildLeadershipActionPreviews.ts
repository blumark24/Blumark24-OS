import type { PlanSlug } from "@/lib/features/packageFeatures";
import type { Client, Task } from "@/types";
import { computeEmployeeHealthScore, type ScopeOption } from "./buildLeadershipStudio";
import { RISK_LABEL_AR, type EmployeeRow, type RiskLevel } from "./buildRolesIntelligence";
import { getLevelFromDepartment, STRUCTURE_LEVEL_LABELS } from "./packageHierarchy";
import type { OrgStructureSnapshot } from "./types";

const COMPLETED_STATUS = "مكتملة";
const OVERDUE_STATUS = "متأخرة";

export const ORG_LEADERSHIP_ACTIONS_TITLE_AR = "أدوات القيادة";

export const ORG_SAVE_NEXT_PHASE_AR = "الحفظ يتطلب تفعيل المرحلة القادمة";

export const EMPLOYEE_TRANSFER_MODES = [
  { id: "employee_only", label: "نقل الموظف فقط" },
  { id: "employee_plus_open_tasks", label: "الموظف + المهام المفتوحة" },
  { id: "employee_plus_clients_if_supported", label: "الموظف + العملاء (إن وُجدت بيانات)" },
  { id: "employee_plus_tasks_and_clients", label: "الموظف + المهام والعملاء" },
] as const;

export type EmployeeTransferMode = (typeof EMPLOYEE_TRANSFER_MODES)[number]["id"];

export const ASSIGNMENT_RESPONSIBILITIES = [
  "مدير وكالة",
  "مدير إدارة",
  "رئيس قسم",
  "مسؤول فريق",
] as const;

export type AssignmentResponsibility = (typeof ASSIGNMENT_RESPONSIBILITIES)[number];

export const ASSIGNMENT_GOALS = [
  "ضبط الهيكل",
  "تقليل التأخير",
  "رفع الإنتاجية",
  "متابعة العملاء",
] as const;

export const REVIEW_FREQUENCIES = ["أسبوعية", "شهرية", "ربع سنوية"] as const;

export const TASK_DISTRIBUTION_FILTERS = [
  { id: "open_tasks", label: "المهام المفتوحة" },
  { id: "overdue_tasks", label: "المهام المتأخرة" },
  { id: "client_tasks_if_supported", label: "مهام مرتبطة بعملاء" },
  { id: "department_tasks", label: "مهام نطاق القسم (تقريبي)" },
] as const;

export type TaskDistributionFilter = (typeof TASK_DISTRIBUTION_FILTERS)[number]["id"];

export const PERFORMANCE_PERIODS = ["هذا الأسبوع", "هذا الشهر", "آخر 90 يوم"] as const;

export const PERFORMANCE_FOCUS = [
  "الإنجاز",
  "الالتزام",
  "العملاء",
  "الإنتاجية",
] as const;

export type LeadershipActionId =
  | "transfer_employee"
  | "assign_responsible"
  | "distribute_tasks"
  | "performance_review";

export type ActionCardDefinition = {
  id: LeadershipActionId;
  title: string;
  value: string;
  metric: string | null;
};

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

function taskMetricsForEmployee(tasks: Task[], employeeId: string, today: string) {
  const relevant = tasks.filter((t) => String(t.assigneeId ?? "").trim() === employeeId);
  if (relevant.length === 0) {
    return { open: 0, overdue: 0, completionRate: null as number | null, total: 0, withClient: 0 };
  }
  const completed = relevant.filter(isTaskCompleted).length;
  const open = relevant.filter((t) => !isTaskCompleted(t)).length;
  const overdue = relevant.filter((t) => isTaskOverdue(t, today)).length;
  const withClient = relevant.filter((t) => String(t.clientId ?? "").trim()).length;
  return {
    open,
    overdue,
    completionRate: completed / relevant.length,
    total: relevant.length,
    withClient,
  };
}

export function responsibilitiesForPlan(plan: PlanSlug): readonly AssignmentResponsibility[] {
  switch (plan) {
    case "advanced":
      return ASSIGNMENT_RESPONSIBILITIES;
    case "growth":
      return ["مدير إدارة", "رئيس قسم", "مسؤول فريق"];
    default:
      return ["رئيس قسم", "مسؤول فريق"];
  }
}

export function buildActionCardDefinitions(input: {
  unlinkedEmployees: number;
  departmentsWithoutManager: number;
  openTasksOrgWide: number | null;
  overdueTasksOrgWide: number | null;
  tasksAvailable: boolean;
  activeEmployees: number;
}): ActionCardDefinition[] {
  const open = input.tasksAvailable ? input.openTasksOrgWide ?? 0 : null;
  const overdue = input.tasksAvailable ? input.overdueTasksOrgWide ?? 0 : null;

  return [
    {
      id: "transfer_employee",
      title: "نقل موظف",
      value: "إعادة ربط الموظف بوحدة أو فريق دون تغيير صلاحيات الدخول.",
      metric:
        input.unlinkedEmployees > 0
          ? `${input.unlinkedEmployees} خارج الهيكل`
          : null,
    },
    {
      id: "assign_responsible",
      title: "تعيين مسؤول",
      value: "توضيح المسؤولية التنظيمية على الوكالة أو الإدارة أو القسم أو الفريق.",
      metric:
        input.departmentsWithoutManager > 0
          ? `${input.departmentsWithoutManager} وحدة بلا مسؤول`
          : null,
    },
    {
      id: "distribute_tasks",
      title: "توزيع مهام",
      value: "معاينة إعادة توازن الحمل بين موظفين قبل التنفيذ الفعلي.",
      metric:
        overdue !== null && overdue > 0
          ? `${overdue} متأخرة`
          : open !== null && open > 0
            ? `${open} مفتوحة`
            : null,
    },
    {
      id: "performance_review",
      title: "تقييم أداء",
      value: "قراءة مؤشرات الإنجاز والالتزام من المهام والهيكل الحالي.",
      metric:
        input.activeEmployees > 0 ? `${input.activeEmployees} موظف نشط` : null,
    },
  ];
}

export function employeePlacementLabel(
  snapshot: OrgStructureSnapshot | null,
  employeeId: string,
): string {
  if (!snapshot || !employeeId) return "غير معروف";
  const rel = snapshot.relations.find((r) => r.employee_id === employeeId);
  if (!rel) return "غير مرتبط بالهيكل";
  const dept = rel.department_id
    ? snapshot.departments.find((d) => d.id === rel.department_id)
    : null;
  const team = rel.team_id ? snapshot.teams.find((t) => t.id === rel.team_id) : null;
  const parts: string[] = [];
  if (dept) {
    const level = getLevelFromDepartment(dept);
    parts.push(`${dept.name} (${STRUCTURE_LEVEL_LABELS[level]})`);
  }
  if (team) parts.push(`فريق ${team.name}`);
  return parts.length > 0 ? parts.join(" · ") : "مرتبط بدون تفاصيل";
}

export function countClientsForEmployee(
  employeeId: string,
  tasks: Task[],
  clients: Client[] | null | undefined,
  tasksAvailable: boolean,
): { count: number | null; label: string } {
  if (!tasksAvailable) return { count: null, label: "غير متاح حاليًا" };
  const clientIdsFromTasks = new Set(
    tasks
      .filter((t) => String(t.assigneeId) === employeeId && String(t.clientId ?? "").trim())
      .map((t) => String(t.clientId)),
  );
  if (clientIdsFromTasks.size > 0) {
    return { count: clientIdsFromTasks.size, label: `${clientIdsFromTasks.size} عبر المهام` };
  }
  if (clients && clients.length > 0) {
    const byManager = clients.filter((c) => c.accountManagerId === employeeId).length;
    if (byManager > 0) return { count: byManager, label: `${byManager} كمدير حساب` };
  }
  return { count: 0, label: "غير متاح حاليًا" };
}

export function buildEmployeeTransferPreview(input: {
  employeeId: string;
  targetScopeId: string;
  mode: EmployeeTransferMode;
  reason: string;
  effectiveDate: string;
  employees: EmployeeRow[];
  snapshot: OrgStructureSnapshot | null;
  scopeOptions: ScopeOption[];
  tasks: Task[];
  tasksAvailable: boolean;
  clients?: Client[] | null;
}): {
  currentPlacement: string;
  targetLabel: string;
  openTasks: number;
  overdueTasks: number;
  clientLabel: string;
  summary: string;
} {
  const today = todayIsoDate();
  const emp = input.employees.find((e) => e.id === input.employeeId);
  const name = emp?.name ?? "الموظف";
  const target =
    input.scopeOptions.find((o) => o.id === input.targetScopeId)?.label ?? "هدف غير محدد";
  const m = input.tasksAvailable
    ? taskMetricsForEmployee(input.tasks, input.employeeId, today)
    : { open: 0, overdue: 0, withClient: 0 };
  const clients = countClientsForEmployee(
    input.employeeId,
    input.tasks,
    input.clients,
    input.tasksAvailable,
  );

  let summary = `معاينة نقل ${name} إلى ${target}`;
  if (input.reason.trim()) summary += ` — السبب: ${input.reason.trim()}`;
  if (input.effectiveDate) summary += ` · تاريخ مقترح: ${input.effectiveDate}`;

  if (input.mode === "employee_only") {
    summary += " · نقل الربط التنظيمي فقط.";
  } else if (input.mode === "employee_plus_open_tasks") {
    summary += ` · قد يشمل ${m.open} مهمة مفتوحة.`;
  } else if (input.mode === "employee_plus_clients_if_supported") {
    summary += ` · عملاء: ${clients.label}.`;
  } else {
    summary += ` · قد يشمل ${m.open} مهمة و${clients.label}.`;
  }

  return {
    currentPlacement: employeePlacementLabel(input.snapshot, input.employeeId),
    targetLabel: target,
    openTasks: m.open,
    overdueTasks: m.overdue,
    clientLabel: clients.label,
    summary,
  };
}

export function buildAssignResponsiblePreview(input: {
  employeeId: string;
  responsibility: AssignmentResponsibility;
  scopeId: string;
  goal: string;
  frequency: string;
  employees: EmployeeRow[];
  scopeOptions: ScopeOption[];
}): string {
  const emp = input.employees.find((e) => e.id === input.employeeId)?.name ?? "موظف";
  const scope =
    input.scopeOptions.find((o) => o.id === input.scopeId)?.label ?? "نطاق غير محدد";
  return `معاينة: تعيين ${emp} كـ «${input.responsibility}» ضمن ${scope} بهدف ${input.goal} ومتابعة ${input.frequency} — دون حفظ أو تغيير صلاحيات دخول.`;
}

function filterTasksForDistribution(
  tasks: Task[],
  fromEmployeeId: string,
  filter: TaskDistributionFilter,
  snapshot: OrgStructureSnapshot | null,
  today: string,
): Task[] {
  const base = tasks.filter(
    (t) => String(t.assigneeId) === fromEmployeeId && !isTaskCompleted(t),
  );
  switch (filter) {
    case "overdue_tasks":
      return base.filter((t) => isTaskOverdue(t, today));
    case "client_tasks_if_supported":
      return base.filter((t) => String(t.clientId ?? "").trim());
    case "department_tasks": {
      const rel = snapshot?.relations.find((r) => r.employee_id === fromEmployeeId);
      if (!rel?.department_id) return [];
      return base;
    }
    default:
      return base;
  }
}

export function buildTaskDistributionPreview(input: {
  fromEmployeeId: string;
  toEmployeeId: string;
  filter: TaskDistributionFilter;
  taskCount: number;
  tasks: Task[];
  tasksAvailable: boolean;
  snapshot: OrgStructureSnapshot | null;
  employees: EmployeeRow[];
  orgAvgOpen: number;
}): {
  fromOpen: number;
  toOpen: number;
  matchingCount: number;
  balanceSuggestion: string;
  summary: string;
} {
  const today = todayIsoDate();
  const fromName =
    input.employees.find((e) => e.id === input.fromEmployeeId)?.name ?? "المصدر";
  const toName = input.employees.find((e) => e.id === input.toEmployeeId)?.name ?? "الهدف";

  const fromM = input.tasksAvailable
    ? taskMetricsForEmployee(input.tasks, input.fromEmployeeId, today)
    : { open: 0, overdue: 0 };
  const toM = input.tasksAvailable
    ? taskMetricsForEmployee(input.tasks, input.toEmployeeId, today)
    : { open: 0, overdue: 0 };

  const matching = input.tasksAvailable
    ? filterTasksForDistribution(
        input.tasks,
        input.fromEmployeeId,
        input.filter,
        input.snapshot,
        today,
      )
    : [];
  const capped = Math.min(Math.max(0, input.taskCount), matching.length);

  const projectedFrom = Math.max(0, fromM.open - capped);
  const projectedTo = toM.open + capped;
  let balanceSuggestion =
    "وازن الحمل تدريجياً — راقب المهام المفتوحة بعد التوزيع.";
  if (input.orgAvgOpen > 0) {
    if (projectedTo > input.orgAvgOpen * 1.4) {
      balanceSuggestion = "الهدف قد يصبح محمّلاً فوق متوسط الفريق — فكّر بتقسيم الدفعة.";
    } else if (projectedFrom < input.orgAvgOpen * 0.5 && fromM.open > 0) {
      balanceSuggestion = "توزيع معقول — يخفف ضغط المصدر مع الحفاظ على الاستمرارية.";
    }
  }

  const summary = input.tasksAvailable
    ? `معاينة نقل ${capped} مهمة (${TASK_DISTRIBUTION_FILTERS.find((f) => f.id === input.filter)?.label}) من ${fromName} إلى ${toName}.`
    : `معاينة توزيع مهام من ${fromName} إلى ${toName} — بيانات المهام غير متاحة للقراءة.`;

  return {
    fromOpen: fromM.open,
    toOpen: toM.open,
    matchingCount: matching.length,
    balanceSuggestion,
    summary,
  };
}

function periodStartIso(period: string): string | null {
  const now = new Date();
  if (period === "هذا الأسبوع") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }
  if (period === "هذا الشهر") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }
  if (period === "آخر 90 يوم") {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  }
  return null;
}

export function buildPerformancePreview(input: {
  employeeId: string;
  period: string;
  focus: string;
  tasks: Task[];
  tasksAvailable: boolean;
  snapshot: OrgStructureSnapshot | null;
  employees: EmployeeRow[];
  orgAvgOpen: number;
}): {
  completionRate: number | null;
  overdueCount: number;
  openTasks: number;
  linked: boolean;
  score: number;
  riskLevel: RiskLevel;
  summary: string;
} {
  const today = todayIsoDate();
  const start = periodStartIso(input.period);
  const rel = input.snapshot?.relations.find((r) => r.employee_id === input.employeeId);
  const linked = Boolean(rel);
  const hasTeam = Boolean(rel?.team_id);

  let tasksForPeriod = input.tasks.filter((t) => String(t.assigneeId) === input.employeeId);
  if (start) {
    tasksForPeriod = tasksForPeriod.filter((t) => {
      const created = String(t.createdAt ?? "").slice(0, 10);
      const due = String(t.dueDate ?? "").slice(0, 10);
      return (created && created >= start) || (due && due >= start);
    });
  }

  const m = input.tasksAvailable
    ? (() => {
        if (tasksForPeriod.length === 0) {
          return taskMetricsForEmployee(input.tasks, input.employeeId, today);
        }
        const completed = tasksForPeriod.filter(isTaskCompleted).length;
        const open = tasksForPeriod.filter((t) => !isTaskCompleted(t)).length;
        const overdue = tasksForPeriod.filter((t) => isTaskOverdue(t, today)).length;
        return {
          open,
          overdue,
          completionRate:
            tasksForPeriod.length > 0 ? completed / tasksForPeriod.length : null,
          total: tasksForPeriod.length,
          withClient: 0,
        };
      })()
    : { open: 0, overdue: 0, completionRate: null, total: 0, withClient: 0 };

  const score = computeEmployeeHealthScore({
    employeeId: input.employeeId,
    linked,
    hasTeam,
    openTasks: m.open,
    overdueTasks: m.overdue,
    completionRate: m.completionRate,
    orgAvgOpen: input.orgAvgOpen,
  });

  const riskLevel: RiskLevel =
    score < 50 ? "high" : score < 75 ? "medium" : "low";

  const emp = input.employees.find((e) => e.id === input.employeeId)?.name ?? "الموظف";
  const completionPct =
    m.completionRate !== null ? `${Math.round(m.completionRate * 100)}%` : "—";

  const summary = `معاينة تقييم ${emp} (${input.period}) — تركيز ${input.focus}: إكمال ${completionPct}، ${m.overdue} متأخرة، ${m.open} مفتوحة، ربط هيكلي ${linked ? "نعم" : "لا"}، مخاطر ${RISK_LABEL_AR[riskLevel]}.`;

  return {
    completionRate: m.completionRate,
    overdueCount: m.overdue,
    openTasks: m.open,
    linked,
    score,
    riskLevel,
    summary,
  };
}
