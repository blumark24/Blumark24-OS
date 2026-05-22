/** Server-side platform admin allowlist (comma-separated env). */
export function getPlatformAdminEmails(): string[] {
  const raw =
    process.env.PLATFORM_ADMIN_EMAILS ??
    "blumark24@gmail.com,blumark.sa@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return getPlatformAdminEmails().includes(normalized);
}
