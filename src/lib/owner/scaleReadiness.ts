export const OWNER_PANEL_SCALE_READINESS = {
  targetOrganizations: 1000,
  organizationScopedReads: true,
  organizationScopedWrites: true,
  paginatedOrganizationLists: true,
  safeOwnerSummaries: true,
  auditImportantActions: true,
} as const;

export type OrganizationRecord = {
  organizationId?: string | null;
};

export function hasOrganizationScope(value: OrganizationRecord): boolean {
  return typeof value.organizationId === "string" && value.organizationId.length > 0;
}

export function keepOrganizationRecords<T extends OrganizationRecord>(
  organizationId: string | null | undefined,
  records: T[],
): T[] {
  if (!organizationId) return [];
  return (Array.isArray(records) ? records : []).filter((record) => record.organizationId === organizationId);
}
