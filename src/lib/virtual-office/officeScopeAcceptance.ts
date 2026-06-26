import type {
  OfficeScope,
  OfficeScopeAccess,
  OfficeScopeRelation,
  OfficeScopeTask,
} from "./officeScope";
import { resolveScopedEmployeeIds } from "./officeScope";

export interface OfficeScopeAcceptanceResult {
  ok: boolean;
  code:
    | "ok"
    | "unlinked_scope_has_data"
    | "board_scope_denied"
    | "public_scope_denied"
    | "task_outside_scope"
    | "employee_outside_scope";
  message: string;
}

function pass(): OfficeScopeAcceptanceResult {
  return { ok: true, code: "ok", message: "office scope is isolated" };
}

function fail(code: Exclude<OfficeScopeAcceptanceResult["code"], "ok">, message: string): OfficeScopeAcceptanceResult {
  return { ok: false, code, message };
}

export function assertNoDataForRestrictedAccess(input: {
  scope: OfficeScope;
  access: OfficeScopeAccess;
  employeeCount: number;
  taskCount: number;
  fileCount?: number;
}): OfficeScopeAcceptanceResult {
  const hasData = input.employeeCount > 0 || input.taskCount > 0 || (input.fileCount ?? 0) > 0;

  if (!input.scope.isLinked && hasData) {
    return fail("unlinked_scope_has_data", "unlinked offices must return empty data");
  }

  if (input.scope.isBoard && !input.access.canViewBoardSummary && hasData) {
    return fail("board_scope_denied", "board summary is not available for this viewer");
  }

  if (input.access.reason === "public_limited" && hasData) {
    return fail("public_scope_denied", "public view must return empty operational data");
  }

  return pass();
}

export function assertEmployeesBelongToScope(input: {
  scope: OfficeScope;
  relations: OfficeScopeRelation[];
  employeeIds: string[];
}): OfficeScopeAcceptanceResult {
  const allowedIds = new Set(resolveScopedEmployeeIds(input.scope, input.relations));

  for (const employeeId of input.employeeIds) {
    if (!allowedIds.has(employeeId)) {
      return fail("employee_outside_scope", "employee list includes a member outside this office scope");
    }
  }

  return pass();
}

export function assertTasksBelongToScope<TTask extends OfficeScopeTask>(input: {
  scope: OfficeScope;
  relations: OfficeScopeRelation[];
  tasks: TTask[];
}): OfficeScopeAcceptanceResult {
  const allowedIds = new Set(resolveScopedEmployeeIds(input.scope, input.relations));

  for (const task of input.tasks) {
    const assigneeId = task.assigneeId;
    if (!assigneeId || !allowedIds.has(assigneeId)) {
      return fail("task_outside_scope", "task list includes a task outside this office scope");
    }
  }

  return pass();
}

export function assertScopedOfficeDataAcceptance<TTask extends OfficeScopeTask>(input: {
  scope: OfficeScope;
  access: OfficeScopeAccess;
  relations: OfficeScopeRelation[];
  employeeIds: string[];
  tasks: TTask[];
  fileCount?: number;
}): OfficeScopeAcceptanceResult {
  const restricted = assertNoDataForRestrictedAccess({
    scope: input.scope,
    access: input.access,
    employeeCount: input.employeeIds.length,
    taskCount: input.tasks.length,
    fileCount: input.fileCount,
  });
  if (!restricted.ok) return restricted;

  const employees = assertEmployeesBelongToScope({
    scope: input.scope,
    relations: input.relations,
    employeeIds: input.employeeIds,
  });
  if (!employees.ok) return employees;

  return assertTasksBelongToScope({
    scope: input.scope,
    relations: input.relations,
    tasks: input.tasks,
  });
}
