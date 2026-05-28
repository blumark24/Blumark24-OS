export const COMPANY_LABEL_AR = "الشركة";

export const COMPANY_UNLINKED_AR = "غير مرتبطة بمنشأة";

export function resolveCompanyDisplayName(input: {
  /** Prefer employee.organization_id on employee-based cards */
  organizationId?: string | null;
  namesById: Record<string, string>;
  workspaceOrganizationId?: string | null;
  workspaceOrganizationName?: string | null;
}): string {
  const orgId = input.organizationId?.trim() || null;
  if (!orgId) return COMPANY_UNLINKED_AR;

  const fromMap = input.namesById[orgId];
  if (fromMap?.trim()) return fromMap.trim();

  if (
    input.workspaceOrganizationId &&
    orgId === input.workspaceOrganizationId &&
    input.workspaceOrganizationName?.trim()
  ) {
    return input.workspaceOrganizationName.trim();
  }

  return COMPANY_UNLINKED_AR;
}

/** Employee-based card: employee org wins; profile org is fallback */
export function resolveCompanyForUserCard(input: {
  employeeOrganizationId?: string | null;
  profileOrganizationId?: string | null;
  namesById: Record<string, string>;
  workspaceOrganizationId?: string | null;
  workspaceOrganizationName?: string | null;
}): string {
  const primaryId = input.employeeOrganizationId ?? input.profileOrganizationId;
  return resolveCompanyDisplayName({
    organizationId: primaryId,
    namesById: input.namesById,
    workspaceOrganizationId: input.workspaceOrganizationId,
    workspaceOrganizationName: input.workspaceOrganizationName,
  });
}
