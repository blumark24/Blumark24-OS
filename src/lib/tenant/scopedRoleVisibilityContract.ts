import type { ScopedRoleResolution, TenantScopedRole } from "@/lib/tenant/scopedRoleResolver";

export type ScopedRoleVisibilityBoundary =
  | "organization"
  | "agency_subtree"
  | "management_subtree"
  | "department"
  | "employee_self";

export interface ScopedRoleVisibilityDefinition {
  scopedRole: TenantScopedRole;
  boundary: ScopedRoleVisibilityBoundary;
  description: string;
  organizationWide: boolean;
  includesSubtree: boolean;
  sourceField:
    | "managedAgencyIds"
    | "managedManagementIds"
    | "managedDepartmentIds"
    | "assignedDepartmentIds"
    | null;
  selfOnly: boolean;
  contractOnly: true;
  enforcementEnabled: false;
}

export interface ScopedRoleVisibilityContract extends ScopedRoleVisibilityDefinition {
  organizationId: string | null;
  agencyIds: string[];
  managementIds: string[];
  departmentIds: string[];
  assignedDepartmentIds: string[];
}

export const SCOPED_ROLE_VISIBILITY_DEFINITIONS: Record<
  TenantScopedRole,
  ScopedRoleVisibilityDefinition
> = {
  organization_manager: {
    scopedRole: "organization_manager",
    boundary: "organization",
    description: "Can see the full tenant organization boundary in future scoped views.",
    organizationWide: true,
    includesSubtree: true,
    sourceField: null,
    selfOnly: false,
    contractOnly: true,
    enforcementEnabled: false,
  },
  agency_manager: {
    scopedRole: "agency_manager",
    boundary: "agency_subtree",
    description: "Can see managed agencies and their subordinate units in future scoped views.",
    organizationWide: false,
    includesSubtree: true,
    sourceField: "managedAgencyIds",
    selfOnly: false,
    contractOnly: true,
    enforcementEnabled: false,
  },
  management_manager: {
    scopedRole: "management_manager",
    boundary: "management_subtree",
    description: "Can see managed management units and their subordinate departments in future scoped views.",
    organizationWide: false,
    includesSubtree: true,
    sourceField: "managedManagementIds",
    selfOnly: false,
    contractOnly: true,
    enforcementEnabled: false,
  },
  department_manager: {
    scopedRole: "department_manager",
    boundary: "department",
    description: "Can see directly managed departments in future scoped views.",
    organizationWide: false,
    includesSubtree: false,
    sourceField: "managedDepartmentIds",
    selfOnly: false,
    contractOnly: true,
    enforcementEnabled: false,
  },
  employee: {
    scopedRole: "employee",
    boundary: "employee_self",
    description: "Can see explicitly assigned departments and own records in future scoped views.",
    organizationWide: false,
    includesSubtree: false,
    sourceField: "assignedDepartmentIds",
    selfOnly: true,
    contractOnly: true,
    enforcementEnabled: false,
  },
};

export function getScopedRoleVisibilityDefinition(
  scopedRole: TenantScopedRole,
): ScopedRoleVisibilityDefinition {
  return SCOPED_ROLE_VISIBILITY_DEFINITIONS[scopedRole];
}

export function buildScopedRoleVisibilityContract(
  resolution: ScopedRoleResolution,
): ScopedRoleVisibilityContract {
  const definition = getScopedRoleVisibilityDefinition(resolution.scopedRole);

  return {
    ...definition,
    organizationId: resolution.organizationId,
    agencyIds:
      definition.sourceField === "managedAgencyIds" || definition.organizationWide
        ? resolution.managedAgencyIds
        : [],
    managementIds:
      definition.sourceField === "managedManagementIds" || definition.organizationWide
        ? resolution.managedManagementIds
        : [],
    departmentIds:
      definition.sourceField === "managedDepartmentIds" || definition.organizationWide
        ? resolution.managedDepartmentIds
        : [],
    assignedDepartmentIds:
      definition.sourceField === "assignedDepartmentIds"
        ? resolution.assignedDepartmentIds
        : [],
  };
}

export function listScopedRoleVisibilityDefinitions(): ScopedRoleVisibilityDefinition[] {
  return Object.values(SCOPED_ROLE_VISIBILITY_DEFINITIONS);
}
