/**
 * Customer Workspace route prefixes (platform super_admin must not use as tenant).
 * Matches DB-FOUNDATION-4 scope; /owner is handled separately by OwnerGuard.
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

/** Platform roles that must use /owner, not Customer Workspace (raw profile.role). */
export function isPlatformSuperAdminRole(role: string): boolean {
  const r = String(role ?? "").trim();
  return (
    r === "super_admin" ||
    r === "admin" ||
    r === "general_manager" ||
    r === "board_chairman" ||
    r === "مدير_عام"
  );
}
