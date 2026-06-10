import type { SupabaseClient } from "@supabase/supabase-js";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";

/**
 * TENANT-IDENTITY-INTEGRITY-HARDENING — shared server helper.
 *
 * Guarantees the tenant identity invariant for ONE user: a `profiles` row and an
 * `employees` row that share the same `id` and `organization_id`, with synced
 * email / name / status. Service-role only — the CALLER is responsible for
 * authorizing `userId` (self-scoped token, or an authorized provisioner).
 *
 * Behaviour:
 *  - Reads the profile by id. No profile → clear error (nothing to anchor to).
 *  - Missing employees row → creates it from the profile. Mirrors the proven
 *    create-user column set; role is forced to the constraint-safe 'employee'
 *    (employees_role_check forbids 'organization_manager'); the real tier is
 *    preserved in job_title for display.
 *  - Existing employees row → syncs only drifted email/name/status and heals a
 *    NULL organization_id to the profile's org. Never overwrites a non-null
 *    organization_id (no cross-tenant move) — flags it as a warning instead.
 *  - NEVER writes phone, NEVER touches salary, NEVER deletes anything.
 */

// Canonical employee status tokens (match create-user / update-user).
const STATUS_ACTIVE = "نشط";
const STATUS_INACTIVE = "غير_نشط";
// employees.department is NOT NULL; a healed row gets a safe default.
const DEFAULT_DEPARTMENT = "الإدارة";

export interface EnsuredEmployee {
  id: string;
  organization_id: string | null;
  email: string | null;
  name: string | null;
  status: string | null;
  phone: string | null;
}

export type EnsureEmployeeResult =
  | { ok: true; created: boolean; employee: EnsuredEmployee; warning?: string }
  | { ok: false; status: number; error: string; debug: string };

export async function ensureEmployeeRow(
  admin: SupabaseClient,
  userId: string,
): Promise<EnsureEmployeeResult> {
  if (!userId) {
    return { ok: false, status: 400, error: "تعذر تحديد المستخدم", debug: "ensureEmployee: empty userId" };
  }

  // 1) Anchor on the profile — the source of truth for id/org/identity.
  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("id, email, name, role, is_active, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    return { ok: false, status: 500, error: "تعذر قراءة الملف الشخصي", debug: `ensureEmployee profiles: ${profErr.message}` };
  }
  if (!prof) {
    return { ok: false, status: 404, error: "لا يوجد ملف شخصي مرتبط بهذا الحساب", debug: "ensureEmployee: no profile row" };
  }

  const profileOrgId = (prof.organization_id as string | null) ?? null;
  const profileEmail = typeof prof.email === "string" ? prof.email : null;
  const profileName = typeof prof.name === "string" ? prof.name : null;
  const profileRole = typeof prof.role === "string" ? prof.role : "employee";
  const desiredStatus = prof.is_active === false ? STATUS_INACTIVE : STATUS_ACTIVE;
  // organization_manager is not allowed by employees_role_check, so the row's
  // role is always the constraint-safe 'employee'; the authoritative role stays
  // in profiles.role. job_title still reflects the real tier for display.
  const jobTitle =
    profileRole === "organization_manager" ? "مدير المنشأة" : getTenantRoleLabel(profileRole);

  // 2) Is there already an employees row for this id?
  const { data: existing, error: existErr } = await admin
    .from("employees")
    .select("id, organization_id, email, name, status, phone")
    .eq("id", userId)
    .maybeSingle();

  if (existErr) {
    return { ok: false, status: 500, error: "تعذر قراءة سجل الموظف", debug: `ensureEmployee employees read: ${existErr.message}` };
  }

  if (existing) {
    // Sync only drifted identity fields. Never phone/salary. Heal NULL org;
    // never move a non-null org to another tenant.
    const patch: Record<string, unknown> = {};
    let warning: string | undefined;
    if (profileEmail && existing.email !== profileEmail) patch.email = profileEmail;
    if (profileName && existing.name !== profileName) patch.name = profileName;
    if (existing.status !== desiredStatus) patch.status = desiredStatus;
    const existingOrg = (existing.organization_id as string | null) ?? null;
    if (existingOrg === null && profileOrgId) {
      patch.organization_id = profileOrgId;
    } else if (existingOrg && profileOrgId && existingOrg !== profileOrgId) {
      warning = "تعارض المنشأة بين سجل الموظف والملف الشخصي — لم يتم تغييره تلقائياً";
    }

    if (Object.keys(patch).length === 0) {
      return { ok: true, created: false, employee: existing as EnsuredEmployee, warning };
    }
    const { data: updated, error: updErr } = await admin
      .from("employees")
      .update(patch)
      .eq("id", userId)
      .select("id, organization_id, email, name, status, phone")
      .maybeSingle();
    if (updErr) {
      return { ok: false, status: 500, error: "تعذر مزامنة سجل الموظف", debug: `ensureEmployee sync: ${updErr.message}` };
    }
    return { ok: true, created: false, employee: (updated ?? existing) as EnsuredEmployee, warning };
  }

  // 3) Missing → create from the profile. Mirrors create-user's column set.
  // phone and salary are intentionally omitted (never invent personal/comp data).
  const insertRow: Record<string, unknown> = {
    id: userId,
    name: profileName ?? profileEmail ?? "",
    email: profileEmail ?? "",
    role: "employee",
    department: DEFAULT_DEPARTMENT,
    job_title: jobTitle,
    status: desiredStatus,
    join_date: new Date().toISOString().split("T")[0],
    performance: 3,
    tasks: 0,
    completed_tasks: 0,
    ...(profileOrgId ? { organization_id: profileOrgId } : {}),
  };

  const { data: created, error: insErr } = await admin
    .from("employees")
    .insert(insertRow)
    .select("id, organization_id, email, name, status, phone")
    .maybeSingle();

  if (insErr) {
    return { ok: false, status: 500, error: "تعذر إنشاء سجل الموظف", debug: `ensureEmployee insert: ${insErr.message}` };
  }
  return { ok: true, created: true, employee: created as EnsuredEmployee };
}
