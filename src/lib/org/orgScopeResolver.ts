import type { Client, Employee, Task } from "@/types";
import type { OrgStructureSnapshot } from "@/lib/org/types";

export const ORG_UNKNOWN_LABEL = "غير محدد";

type OrgEmployee = Pick<Employee, "id" | "name" | "email" | "department" | "jobTitle">;

export interface ResolvedOrgScope {
  employeeId: string | null;
  employeeName: string;
  departmentId: string | null;
  departmentLabel: string;
  teamId: string | null;
  teamLabel: string;
  positionId: string | null;
  positionLabel: string;
  managerId: string | null;
  managerName: string;
  managerScopeLabel: string;
  isLinkedToOrg: boolean;
}

export interface OrgScopeResolver {
  resolveEmployee: (employee?: Partial<OrgEmployee> | null) => ResolvedOrgScope;
  resolveEmployeeById: (employeeId?: string | null) => ResolvedOrgScope;
  resolveTaskAssignee: (task: Pick<Task, "assigneeId" | "assigneeName">) => ResolvedOrgScope;
  resolveClientManager: (client: Pick<Client, "accountManagerId" | "accountManagerName">) => ResolvedOrgScope;
  taskSourceLabel: (task: Pick<Task, "clientId" | "clientName">) => string;
}

const clean = (value?: string | null) => {
  const text = value?.trim();
  return text || null;
};

const sameText = (a?: string | null, b?: string | null) =>
  Boolean(clean(a) && clean(b) && clean(a)?.toLocaleLowerCase("ar") === clean(b)?.toLocaleLowerCase("ar"));

function emptyScope(name?: string | null): ResolvedOrgScope {
  return {
    employeeId: null,
    employeeName: clean(name) ?? ORG_UNKNOWN_LABEL,
    departmentId: null,
    departmentLabel: ORG_UNKNOWN_LABEL,
    teamId: null,
    teamLabel: ORG_UNKNOWN_LABEL,
    positionId: null,
    positionLabel: ORG_UNKNOWN_LABEL,
    managerId: null,
    managerName: ORG_UNKNOWN_LABEL,
    managerScopeLabel: ORG_UNKNOWN_LABEL,
    isLinkedToOrg: false,
  };
}

export function createOrgScopeResolver(
  snapshot: OrgStructureSnapshot | null | undefined,
  employees: OrgEmployee[] = [],
): OrgScopeResolver {
  const departments = snapshot?.departments ?? [];
  const teams = snapshot?.teams ?? [];
  const positions = snapshot?.positions ?? [];
  const relations = snapshot?.relations ?? [];

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const relationByEmployeeId = new Map(relations.map((relation) => [relation.employee_id, relation]));

  const findEmployeeByName = (name?: string | null) =>
    employees.find((employee) => sameText(employee.name, name) || sameText(employee.email, name)) ?? null;

  const findEmployee = (employee?: Partial<OrgEmployee> | null) => {
    if (!employee) return null;
    if (employee.id && employeeById.has(employee.id)) return employeeById.get(employee.id) ?? null;
    return findEmployeeByName(employee.name ?? employee.email ?? null);
  };

  const resolveEmployee = (input?: Partial<OrgEmployee> | null): ResolvedOrgScope => {
    const employee = findEmployee(input);
    if (!employee) return emptyScope(input?.name ?? input?.email);

    const relation = relationByEmployeeId.get(employee.id) ?? null;
    const relationDepartment = relation?.department_id
      ? departments.find((department) => department.id === relation.department_id) ?? null
      : null;
    const legacyDepartment = relationDepartment
      ? null
      : departments.find((department) => sameText(department.name, employee.department)) ?? null;
    const department = relationDepartment ?? legacyDepartment;
    const team = relation?.team_id ? teams.find((item) => item.id === relation.team_id) ?? null : null;
    const position = relation?.position_id ? positions.find((item) => item.id === relation.position_id) ?? null : null;
    const managerId = clean(relation?.manager_id) ?? clean(team?.leader_id) ?? clean(department?.manager_id);
    const manager = managerId ? employeeById.get(managerId) ?? null : null;

    return {
      employeeId: employee.id,
      employeeName: clean(employee.name) ?? ORG_UNKNOWN_LABEL,
      departmentId: department?.id ?? null,
      departmentLabel: clean(department?.name) ?? clean(employee.department) ?? ORG_UNKNOWN_LABEL,
      teamId: team?.id ?? null,
      teamLabel: clean(team?.name) ?? ORG_UNKNOWN_LABEL,
      positionId: position?.id ?? null,
      positionLabel: clean(position?.title_ar) ?? clean(position?.title) ?? clean(employee.jobTitle) ?? ORG_UNKNOWN_LABEL,
      managerId: managerId ?? null,
      managerName: clean(manager?.name) ?? ORG_UNKNOWN_LABEL,
      managerScopeLabel: clean(department?.name) ?? clean(team?.name) ?? ORG_UNKNOWN_LABEL,
      isLinkedToOrg: Boolean(relation?.department_id || relation?.team_id || relation?.position_id || department),
    };
  };

  const resolveEmployeeById = (employeeId?: string | null) =>
    employeeId ? resolveEmployee(employeeById.get(employeeId) ?? { id: employeeId }) : emptyScope();

  const resolveTaskAssignee = (task: Pick<Task, "assigneeId" | "assigneeName">) =>
    resolveEmployee(employeeById.get(task.assigneeId) ?? findEmployeeByName(task.assigneeName) ?? {
      id: task.assigneeId,
      name: task.assigneeName,
    });

  const resolveClientManager = (client: Pick<Client, "accountManagerId" | "accountManagerName">) =>
    resolveEmployee(employeeById.get(client.accountManagerId) ?? findEmployeeByName(client.accountManagerName) ?? {
      id: client.accountManagerId,
      name: client.accountManagerName,
    });

  return {
    resolveEmployee,
    resolveEmployeeById,
    resolveTaskAssignee,
    resolveClientManager,
    taskSourceLabel: (task) => clean(task.clientName) ?? (clean(task.clientId) ? "عميل مرتبط" : "المصدر غير محدد"),
  };
}
