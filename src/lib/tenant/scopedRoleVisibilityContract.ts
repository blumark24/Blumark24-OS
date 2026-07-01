import type { ScopedRoleResolution, TenantScopedRole } from "@/lib/tenant/scopedRoleResolver";

export type TenantVisibilityBoundary =
  | "organization"
  | "managed_agencies"
  | "managed_managements"
  | "managed_departments"
  | "assigned_departments";

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
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view all data inside the current organization.",
  },
  agency_manager: {
    scopedRole: "agency_manager",
    boundary: "managed_agencies",
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view managed agencies and their future child units.",
  },
  management_manager: {
    scopedRole: "management_manager",
    boundary: "managed_managements",
    ownRecordOnly: false,
    includesFutureChildren: true,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view managed management units and their future child units.",
  },
  department_manager: {
    scopedRole: "department_manager",
    boundary: "managed_departments",
    ownRecordOnly: false,
    includesFutureChildren: false,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view directly managed departments.",
  },
  employee: {
    scopedRole: "employee",
    boundary: "assigned_departments",
    ownRecordOnly: true,
    includesFutureChildren: false,
    contractOnly: true,
    enforcementEnabled: false,
    description: "Can view assigned departments and the employee's own record in future enforcement.",
  },
};

function emptyContract(
  scopedRole: TenantScopedRole,
  organizationId: string | null,
): ScopedRoleVisibilityContract {
  const definition = SCOPED_ROLE_VISIBILITY_DEFINITIONS.employee;
  return {
    scopedRole,
    boundary: definition.boundary,
    organizationId,
    visibleAgencyIds: [],
    visibleManagementIds: [],
    visibleDepartmentIds: [],
    ownRecordOnly: definition.ownRecordOnly,
    includesFutureChildren: definition.includesFutureChildren,
    contractOnly: definition.contractOnly,
    enforcementEnabled: definition.enforcementEnabled,
    description: definition.description,
  };
}

export function listScopedRoleVisibilityDefinitions(): ScopedRoleVisibilityDefinition[] {
  return Object.values(SCOPED_ROLE_VISIBILITY_DEFINITIONS);
}

export function buildScopedRoleVisibilityContract(
  resolution: ScopedRoleResolution,
): ScopedRoleVisibilityContract {
  const organizationId = resolution.organizationId;
  const definition = SCOPED_ROLE_VISIBILITY_DEFINITIONS[resolution.scopedRole];

  switch (resolution.scopedRole) {
    case "organization_manager":
      return {
        scopedRole: "organization_manager",
        boundary: definition.boundary,
        organizationId,
        visibleAgencyIds: [],
        visibleManagementIds: [],
        visibleDepartmentIds: [],
        ownRecordOnly: definition.ownRecordOnly,
        includesFutureChildren: definition.includesFutureChildren,
        contractOnly: definition.contractOnly,
        enforcementEnabled: definition.enforcementEnabled,
        description: definition.description,
      };

    case "agency_manager":
      return {
        scopedRole: "agency_manager",
        boundary: definition.boundary,
        organizationId,
        visibleAgencyIds: resolution.managedAgencyIds,
        visibleManagementIds: [],
        visibleDepartmentIds: [],
        ownRecordOnly: definition.ownRecordOnly,
        includesFutureChildren: definition.includesFutureChildren,
        contractOnly: definition.contractOnly,
        enforcementEnabled: definition.enforcementEnabled,
        description: definition.description,
      };

    case "management_manager":
      return {
        scopedRole: "management_manager",
        boundary: definition.boundary,
        organizationId,
        visibleAgencyIds: [],
        visibleManagementIds: resolution.managedManagementIds,
        visibleDepartmentIds: [],
        ownRecordOnly: definition.ownRecordOnly,
        includesFutureChildren: definition.includesFutureChildren,
        contractOnly: definition.contractOnly,
        enforcementEnabled: definition.enforcementEnabled,
        description: definition.description,
      };

    case "department_manager":
      return {
        scopedRole: "department_manager",
        boundary: definition.boundary,
        organizationId,
        visibleAgencyIds: [],
        visibleManagementIds: [],
        visibleDepartmentIds: resolution.managedDepartmentIds,
        ownRecordOnly: definition.ownRecordOnly,
        includesFutureChildren: definition.includesFutureChildren,
        contractOnly: definition.contractOnly,
        enforcementEnabled: definition.enforcementEnabled,
        description: definition.description,
      };

    case "employee":
      return {
        scopedRole: "employee",
        boundary: definition.boundary,
        organizationId,
        visibleAgencyIds: [],
        visibleManagementIds: [],
        visibleDepartmentIds: resolution.assignedDepartmentIds,
        ownRecordOnly: definition.ownRecordOnly,
        includesFutureChildren: definition.includesFutureChildren,
        contractOnly: definition.contractOnly,
        enforcementEnabled: definition.enforcementEnabled,
        description: definition.description,
      };

    default:
      return emptyContract(resolution.scopedRole, organizationId);
  }
}

export const defineScopedRoleVisibilityContract = buildScopedRoleVisibilityContract;
