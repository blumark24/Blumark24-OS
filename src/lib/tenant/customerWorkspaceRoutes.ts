/**
 * Customer Workspace route prefixes.
 * /owner remains handled separately by OwnerGuard.
 */
export const CUSTOMER_WORKSPACE_ROUTE_PREFIXES = [
  "/dashboard",
  "/employees",
  "/org",
  "/clients",
  "/tasks",
  "/finance",
  "/reports",
  "/ai",
  "/automation",
  "/automations",
  "/settings",
] as const;

export function isCustomerWorkspacePath(pathname: string): boolean {
  if (!pathname) return false;
  return CUSTOMER_WORKSPACE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const MISSING_ORGANIZATION_ERROR_MSG =
  "حسابك غير مربوط بمنشأة — تواصل مع الدعم";

/**
 * Temporary safety rollback:
 * Do not auto-redirect platform-style roles away from Customer Workspace.
 *
 * Reason: some valid Blumark/customer accounts currently carry elevated
 * profile roles while still needing access to the Customer Workspace. Until a
 * proper workspace switcher exists, Owner Panel remains protected by
 * /owner/OwnerGuard and Customer Workspace access must remain available.
 */
export function isPlatformSuperAdminRole(_role: string): boolean {
  return false;
}
