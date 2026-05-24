/**
 * Defense-in-depth: apply tenant org filter on top of RLS.
 * Never use as the sole isolation mechanism.
 */
export function withOrganizationScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  organizationId: string | null | undefined,
): T {
  if (!organizationId) return query;
  return query.eq("organization_id", organizationId);
}
