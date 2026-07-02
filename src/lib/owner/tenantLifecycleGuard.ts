import type { SupabaseClient } from "@supabase/supabase-js";

// Phase 4C-1 — Owner tenant lifecycle guard.
//
// Organizations (customer tenants) are never hard deleted from the owner
// panel. "Delete" is always a soft delete: `deleted_at` is stamped and
// `status` moves to 'cancelled'. Rows stay in the database so billing
// history, audit trails, and tenant data remain intact at 1000+ client
// scale, and the org can be restored by clearing `deleted_at`.
//
// customer/organization codes are immutable and must never be reused.
// `organizations.organization_code` (and the legacy `customer_code`) are
// assigned once by the DB trigger on insert. No owner flow may update,
// recycle, or hand a released code to another organization — codes on
// soft-deleted orgs stay reserved forever.

const TAG = "[tenantLifecycleGuard]";

// Hard delete of organizations is permanently disabled in owner flows.
// This is a policy constant, not a feature flag: nothing may flip it at
// runtime, and the static verifier asserts it stays false.
export const ORGANIZATION_HARD_DELETE_ALLOWED = false as const;

// Tables checked (by organization_id) before any lifecycle transition.
// A tenant with rows in any of these must be archived (soft delete) or
// suspended — never removed.
export const TENANT_LIFECYCLE_LINKED_TABLES = [
  "subscriptions",
  "invoices",
  "employees",
  "tenant_audit_logs",
  "executive_office_room_mappings",
] as const;

export type TenantLifecycleLinkedTable = (typeof TENANT_LIFECYCLE_LINKED_TABLES)[number];

// Count per linked table. `null` means the count query failed; the guard
// treats unknown as "data may exist" and stays conservative.
export type TenantLinkedRecordCounts = Record<TenantLifecycleLinkedTable, number | null>;

export interface TenantLifecycleAssessment {
  organizationId: string;
  linkedRecords: TenantLinkedRecordCounts;
  // True when any linked table has rows or a count is unknown.
  hasLinkedRecords: boolean;
  checkErrors: string[];
}

export type TenantLifecycleAction = "hard_delete" | "soft_delete" | "suspend";

export interface TenantLifecycleDecision {
  action: TenantLifecycleAction;
  allowed: boolean;
  // The only destructive mode owner flows may perform.
  mode: "soft_delete_only";
  // Set when the requested action is refused and the org must be
  // archived (soft delete) or suspended instead.
  mustArchiveOrSuspendInstead: boolean;
  reason: string | null;
}

async function countLinkedRows(
  client: SupabaseClient,
  table: TenantLifecycleLinkedTable,
  organizationId: string,
): Promise<{ count: number | null; error: string | null }> {
  try {
    const { count, error } = await client
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) {
      return { count: null, error: `${table}: ${error.message}` };
    }
    return { count: count ?? 0, error: null };
  } catch (err) {
    return { count: null, error: `${table}: ${String(err)}` };
  }
}

// Read-only relationship audit. Never mutates anything; callers run this
// before soft delete / suspend so the decision (and the audit log) records
// what the tenant still owns.
export async function assessTenantLifecycle(
  client: SupabaseClient,
  organizationId: string,
): Promise<TenantLifecycleAssessment> {
  const linkedRecords = {} as TenantLinkedRecordCounts;
  const checkErrors: string[] = [];

  const results = await Promise.all(
    TENANT_LIFECYCLE_LINKED_TABLES.map(async (table) => ({
      table,
      ...(await countLinkedRows(client, table, organizationId)),
    })),
  );

  for (const { table, count, error } of results) {
    linkedRecords[table] = count;
    if (error) {
      checkErrors.push(error);
      console.warn(`${TAG} linked-record check failed:`, error);
    }
  }

  const hasLinkedRecords = TENANT_LIFECYCLE_LINKED_TABLES.some(
    (table) => linkedRecords[table] === null || (linkedRecords[table] ?? 0) > 0,
  );

  return { organizationId, linkedRecords, hasLinkedRecords, checkErrors };
}

// Decide whether a lifecycle action may proceed. Hard delete is refused
// unconditionally — with or without linked data — because organization
// rows anchor billing history, audit logs, and immutable organization
// codes. Soft delete and suspend stay available.
export function evaluateTenantLifecycleAction(
  action: TenantLifecycleAction,
  assessment: TenantLifecycleAssessment,
): TenantLifecycleDecision {
  if (action === "hard_delete") {
    return {
      action,
      allowed: ORGANIZATION_HARD_DELETE_ALLOWED,
      mode: "soft_delete_only",
      mustArchiveOrSuspendInstead: true,
      reason: assessment.hasLinkedRecords
        ? "Organization has linked records (subscriptions, invoices, employees, audit logs, or virtual office mappings). It must be archived (soft delete) or suspended — hard delete is never allowed."
        : "Hard delete of organizations is never allowed. Archive (soft delete) or suspend the organization instead so its immutable organization code is never reused.",
    };
  }

  return {
    action,
    allowed: true,
    mode: "soft_delete_only",
    mustArchiveOrSuspendInstead: false,
    reason: null,
  };
}

// Compact summary for owner_audit_logs metadata.
export function summarizeTenantLifecycleAssessment(
  assessment: TenantLifecycleAssessment,
): Record<string, number | string | boolean> {
  const summary: Record<string, number | string | boolean> = {
    has_linked_records: assessment.hasLinkedRecords,
  };
  for (const table of TENANT_LIFECYCLE_LINKED_TABLES) {
    const count = assessment.linkedRecords[table];
    summary[`linked_${table}`] = count === null ? "unknown" : count;
  }
  return summary;
}
