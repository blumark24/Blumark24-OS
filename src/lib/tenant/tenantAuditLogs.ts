import type { SupabaseClient } from "@supabase/supabase-js";

// Sprint 2A — Tenant audit log helper.
// Foundation only. This module does not wire itself into any mutation
// path yet; callers will be added in Sprint 2B once the schema has soaked.

const TAG = "[tenantAuditLogs]";

// Metadata keys safe to persist. Any key not in this set is dropped before
// insert. Values that look like secrets are never accepted as keys.
export const TENANT_AUDIT_METADATA_ALLOWLIST = new Set<string>([
  "name",
  "before",
  "after",
  "fixed_room_key",
  "mapped_unit_type",
  "mapped_unit_id",
  "structure_level",
  "parent_id",
  "department_id",
  "team_id",
  "position_id",
  "employee_id",
  "reason",
  "note",
]);

const FORBIDDEN_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
];

/** Drop any key not in the allowlist or that looks like a secret. */
export function sanitizeAuditMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!TENANT_AUDIT_METADATA_ALLOWLIST.has(key)) continue;
    if (FORBIDDEN_KEY_PATTERNS.some((re) => re.test(key))) continue;
    out[key] = value;
  }
  return out;
}

export interface TenantAuditEventInput {
  client: SupabaseClient;
  organizationId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface TenantAuditEventResult {
  ok: boolean;
  error?: string;
}

/**
 * Best-effort insert into public.tenant_audit_logs. The caller's main
 * business action must not block on this — failures are logged and
 * returned so the caller can decide whether to surface them, but no
 * error is thrown.
 *
 * RLS does the real enforcement:
 *   - organization_id must equal current_org_id()
 *   - actor_user_id, when set, must equal auth.uid()
 *   - actor must satisfy can_manage_tenant_org()
 */
export async function logTenantAuditEvent(
  input: TenantAuditEventInput,
): Promise<TenantAuditEventResult> {
  if (!input.organizationId) {
    return { ok: false, error: "missing organization_id" };
  }

  const action = String(input.action ?? "").trim().slice(0, 80);
  const targetType = String(input.targetType ?? "").trim().slice(0, 80);
  if (!action || !targetType) {
    return { ok: false, error: "missing action or target_type" };
  }

  const actorEmail =
    typeof input.actorEmail === "string" && input.actorEmail.trim()
      ? input.actorEmail.trim().slice(0, 320)
      : null;

  const row = {
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId ?? null,
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: input.targetId ?? null,
    metadata: sanitizeAuditMetadata(input.metadata ?? {}),
  };

  try {
    const { error } = await input.client.from("tenant_audit_logs").insert(row);
    if (error) {
      console.warn(
        `${TAG} insert rejected (${action}/${targetType}):`,
        error.message,
      );
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`${TAG} unexpected error (${action}/${targetType}):`, msg);
    return { ok: false, error: msg };
  }
}
