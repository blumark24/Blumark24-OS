export const ORGANIZATION_SCALE_TARGET = 1000;

export type OrganizationScaleFeature =
  | "owner_panel"
  | "subscriptions"
  | "roles"
  | "virtual_office"
  | "tasks"
  | "reports";

export interface OrganizationScopeContract {
  organizationId: string | null;
  feature: OrganizationScaleFeature;
  ownerPanelControlled: boolean;
}

export function hasValidOrganizationScope(contract: OrganizationScopeContract): boolean {
  return typeof contract.organizationId === "string" && contract.organizationId.length > 0;
}

export function isOwnerPanelControlled(contract: OrganizationScopeContract): boolean {
  return hasValidOrganizationScope(contract) && contract.ownerPanelControlled === true;
}

export function organizationScaleStatus(contract: OrganizationScopeContract): "ready" | "missing_scope" | "owner_panel_required" {
  if (!hasValidOrganizationScope(contract)) return "missing_scope";
  if (!isOwnerPanelControlled(contract)) return "owner_panel_required";
  return "ready";
}
