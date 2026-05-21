// Single source of truth for who counts as the Blumark24 platform owner.
// These accounts are the only ones allowed into the Owner Command Center
// (/owner). The same allowlist gates the privileged admin API routes
// (see src/app/api/admin/*), where it is paired with the super_admin role.
export const OWNER_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
}
