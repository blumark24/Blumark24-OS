/**
 * Canonical employee lifecycle status — shared across the Employees page,
 * mobile cards, and profile views so every tenant behaves identically.
 *
 * Canonical (written) values are Arabic: "نشط" / "غير_نشط".
 * Legacy rows may still hold the English "active" / "inactive" — those are
 * normalized for DISPLAY ONLY here; no DB migration is run by this layer.
 */

export const EMP_STATUS_ACTIVE = "نشط" as const;
export const EMP_STATUS_INACTIVE = "غير_نشط" as const;

/**
 * True when an employee should be treated as active for display + actions.
 * Accepts the canonical Arabic value and the legacy English "active".
 * Unknown / null / empty status is treated as NOT active (never throws).
 */
export function isEmployeeActive(status?: string | null): boolean {
  if (!status) return false;
  const s = status.trim().toLowerCase();
  return s === EMP_STATUS_ACTIVE || s === "active";
}

/** Canonical Arabic status value for a desired active/inactive state. */
export function canonicalEmployeeStatus(active: boolean): typeof EMP_STATUS_ACTIVE | typeof EMP_STATUS_INACTIVE {
  return active ? EMP_STATUS_ACTIVE : EMP_STATUS_INACTIVE;
}

/** Short Arabic label for a status badge (display only). */
export function employeeStatusLabel(status?: string | null): string {
  return isEmployeeActive(status) ? "نشط" : "غير نشط";
}
