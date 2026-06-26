import { ORGANIZATION_SCALE_TARGET } from "@/lib/owner/organizationScaleContract";

export const VIRTUAL_COMMAND_OFFICE_SCALE = {
  targetOrganizations: ORGANIZATION_SCALE_TARGET,
  officesPerOrganization: 9,
  ownerPanelControlled: true,
  scopedByOrganization: true,
  scopedByOffice: true,
  scopedByDepartmentOrTeam: true,
} as const;

export type OfficeScaleReadiness = "ready" | "missing_organization" | "missing_office" | "not_linked";

export interface OfficeScaleContract {
  organizationId: string | null;
  officeId: string | null;
  linkedUnitId: string | null;
}

export function officeScaleReadiness(contract: OfficeScaleContract): OfficeScaleReadiness {
  if (!contract.organizationId) return "missing_organization";
  if (!contract.officeId) return "missing_office";
  if (!contract.linkedUnitId) return "not_linked";
  return "ready";
}

export function isOfficeReadyForOperationalData(contract: OfficeScaleContract): boolean {
  return officeScaleReadiness(contract) === "ready";
}
