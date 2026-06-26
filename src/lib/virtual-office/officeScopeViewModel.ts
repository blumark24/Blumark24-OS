// C16.2-C — Virtual Command Office scoped data view model
//
// Safe adapter over officeScope.ts. This prepares UI wiring without touching the
// 9-office map, office coordinates, modal visuals, or realtime features.

import {
  filterEmployeesByScope,
  filterTasksByScope,
  resolveOfficeScope,
  resolveOfficeScopeAccess,
  summarizeOfficeScope,
  type OfficeScope,
  type OfficeScopeAccess,
  type OfficeScopeEmployee,
  type OfficeScopeRelation,
  type OfficeScopeTask,
  type OfficeScopeViewer,
} from "./officeScope";

export interface ScopedOfficeMappingUnit {
  id: string;
  type: "agency" | "management" | "department" | "team";
  name?: string | null;
}

export interface ScopedOfficeRoomInput {
  id: string;
  officeNumber: number;
  fixedRoomKey: string;
  isBoard?: boolean;
  managerId?: string | null;
  tenantId?: string | null;
  organizationId?: string | null;
}

export interface ScopedOfficeData<
  TEmployee extends OfficeScopeEmployee,
  TTask extends OfficeScopeTask,
> {
  scope: OfficeScope;
  access: OfficeScopeAccess;
  employees: TEmployee[];
  tasks: TTask[];
  summary: {
    employeeCount: number;
    taskCount: number;
    openTaskCount: number;
    overdueTaskCount: number;
  };
}

function unitApiId(unit: ScopedOfficeMappingUnit | null): string | null {
  if (!unit) return null;
  return unit.id.includes(":") ? unit.id.split(":").slice(1).join(":") : unit.id;
}

function unitScopeType(unit: ScopedOfficeMappingUnit | null): "department" | "team" | null {
  if (!unit) return null;
  return unit.type === "team" ? "team" : "department";
}

export function buildScopedOfficeData<
  TEmployee extends OfficeScopeEmployee,
  TTask extends OfficeScopeTask,
>(input: {
  room: ScopedOfficeRoomInput;
  mappingUnit: ScopedOfficeMappingUnit | null;
  viewer: OfficeScopeViewer;
  employees: TEmployee[];
  tasks: TTask[];
  relations: OfficeScopeRelation[];
}): ScopedOfficeData<TEmployee, TTask> {
  const scope = resolveOfficeScope({
    officeId: input.room.id,
    officeNumber: input.room.officeNumber,
    fixedRoomKey: input.room.fixedRoomKey,
    isBoard: input.room.isBoard,
    mappedUnitId: unitApiId(input.mappingUnit),
    mappedUnitType: unitScopeType(input.mappingUnit),
    managerId: input.room.managerId,
    tenantId: input.room.tenantId,
    organizationId: input.room.organizationId,
  });

  const access = resolveOfficeScopeAccess(scope, input.viewer);
  const relations = Array.isArray(input.relations) ? input.relations : [];
  const employees = Array.isArray(input.employees) ? input.employees : [];
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];

  const scopedEmployees = access.canViewEmployees
    ? filterEmployeesByScope(scope, employees, relations)
    : [];

  const scopedTasks = access.canViewTasks
    ? filterTasksByScope(scope, tasks, relations)
    : [];

  const summarySource = access.canViewReport || access.canViewTasks || access.canViewEmployees
    ? summarizeOfficeScope(scope, employees, tasks, relations)
    : { employeeCount: 0, taskCount: 0, openTaskCount: 0, overdueTaskCount: 0 };

  return {
    scope,
    access,
    employees: scopedEmployees,
    tasks: scopedTasks,
    summary: summarySource,
  };
}
