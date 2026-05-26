import { mapAuthRoleToUserRole, type UserRole } from "@/contexts/PermissionsContext";
import type { Task } from "@/types";
import { getLevelFromDepartment } from "./packageHierarchy";
import { TENANT_ACTIVE_RBAC_ROLES } from "./orgRoleClarity";
import type { OrgStructureSnapshot } from "./types";

export type RiskLevel = "low" | "medium" | "high";

export const RISK_LABEL_AR: Record<RiskLevel, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
};

export const ORG_ROLES_INSIGHTS_READONLY_AR =
  "هذه المؤشرات قراءة فقط لمساعدة المدير على المتابعة، ولا تغيّر صلاحيات الدخول.";

export type TenantRbacSlug = (typeof TENANT_ACTIVE_RBAC_ROLES)[number]["slug"];

export type ProfileRow = {
  userId: string;
  name: string;
  role: UserRole;
  isActive: boolean;
};

export type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
};

export type ActiveRoleInsight = {
  roleName: string;
  roleSlug: TenantRbacSlug;
  assignedCount: number;
  taskLoad: number | null;
  overdueCount: number | null;
  completionRate: number | null;
  riskLevel: RiskLevel;
  recommendation: string;
};

export type OrganizationalLabelInsight = {
  title: string;
  structureCount: number;
  linkedEmployees: number;
  note: string;
};

export type OrgRolesIntelligence = {
  summary: {
    activeByRole: Record<TenantRbacSlug, number>;
    unlinkedEmployees: number;
    withoutDepartmentLabel: number;
    departmentsWithoutManager: number;
    teamsWithoutMembers: number;
    overdueTasksOrgWide: number | null;
    tasksAvailable: boolean;
    profilesUsed: boolean;
  };
  activeRoleInsights: ActiveRoleInsight[];
  organizationalInsights: OrganizationalLabelInsight[];
  recommendations: string[];
};

const COMPLETED_STATUS = "مكتملة";
const OVERDUE_STATUS = "متأخرة";

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function normalizeTenantRole(raw: string): TenantRbacSlug | null {
  const mapped = mapAuthRoleToUserRole(raw);
  if (
    mapped === "organization_manager" ||
    mapped === "finance_manager" ||
    mapped === "employee"
  ) {
    return mapped;
  }
  return null;
}

function resolveAssigneeIdsForRole(
  slug: TenantRbacSlug,
  profiles: ProfileRow[],
  employees: EmployeeRow[],
  profilesUsed: boolean,
): Set<string> {
  const ids = new Set<string>();
  if (profilesUsed && profiles.length > 0) {
    for (const p of profiles) {
      if (!p.isActive) continue;
      if (p.role === slug) {
        ids.add(p.userId);
      }
    }
    return ids;
  }
  for (const e of employees) {
    if (e.status !== "نشط") continue;
    if (normalizeTenantRole(e.role) === slug) ids.add(e.id);
  }
  return ids;
}

