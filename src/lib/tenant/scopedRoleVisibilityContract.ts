import type { ScopedRoleResolution, TenantScopedRole } from "@/lib/tenant/scopedRoleResolver";

export type TenantVisibilityBoundary =
  | "organization"
  | "managed_agencies"
  | "managed_managements"
  | "managed_departments"
  | "assigned_departments";

type VisibilitySourceField =
  | "managedAgencyIds"
  | "managedManagementIds"
  | "managedDepartmentIds"
  | "assignedDepartmentIds"
  | null;

export interface ScopedRoleVisibilityContract {
  scopedRole: TenantScopedRole;
  boundary: TenantVisibilityBoundary;
  organizationId: string | null;
  visibleAgencyIds: string[];
  visibleManagementIds: string[];
  visibleDepartmentIds: string[];
  ownRecordOnly: boolean;
  includesFutureChildren: boolean;
  contractOnly: true;
  enforcementEnabled: false;
  description: string;
}

export interface ScopedRoleVisibilityDefinition {
  scopedRole: TenantScopedRole;
  boundary: TenantVisibilityBoundary;
  sourceField: VisibilitySourceField;
  ownRecordOnly: boolean;
  includesFutureChildren: boolean;
  contractOnly: true;
  enforcementEnabled: false;
  description: string;
}

export const SCOPED_ROLE_VISIBILITY_DEFINITIONS: Record<
  TenantScopedRole,
  ScopedRoleVisibilityDefinition
> = {
  organization_manager: {
    scopedRole: "organization_manager",
    boundary: "organization",
    sourceField: null,
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view all data inside the current organization.",
  },
  agency_manager: {
    scopedRole: "agency_manager",
    boundary: "managed_agencies",
    sourceField: "managedAgencyIds",
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view managed agencies and their future child units.",
  },
  management_manager: {
    scopedRole: "management_manager",
    boundary: "managed_managements",
    sourceField: "managedManagementIds",
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view managed management units and their future child units.",
  },
  department_manager: {
    scopedRole: "department_manager",
    boundary: "managed_departments",
    sourceField: "managedDepartmentIds",
    ownRecordOnly: false,
    includesFutureChildren: false,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view directly managed departments.",
  },
  employee: {
    scopedRole: "employee",
    boundary: "assigned_departments",
    sourceField: "assignedDepartmentIds",
    ownRecordOnly: true,
    includesFutureChildren: false,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view assigned departments and the employee's own record in future enforcement.",
  },
};

export function listScopedRoleVisibilityDefinitions(): ScopedRoleVisibilityDefinition[] {
  return Object.values(SCOPED_ROLE_VISIBILITY_DEFINITIONS);
}

function readVisibleIds(
  resolution: ScopedRoleResolution,
  sourceField: VisibilitySourceField,
): string[] {
  return sourceField ? resolution[sourceField] : [];
}

export function buildScopedRoleVisibilityContract(
  resolution: ScopedRoleResolution,
): ScopedRoleVisibilityContract {
  const definition = SCOPED_ROLE_VISIBILITY_DEFINITIONS[resolution.scopedRole];
  const visibleIds = readVisibleIds(resolution, definition.sourceField);

  return {
    scopedRole: definition.scopedRole,
    boundary: definition.boundary,
    organizationId: resolution.organizationId,
    visibleAgencyIds: definition.sourceField === "managedAgencyIds" ? visibleIds : [],
    visibleManagementIds: definition.sourceField === "managedManagementIds" ? visibleIds : [],
    visibleDepartmentIds: definition.sourceField === "managedDepartmentIds" ||
      definition.sourceField === "assignedDepartmentIds"
      ? visibleIds
      : [],
    ownRecordOnly: definition.ownRecordOnly,
    includesFutureChildren: definition.includesFutureChildren,
    contractOnly: definition.contractOnly,
    enforcementEnabled: definition.enforcementEnabled,
    description: definition.description,
  };
}

export const defineScopedRoleVisibilityContract = buildScopedRoleVisibilityContract;
