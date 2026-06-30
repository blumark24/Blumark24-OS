import { fetchOrgStructure } from "@/lib/org/structureDb";
import type { Department, EmployeeRelation, OrgStructureSnapshot } from "@/lib/org/types";

export type TenantScopedRole =
  | "organization_manager"
  | "agency_manager"
  | "management_manager"
  | "department_manager"
  | "employee";

export interface ScopedRoleProfile {
  id: string;
  role: string | null;
  organization_id: string | null;
  employeeIds?: string[] | null;
}

export interface ScopedRoleResolution {
  baseRole: string;
  scopedRole: TenantScopedRole;
  organizationId: string | null;
  managedAgencyIds: string[];
  managedManagementIds: string[];
  managedDepartmentIds: string[];
  assignedDepartmentIds: string[];
  isOrganizationManager: boolean;
  isScopedManager: boolean;
}

interface ResolveScopedRoleInput {
  profile: ScopedRoleProfile | null | undefined;
  structure?: Partial<Pick<OrgStructureSnapshot, "departments" | "relations">> | null;
}

const ORGANIZATION_MANAGER_ROLES = new Set([
  "organization_manager",
  "board_member",
  "super_admin",
]);

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? "employee").trim().toLowerCase() || "employee";
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
}

function isSameOrganization(
  organizationId: string | null,
  item: Pick<Department | EmployeeRelation, "organization_id">,
): boolean {
  return organizationId !== null && item.organization_id === organizationId;
}

function findManagedDepartments(
  profileId: string | null,
  organizationId: string | null,
  departments: Department[],
): Department[] {
  if (!profileId) return [];

  return departments.filter((department) => {
    if (!isSameOrganization(organizationId, department)) return false;
    return department.manager_id === profileId;
  });
}

function findAssignedDepartmentIds(
  employeeIds: string[] | null | undefined,
  organizationId: string | null,
  relations: EmployeeRelation[],
): string[] {
  const scopedEmployeeIds = new Set(uniqueIds(employeeIds ?? []));
  if (scopedEmployeeIds.size === 0) return [];

  // departments.manager_id references profiles, while employee_relations.employee_id
  // references employees. Do not assume those ids are the same; callers must pass
  // explicit employee ids if they want employee assignment scope included.
  return uniqueIds(
    relations
      .filter((relation) => isSameOrganization(organizationId, relation))
      .filter((relation) => scopedEmployeeIds.has(relation.employee_id))
      .map((relation) => relation.department_id),
  );
}

export function resolveScopedRoleFromOrgStructure({
  profile,
  structure,
}: ResolveScopedRoleInput): ScopedRoleResolution {
  const baseRole = normalizeRole(profile?.role);
  const organizationId = profile?.organization_id ?? null;
  const profileId = profile?.id ?? null;
  const departments = structure?.departments ?? [];
  const relations = structure?.relations ?? [];
  const isOrganizationManager =
    organizationId !== null && ORGANIZATION_MANAGER_ROLES.has(baseRole);

  const managedDepartments = findManagedDepartments(
    profileId,
    organizationId,
    departments,
  );

  const managedAgencyIds = uniqueIds(
    managedDepartments
      .filter((department) => department.structure_level === "agency")
      .map((department) => department.id),
  );

  const managedManagementIds = uniqueIds(
    managedDepartments
      .filter((department) => department.structure_level === "management")
      .map((department) => department.id),
  );

  const managedDepartmentIds = uniqueIds(
    managedDepartments
      .filter((department) => department.structure_level === "department")
      .map((department) => department.id),
  );

  const assignedDepartmentIds = findAssignedDepartmentIds(
    profile?.employeeIds,
    organizationId,
    relations,
  );

  const scopedRole: TenantScopedRole = isOrganizationManager
    ? "organization_manager"
    : managedAgencyIds.length > 0
      ? "agency_manager"
      : managedManagementIds.length > 0
        ? "management_manager"
        : managedDepartmentIds.length > 0
          ? "department_manager"
          : "employee";

  return {
    baseRole,
    scopedRole,
    organizationId,
    managedAgencyIds,
    managedManagementIds,
    managedDepartmentIds,
    assignedDepartmentIds,
    isOrganizationManager,
    isScopedManager: scopedRole !== "organization_manager" && scopedRole !== "employee",
  };
}

export async function resolveCurrentScopedRole(
  profile: ScopedRoleProfile | null | undefined,
): Promise<ScopedRoleResolution> {
  const structure = await fetchOrgStructure();
  return resolveScopedRoleFromOrgStructure({ profile, structure });
}
