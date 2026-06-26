// C16.2 — Virtual Command Office scoped data foundation
//
// This module is intentionally pure and UI-agnostic. It defines the safe data
// boundary for every virtual office before live presence, movement, files, or
// meetings are added.
//
// Rule:
// office -> linked department/section/team -> employees -> tasks -> reports
//
// Important: never fall back to all employees or all tasks when an office is
// unlinked. Unlinked offices must return an empty scope and let the UI show
// "جاهز بعد الربط".

export type OfficeScopeKind = "board" | "department" | "team" | "unassigned";

export interface OfficeScopeInput {
  officeId: string;
  officeNumber: number;
  fixedRoomKey: string;
  isBoard?: boolean;
  mappedUnitId?: string | null;
  mappedUnitType?: "department" | "team" | "management" | "agency" | null;
  managerId?: string | null;
  tenantId?: string | null;
  organizationId?: string | null;
}

export interface OfficeScope {
  officeId: string;
  officeNumber: number;
  fixedRoomKey: string;
  kind: OfficeScopeKind;
  departmentId: string | null;
  teamId: string | null;
  managerId: string | null;
  tenantId: string | null;
  organizationId: string | null;
  isLinked: boolean;
  isBoard: boolean;
  emptyState: "جاهز بعد الربط" | "غير متاح" | null;
}

export interface OfficeScopeRelation {
  employee_id?: string | null;
  department_id?: string | null;
  team_id?: string | null;
}

export interface OfficeScopeEmployee {
  id: string;
  [key: string]: unknown;
}

export interface OfficeScopeTask {
  assigneeId?: string | null;
  status?: string | null;
  dueDate?: string | null;
  [key: string]: unknown;
}

export interface OfficeScopeSummary {
  employeeCount: number;
  taskCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
}

export function resolveOfficeScope(input: OfficeScopeInput): OfficeScope {
  const mappedType = input.mappedUnitType ?? null;
  const mappedId = input.mappedUnitId ?? null;
  const isBoard = Boolean(input.isBoard);

  if (isBoard) {
    return {
      officeId: input.officeId,
      officeNumber: input.officeNumber,
      fixedRoomKey: input.fixedRoomKey,
      kind: "board",
      departmentId: null,
      teamId: null,
      managerId: input.managerId ?? null,
      tenantId: input.tenantId ?? null,
      organizationId: input.organizationId ?? null,
      isLinked: true,
      isBoard: true,
      emptyState: null,
    };
  }

  if (!mappedId) {
    return {
      officeId: input.officeId,
      officeNumber: input.officeNumber,
      fixedRoomKey: input.fixedRoomKey,
      kind: "unassigned",
      departmentId: null,
      teamId: null,
      managerId: input.managerId ?? null,
      tenantId: input.tenantId ?? null,
      organizationId: input.organizationId ?? null,
      isLinked: false,
      isBoard: false,
      emptyState: "جاهز بعد الربط",
    };
  }

  const isTeam = mappedType === "team";

  return {
    officeId: input.officeId,
    officeNumber: input.officeNumber,
    fixedRoomKey: input.fixedRoomKey,
    kind: isTeam ? "team" : "department",
    departmentId: isTeam ? null : mappedId,
    teamId: isTeam ? mappedId : null,
    managerId: input.managerId ?? null,
    tenantId: input.tenantId ?? null,
    organizationId: input.organizationId ?? null,
    isLinked: true,
    isBoard: false,
    emptyState: null,
  };
}

export function resolveScopedEmployeeIds(
  scope: OfficeScope,
  relations: OfficeScopeRelation[],
): string[] {
  if (!scope.isLinked || scope.kind === "unassigned" || scope.kind === "board") return [];

  const ids = new Set<string>();
  for (const relation of Array.isArray(relations) ? relations : []) {
    const employeeId = relation.employee_id;
    if (!employeeId) continue;

    if (scope.teamId && relation.team_id === scope.teamId) {
      ids.add(employeeId);
      continue;
    }

    if (scope.departmentId && relation.department_id === scope.departmentId) {
      ids.add(employeeId);
    }
  }

  return Array.from(ids);
}

export function filterEmployeesByScope<T extends OfficeScopeEmployee>(
  scope: OfficeScope,
  employees: T[],
  relations: OfficeScopeRelation[],
): T[] {
  const allowedIds = new Set(resolveScopedEmployeeIds(scope, relations));
  if (allowedIds.size === 0) return [];
  return (Array.isArray(employees) ? employees : []).filter((employee) => allowedIds.has(employee.id));
}

export function filterTasksByScope<T extends OfficeScopeTask>(
  scope: OfficeScope,
  tasks: T[],
  relations: OfficeScopeRelation[],
): T[] {
  const allowedIds = new Set(resolveScopedEmployeeIds(scope, relations));
  if (allowedIds.size === 0) return [];
  return (Array.isArray(tasks) ? tasks : []).filter((task) => {
    const assigneeId = task.assigneeId;
    return Boolean(assigneeId && allowedIds.has(assigneeId));
  });
}

export function summarizeOfficeScope(
  scope: OfficeScope,
  employees: OfficeScopeEmployee[],
  tasks: OfficeScopeTask[],
  relations: OfficeScopeRelation[],
): OfficeScopeSummary {
  const scopedEmployees = filterEmployeesByScope(scope, employees, relations);
  const scopedTasks = filterTasksByScope(scope, tasks, relations);

  const openTaskCount = scopedTasks.filter((task) => task.status !== "مكتملة").length;
  const overdueTaskCount = scopedTasks.filter((task) => task.status === "متأخرة").length;

  return {
    employeeCount: scopedEmployees.length,
    taskCount: scopedTasks.length,
    openTaskCount,
    overdueTaskCount,
  };
}