function taskMatchesAssignee(task: Task, assigneeIds: Set<string>): boolean {
  const aid = String(task.assigneeId ?? "").trim();
  if (!aid) return false;
  return assigneeIds.has(aid);
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

function computeTaskMetrics(
  tasks: Task[],
  assigneeIds: Set<string>,
  today: string,
): { taskLoad: number; overdueCount: number; completionRate: number | null } {
  const relevant = tasks.filter((t) => taskMatchesAssignee(t, assigneeIds));
  if (relevant.length === 0) {
    return { taskLoad: 0, overdueCount: 0, completionRate: null };
  }
  const completed = relevant.filter(isTaskCompleted).length;
  const open = relevant.filter((t) => !isTaskCompleted(t));
  const overdue = relevant.filter((t) => isTaskOverdue(t, today)).length;
  return {
    taskLoad: open.length,
    overdueCount: overdue,
    completionRate: completed / relevant.length,
  };
}

function riskFromMetrics(
  assignedCount: number,
  taskLoad: number | null,
  overdueCount: number | null,
  completionRate: number | null,
  tasksAvailable: boolean,
): RiskLevel {
  if (assignedCount === 0) return "medium";
  if (!tasksAvailable || taskLoad === null) return "low";
  if (overdueCount !== null && overdueCount >= 3) return "high";
  if (completionRate !== null && completionRate < 0.5) return "high";
  if (overdueCount !== null && overdueCount >= 1) return "medium";
  if (completionRate !== null && completionRate < 0.7) return "medium";
  return "low";
}

function recommendationForRole(
  slug: TenantRbacSlug,
  assignedCount: number,
  overdueCount: number | null,
  completionRate: number | null,
  tasksAvailable: boolean,
): string {
  if (assignedCount === 0) {
    if (slug === "organization_manager") {
      return "لا يوجد حامل لهذا الدور — تأكد من تعيين مدير منشأة في إدارة الموظفين.";
    }
    if (slug === "finance_manager") {
      return "لا يوجد مدير مالي معيّن — أضفه من إدارة الموظفين إن احتجت متابعة مالية.";
    }
    return "لا يوجد موظفون بهذا الدور حالياً.";
  }
  if (tasksAvailable && overdueCount !== null && overdueCount > 0) {
    return `يوجد ${overdueCount} مهمة متأخرة مرتبطة بهذا الدور — راجع صفحة المهام.`;
  }
  if (tasksAvailable && completionRate !== null && completionRate < 0.6) {
    return "نسبة إنجاز منخفضة — راجع توزيع المهام على الفريق.";
  }
  if (slug === "finance_manager") {
    return "يتمتع بصلاحيات المالية حسب الدور — المؤشرات لا تعني صلاحيات إضافية.";
  }
  return "الوضع مستقر ضمن البيانات الحالية.";
}

function buildRecommendations(
  summary: OrgRolesIntelligence["summary"],
  activeInsights: ActiveRoleInsight[],
): string[] {
  const out: string[] = [];

  if (summary.unlinkedEmployees > 0) {
    out.push(
      `يوجد ${summary.unlinkedEmployees} موظفاً غير مربوط بوحدة في الهيكل — استخدم «ربط موظف» من المخطط.`,
    );
  }
  if (summary.departmentsWithoutManager > 0) {
    out.push(
      `${summary.departmentsWithoutManager} وحدة تنظيمية بلا مدير معيّن في السجل — راجع الهيكل عند التحديث.`,
    );
  }
  if (summary.teamsWithoutMembers > 0) {
    out.push(`${summary.teamsWithoutMembers} فريقاً بلا أعضاء مرتبطين — راجع التعيينات.`);
  }
  if (summary.tasksAvailable && summary.overdueTasksOrgWide !== null && summary.overdueTasksOrgWide > 0) {
    out.push(
      `${summary.overdueTasksOrgWide} مهمة متأخرة في المنشأة — تابعها من صفحة المهام.`,
    );
  }
  const emptyManager = activeInsights.find((r) => r.roleSlug === "organization_manager" && r.assignedCount === 0);
  if (emptyManager && out.length < 3) {
    out.push("يُفضّل وجود مدير منشأة واحد على الأقل لإدارة الصلاحيات والهيكل.");
  }
  if (out.length === 0) {
    out.push("لا توجد تنبيهات عاجلة — استمر في ربط الموظفين بالوحدات التنظيمية.");
  }

  return out.slice(0, 3);
}

function countLinkedAtLevel(
  snapshot: OrgStructureSnapshot,
  level: "agency" | "management" | "department",
): { units: number; linked: number } {
  const units = snapshot.departments.filter((d) => getLevelFromDepartment(d) === level);
  const unitIds = new Set(units.map((u) => u.id));
  const linked = new Set(
    snapshot.relations
      .filter((r) => r.department_id && unitIds.has(r.department_id))
      .map((r) => r.employee_id),
  );
  return { units: units.length, linked: linked.size };
}

export function buildRolesIntelligence(input: {
  employees: EmployeeRow[];
  managedProfiles: ProfileRow[] | null;
  orgSnapshot: OrgStructureSnapshot | null;
  tasks: Task[] | null;
  tasksAvailable: boolean;
}): OrgRolesIntelligence {
  const { employees, managedProfiles, orgSnapshot, tasks, tasksAvailable } = input;
  const profilesUsed = Boolean(managedProfiles && managedProfiles.length > 0);
  const profiles = managedProfiles ?? [];
  const today = todayIsoDate();
  const taskList = tasks ?? [];

  const activeByRole: Record<TenantRbacSlug, number> = {
    organization_manager: 0,
    finance_manager: 0,
    employee: 0,
  };

  if (profilesUsed) {
    for (const p of profiles) {
      if (!p.isActive) continue;
      if (p.role === "organization_manager") activeByRole.organization_manager += 1;
      else if (p.role === "finance_manager") activeByRole.finance_manager += 1;
      else if (p.role === "employee") activeByRole.employee += 1;
    }
  } else {
    for (const e of employees) {
      if (e.status !== "نشط") continue;
      const slug = normalizeTenantRole(e.role);
      if (slug) activeByRole[slug] += 1;
    }
  }

  const relationEmployeeIds = new Set(orgSnapshot?.relations.map((r) => r.employee_id) ?? []);
  const activeEmployeeIds = profilesUsed
    ? profiles.filter((p) => p.isActive).map((p) => p.userId)
    : employees.filter((e) => e.status === "نشط").map((e) => e.id);

  const unlinkedEmployees = activeEmployeeIds.filter((id) => !relationEmployeeIds.has(id)).length;

  const withoutDepartmentLabel = employees.filter(
    (e) => e.status === "نشط" && !String(e.department ?? "").trim(),
  ).length;

  const departmentsWithoutManager =
    orgSnapshot?.departments.filter((d) => !d.manager_id).length ?? 0;

  const teamIdsWithMembers = new Set(
    orgSnapshot?.relations.filter((r) => r.team_id).map((r) => r.team_id) ?? [],
  );
  const teamsWithoutMembers =
    orgSnapshot?.teams.filter((t) => !teamIdsWithMembers.has(t.id)).length ?? 0;

  let overdueTasksOrgWide: number | null = null;
  if (tasksAvailable) {
    overdueTasksOrgWide = taskList.filter((t) => isTaskOverdue(t, today)).length;
  }

  const activeRoleInsights: ActiveRoleInsight[] = TENANT_ACTIVE_RBAC_ROLES.map((def) => {
    const assigneeIds = resolveAssigneeIdsForRole(def.slug, profiles, employees, profilesUsed);
    const assignedCount = assigneeIds.size;

    let taskLoad: number | null = null;
    let overdueCount: number | null = null;
    let completionRate: number | null = null;

    if (tasksAvailable && assignedCount > 0) {
      const m = computeTaskMetrics(taskList, assigneeIds, today);
      taskLoad = m.taskLoad;
      overdueCount = m.overdueCount;
      completionRate = m.completionRate;
    } else if (tasksAvailable) {
      taskLoad = 0;
      overdueCount = 0;
      completionRate = null;
    }

    const riskLevel = riskFromMetrics(
      assignedCount,
      taskLoad,
      overdueCount,
      completionRate,
      tasksAvailable,
    );

    return {
      roleName: def.title,
      roleSlug: def.slug,
      assignedCount,
      taskLoad,
      overdueCount,
      completionRate,
      riskLevel,
      recommendation: recommendationForRole(
        def.slug,
        assignedCount,
        overdueCount,
        completionRate,
        tasksAvailable,
      ),
    };
  });

  const organizationalInsights: OrganizationalLabelInsight[] = [
    {
      title: "مجلس الإدارة",
      structureCount: 0,
      linkedEmployees: orgSnapshot ? countEmployeesInOrgBoard(orgSnapshot) : 0,
      note: "مسمى تنظيمي — ليس دور دخول",
    },
    {
      title: "مدير وكالة",
      structureCount: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "agency").units : 0,
      linkedEmployees: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "agency").linked : 0,
      note: "مسمى تنظيمي — ليس دور دخول",
    },
    {
      title: "مدير إدارة",
      structureCount: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "management").units : 0,
      linkedEmployees: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "management").linked : 0,
      note: "مسمى تنظيمي — ليس دور دخول",
    },
    {
      title: "رئيس قسم",
      structureCount: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "department").units : 0,
      linkedEmployees: orgSnapshot ? countLinkedAtLevel(orgSnapshot, "department").linked : 0,
      note: "مسمى تنظيمي — ليس دور دخول",
    },
  ];

  const summary = {
    activeByRole,
    unlinkedEmployees,
    withoutDepartmentLabel,
    departmentsWithoutManager,
    teamsWithoutMembers,
    overdueTasksOrgWide,
    tasksAvailable,
    profilesUsed,
  };

  const recommendations = buildRecommendations(summary, activeRoleInsights);

  return {
    summary,
    activeRoleInsights,
    organizationalInsights,
    recommendations,
  };
}

function countEmployeesInOrgBoard(snapshot: OrgStructureSnapshot): number {
  return new Set(snapshot.relations.map((r) => r.employee_id)).size;
}
