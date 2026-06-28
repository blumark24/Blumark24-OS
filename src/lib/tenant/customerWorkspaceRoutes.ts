/**
 * Customer Workspace route prefixes.
 * /owner remains handled separately by OwnerGuard.
 */
import { isOwnerEmail } from "@/lib/owner";

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
  "/virtual-office",
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
 *
 * PR5-C: this role-based check is intentionally still inert. Authoritative
 * platform-owner gating for auth routing now flows through the email
 * allowlist via `isPlatformOwnerEmail` below + `isOwnerEmail` in
 * `@/lib/owner`, which is the same source of truth OwnerGuard uses.
 */
export function isPlatformSuperAdminRole(_role: string): boolean {
  return false;
}

/**
 * Authoritative platform-owner check for auth routing.
 *
 * Email-based — never role-based — so a tampered `profiles.role` column can
 * neither grant nor revoke owner access. This is the single source of truth
 * AuthContext consults when deciding whether to send the user to /owner or
 * to a customer dashboard. OwnerGuard already uses `isOwnerEmail` directly;
 * this wrapper exists so callers don't need to import the owner module.
 */
export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  return isOwnerEmail(email);
}
