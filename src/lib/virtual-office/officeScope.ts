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
export type OfficeViewerMode = "owner" | "manager" | "employee" | "public";

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

export interface OfficeScopeViewer {
  mode: OfficeViewerMode;
  userId?: string | null;
  employeeId?: string | null;
  managedDepartmentIds?: string[] | null;
  managedTeamIds?: string[] | null;
  departmentIds?: string[] | null;
  teamIds?: string[] | null;
}

export interface OfficeScopeAccess {
  canViewOffice: boolean;
  canViewEmployees: boolean;
  canViewTasks: boolean;
  canViewFiles: boolean;
  canViewReport: boolean;
  canViewBoardSummary: boolean;
  reason: "allowed" | "public_limited" | "unassigned" | "out_of_scope";
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

function includesId(values: string[] | null | undefined, id: string | null): boolean {
  if (!id) return false;
  return Array.isArray(values) && values.includes(id);
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

export function resolveOfficeScopeAccess(scope: OfficeScope, viewer: OfficeScopeViewer): OfficeScopeAccess {
  if (viewer.mode === "owner") {
    return {
      canViewOffice: true,
      canViewEmployees: !scope.isBoard && scope.isLinked,
      canViewTasks: !scope.isBoard && scope.isLinked,
      canViewFiles: !scope.isBoard && scope.isLinked,
      canViewReport: scope.isLinked,
      canViewBoardSummary: scope.isBoard,
      reason: "allowed",
    };
  }

  if (viewer.mode === "public") {
    return {
      canViewOffice: true,
      canViewEmployees: false,
      canViewTasks: false,
      canViewFiles: false,
      canViewReport: false,
      canViewBoardSummary: false,
      reason: "public_limited",
    };
  }

  if (!scope.isLinked || scope.kind === "unassigned") {
    return {
      canViewOffice: viewer.mode === "manager",
      canViewEmployees: false,
      canViewTasks: false,
      canViewFiles: false,
      canViewReport: false,
      canViewBoardSummary: false,
      reason: "unassigned",
    };
  }

  if (scope.isBoard) {
    return {
      canViewOffice: false,
      canViewEmployees: false,
      canViewTasks: false,
      canViewFiles: false,
      canViewReport: false,
      canViewBoardSummary: false,
      reason: "out_of_scope",
    };
  }

  const managesScope =
    includesId(viewer.managedDepartmentIds, scope.departmentId) ||
    includesId(viewer.managedTeamIds, scope.teamId);

  const belongsToScope =
    includesId(viewer.departmentIds, scope.departmentId) ||
    includesId(viewer.teamIds, scope.teamId);

  if (viewer.mode === "manager" && managesScope) {
    return {
      canViewOffice: true,
      canViewEmployees: true,
      canViewTasks: true,
      canViewFiles: true,
      canViewReport: true,
      canViewBoardSummary: false,
      reason: "allowed",
    };
  }

  if (viewer.mode === "employee" && belongsToScope) {
    return {
      canViewOffice: true,
      canViewEmployees: false,
      canViewTasks: true,
      canViewFiles: false,
      canViewReport: false,
      canViewBoardSummary: false,
      reason: "allowed",
    };
  }

  return {
    canViewOffice: false,
    canViewEmployees: false,
    canViewTasks: false,
    canViewFiles: false,
    canViewReport: false,
    canViewBoardSummary: false,
    reason: "out_of_scope",
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
