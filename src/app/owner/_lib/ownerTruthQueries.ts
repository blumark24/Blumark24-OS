// Owner dashboard read-only metrics — no schema changes.
// Surfaces real Supabase data when available; Arabic unavailable states otherwise.

import {
  Building2,
  ArrowUpCircle,
  PauseCircle,
  KeyRound,
  UserPlus,
  Pencil,
  Layers,
  Trash2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
// PR5-D: owner queries use the isolated owner auth client.
import { ownerSupabase as supabase } from "@/lib/supabase/ownerClient";
import { timeAgo } from "@/lib/utils";
import { OWNER_UNAVAILABLE_HINT } from "../_data";
import type { Accent } from "../_data";
import type { DbOrganization, DbPlanFull, DbSubscription } from "./ownerQueries";

export interface OwnerKpiValue {
  display: string;
  available: boolean;
  numericValue?: number | null;
}

export interface OwnerAuditEntry {
  id: string;
  title: string;
  detail: string;
  time: string;
  accent: Accent;
  icon: LucideIcon;
}

const ACTION_META: Record<string, { title: string; accent: Accent; icon: LucideIcon }> = {
  create_organization: { title: "تم إنشاء منشأة", accent: "cyan", icon: Building2 },
  activate_subscription: { title: "تم تفعيل اشتراك", accent: "blue", icon: ArrowUpCircle },
  update_organization: { title: "تم تحديث منشأة", accent: "cyan", icon: Pencil },
  change_plan: { title: "تم تغيير الباقة", accent: "purple", icon: Layers },
  create_plan: { title: "تم إنشاء باقة جديدة", accent: "cyan", icon: Layers },
  suspend_organization: { title: "تم تعليق منشأة", accent: "orange", icon: PauseCircle },
  reactivate_organization: { title: "تم إعادة تفعيل منشأة", accent: "green", icon: ArrowUpCircle },
  soft_delete_organization: { title: "تم حذف منشأة", accent: "orange", icon: Trash2 },
  create_client_login: { title: "تم إنشاء حساب عميل", accent: "green", icon: UserPlus },
  reset_client_password: { title: "تم إعادة تعيين كلمة مرور", accent: "orange", icon: KeyRound },
};

function formatAuditDetail(action: string, metadata: Record<string, unknown>): string {
  const name = typeof metadata.name === "string" ? metadata.name : null;
  if (name) return name;
  if (action === "change_plan" && metadata.plan_id) return "تحديث الباقة";
  if (action === "suspend_organization") return "حالة: معلّقة";
  if (action === "reactivate_organization") return "حالة: نشطة";
  return "إجراء مالك المنصة";
}

function isMissingTableError(error: { code?: string; message?: string }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205"
    || error.code === "42P01"
    || msg.includes("does not exist")
    || msg.includes("schema cache")
  );
}

function formatSar(amount: number): string {
  return `SAR ${Math.round(amount).toLocaleString("en-US")}`;
}

export function computeMrr(
  subs: DbSubscription[],
  orgs: DbOrganization[],
  plans: DbPlanFull[],
): OwnerKpiValue {
  const customerOrgIds = new Set(
    orgs.filter((o) => !o.is_internal && !o.deleted_at).map((o) => o.id),
  );

  const billableSubs = subs.filter(
    (s) =>
      customerOrgIds.has(s.organization_id)
      && (s.status === "active" || s.status === "trialing")
      && s.billing_cycle !== "internal",
  );

  if (billableSubs.length === 0) {
    return { display: formatSar(0), available: true, numericValue: 0 };
  }

  let total = 0;
  for (const sub of billableSubs) {
    const plan = plans.find((p) => p.id === sub.plan_id);
    if (!plan) {
      return { display: OWNER_UNAVAILABLE_HINT, available: false, numericValue: null };
    }

    if (sub.billing_cycle === "monthly") {
      if (plan.price_monthly == null) {
        return { display: OWNER_UNAVAILABLE_HINT, available: false, numericValue: null };
      }
      total += plan.price_monthly;
    } else if (sub.billing_cycle === "annual") {
      if (plan.price_annual == null) {
        return { display: OWNER_UNAVAILABLE_HINT, available: false, numericValue: null };
      }
      total += plan.price_annual / 12;
    }
  }

  return { display: formatSar(total), available: true, numericValue: total };
}

export async function fetchCustomerStaffCount(
  customerOrgIds: string[],
): Promise<OwnerKpiValue> {
  if (customerOrgIds.length === 0) {
    return { display: "0", available: true, numericValue: 0 };
  }

  const { count, error } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .in("organization_id", customerOrgIds);

  if (error) {
    if (isMissingTableError(error)) {
      return { display: OWNER_UNAVAILABLE_HINT, available: false, numericValue: null };
    }
    console.warn("[owner] employees count failed:", error.message);
    return { display: OWNER_UNAVAILABLE_HINT, available: false, numericValue: null };
  }

  return { display: String(count ?? 0), available: true, numericValue: count ?? 0 };
}

export async function fetchOwnerAuditTimelineForOrg(
  orgId: string,
  limit = 12,
): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, action, metadata, created_at, target_id")
    .or(`target_id.eq.${orgId},metadata->>organization_id.eq.${orgId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    console.warn("[owner] org audit timeline fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAuditRow(row));
}

function mapAuditRow(row: {
  id: unknown;
  action: unknown;
  metadata: unknown;
  created_at: unknown;
}): OwnerAuditEntry {
  const action = String(row.action ?? "");
  const meta = ACTION_META[action] ?? {
    title: action || "نشاط مالك المنصة",
    accent: "cyan" as Accent,
    icon: Sparkles,
  };
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;

  return {
    id: row.id as string,
    title: meta.title,
    detail: formatAuditDetail(action, metadata),
    time: timeAgo(String(row.created_at ?? "")),
    accent: meta.accent,
    icon: meta.icon,
  };
}

export async function fetchOwnerAuditTimeline(limit = 8): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    console.warn("[owner] audit timeline fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAuditRow(row));
}

export async function fetchOwnerAuditLogCount(
  filters: AuditLogFilters = {},
): Promise<number | null> {
  let q = supabase
    .from("owner_audit_logs")
    .select("*", { count: "exact", head: true });

  if (filters.targetType) q = q.eq("target_type", filters.targetType);
  if (filters.actions?.length) q = q.in("action", filters.actions);
  if (filters.excludeActions?.length)
    q = q.not("action", "in", `(${filters.excludeActions.map((a) => `"${a}"`).join(",")})`);
  if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
  if (filters.search?.trim()) {
    const t = filters.search.trim();
    q = q.or(`owner_email.ilike.%${t}%,action.ilike.%${t}%,target_type.ilike.%${t}%,target_id.ilike.%${t}%`);
  }

  const { count, error } = await q;

  if (error) {
    if (isMissingTableError(error)) return null;
    console.warn("[owner] audit log count failed:", error.message);
    return null;
  }

  return count ?? 0;
}

export async function fetchPlanAuditHistory(limit = 20): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, action, metadata, created_at, target_id")
    .in("action", ["create_plan", "change_plan"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingTableError(error)) return [];
    console.warn("[owner] plan audit history fetch failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapAuditRow(row));
}

// ─── Notification bell data ────────────────────────────────────────────────────
// Latest 10 audit log entries with owner_email + target_type for the bell
// dropdown, plus a flag for activity within the last 24 h (for the red dot).

export interface BellEntry {
  id: string;
  title: string;
  detail: string;
  ownerEmail: string;
  targetType: string | null;
  timeAgo: string;
}

export interface NotificationBellData {
  entries: BellEntry[];
  hasRecentActivity: boolean;
}

export async function fetchNotificationBellData(): Promise<NotificationBellData> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, action, owner_email, target_type, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    if (isMissingTableError(error)) return { entries: [], hasRecentActivity: false };
    console.warn("[owner] bell fetch failed:", error.message);
    return { entries: [], hasRecentActivity: false };
  }

  const rows = (data ?? []) as {
    id: string;
    action: string;
    owner_email: string;
    target_type: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }[];

  const oneDayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const hasRecentActivity = rows.some(
    (r) => now - new Date(r.created_at).getTime() < oneDayMs,
  );

  const entries: BellEntry[] = rows.map((row) => {
    const meta = ACTION_META[row.action] ?? {
      title: row.action || "نشاط مالك المنصة",
      accent: "cyan" as Accent,
      icon: Sparkles,
    };
    return {
      id: row.id,
      title: meta.title,
      detail: formatAuditDetail(row.action, row.metadata ?? {}),
      ownerEmail: row.owner_email,
      targetType: row.target_type,
      timeAgo: timeAgo(row.created_at),
    };
  });

  return { entries, hasRecentActivity };
}

// ─── Audit center raw log ──────────────────────────────────────────────────────
// Returns raw audit log rows for the B2 Audit Center page. Intentionally
// avoids icon/accent mapping so the UI can apply its own severity system.

export interface AuditLog {
  id: string;
  ownerEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Server-side filter params for audit log queries (C2 scale hardening).
// All fields are optional — omit to fetch without that filter.
export interface AuditLogFilters {
  // Exact match on target_type column
  targetType?: string;
  // IN filter — pass action list for severity-tier filtering
  actions?: string[];
  // NOT IN filter — pass action list to exclude (e.g. for "low" severity tier)
  excludeActions?: string[];
  // Lower bound on created_at (ISO string, inclusive)
  dateFrom?: string;
  // Free-text: OR search across owner_email, action, target_type, target_id
  search?: string;
}

export async function fetchAuditCenterLogs(
  limit = 100,
  offset = 0,
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  // Start with select; apply filters before order/range so PostgREST WHERE is correct
  let q = supabase
    .from("owner_audit_logs")
    .select("id, owner_email, action, target_type, target_id, metadata, created_at");

  if (filters.targetType) q = q.eq("target_type", filters.targetType);
  if (filters.actions?.length) q = q.in("action", filters.actions);
  if (filters.excludeActions?.length)
    q = q.not("action", "in", `(${filters.excludeActions.map((a) => `"${a}"`).join(",")})`);
  if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
  if (filters.search?.trim()) {
    const t = filters.search.trim();
    q = q.or(`owner_email.ilike.%${t}%,action.ilike.%${t}%,target_type.ilike.%${t}%,target_id.ilike.%${t}%`);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (isMissingTableError(error)) return [];
    console.warn("[owner] audit center fetch failed:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    ownerEmail: (row.owner_email as string) ?? "unknown",
    action: (row.action as string) ?? "",
    targetType: (row.target_type as string | null) ?? null,
    targetId: (row.target_id as string | null) ?? null,
    metadata: ((row.metadata ?? {}) as Record<string, unknown>),
    createdAt: (row.created_at as string) ?? "",
  }));
}

// ─── Org + Subscription status summaries ──────────────────────────────────────
// Lightweight read-only count queries for the intelligent operations center.

export interface OrgStatusSummary {
  total: number;
  active: number;
  suspended: number;
  deleted: number;
}

export interface SubStatusSummary {
  total: number;
  active: number;
  cancelled: number;
  suspended: number;
  trialing: number;
}

const EMPTY_ORG: OrgStatusSummary = { total: 0, active: 0, suspended: 0, deleted: 0 };
const EMPTY_SUB: SubStatusSummary = { total: 0, active: 0, cancelled: 0, suspended: 0, trialing: 0 };

// Uses parallel server-side count queries instead of fetching all rows client-side.
// At 1000+ orgs/subs, loading all rows just to count statuses is wasteful.
export async function fetchOrgStatusSummary(): Promise<OrgStatusSummary> {
  const [total, active, suspended, deleted] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_internal", false),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_internal", false).is("deleted_at", null).eq("status", "active"),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_internal", false).is("deleted_at", null).eq("status", "suspended"),
    supabase.from("organizations").select("*", { count: "exact", head: true }).eq("is_internal", false).not("deleted_at", "is", null),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_ORG;
    console.warn("[owner] org summary failed:", total.error.message);
    return EMPTY_ORG;
  }

  return {
    total:     total.count     ?? 0,
    active:    active.count    ?? 0,
    suspended: suspended.count ?? 0,
    deleted:   deleted.count   ?? 0,
  };
}

export async function fetchSubStatusSummary(): Promise<SubStatusSummary> {
  const [total, active, cancelled, canceled, suspended, trialing] = await Promise.all([
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal").eq("status", "active"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal").eq("status", "cancelled"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal").eq("status", "canceled"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal").eq("status", "suspended"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).neq("billing_cycle", "internal").eq("status", "trialing"),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_SUB;
    console.warn("[owner] sub summary failed:", total.error.message);
    return EMPTY_SUB;
  }

  return {
    total:     total.count     ?? 0,
    active:    active.count    ?? 0,
    cancelled: (cancelled.count ?? 0) + (canceled.count ?? 0),
    suspended: suspended.count ?? 0,
    trialing:  trialing.count  ?? 0,
  };
}

// ─── C3 Operations monitoring summaries ───────────────────────────────────────
// Read-only HEAD count queries for the new C3 foundation tables.
// Each returns null fields when the table doesn't exist yet.

export interface SystemErrorSummary {
  total: number | null;
  open: number | null;
  critical: number | null;
  latestAt: string | null;
}

export interface SystemAlertSummary {
  total: number | null;
  open: number | null;
  critical: number | null;
  latestAt: string | null;
}

export interface SupportTicketSummary {
  total: number | null;
  open: number | null;
  highPriority: number | null;
  latestAt: string | null;
}

export interface FeatureUsageSummary {
  todayCount: number | null;
  totalCount: number | null;
}

const EMPTY_ERROR_SUMMARY: SystemErrorSummary   = { total: null, open: null, critical: null, latestAt: null };
const EMPTY_ALERT_SUMMARY: SystemAlertSummary   = { total: null, open: null, critical: null, latestAt: null };
const EMPTY_TICKET_SUMMARY: SupportTicketSummary = { total: null, open: null, highPriority: null, latestAt: null };
const EMPTY_USAGE_SUMMARY: FeatureUsageSummary   = { todayCount: null, totalCount: null };

export async function fetchSystemErrorSummary(): Promise<SystemErrorSummary> {
  const [total, open, critical, latest] = await Promise.all([
    supabase.from("system_errors").select("*", { count: "exact", head: true }),
    supabase.from("system_errors").select("*", { count: "exact", head: true }).is("resolved_at", null),
    supabase.from("system_errors").select("*", { count: "exact", head: true }).eq("severity", "critical").is("resolved_at", null),
    supabase.from("system_errors").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_ERROR_SUMMARY;
    console.warn("[owner] system_errors summary failed:", total.error.message);
    return EMPTY_ERROR_SUMMARY;
  }

  const latestRow = (latest.data ?? []) as { created_at: string }[];
  return {
    total:    total.count   ?? 0,
    open:     open.count    ?? 0,
    critical: critical.count ?? 0,
    latestAt: latestRow[0]?.created_at ?? null,
  };
}

export async function fetchSystemAlertSummary(): Promise<SystemAlertSummary> {
  const [total, open, critical, latest] = await Promise.all([
    supabase.from("system_alerts").select("*", { count: "exact", head: true }),
    supabase.from("system_alerts").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("system_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical").eq("status", "open"),
    supabase.from("system_alerts").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_ALERT_SUMMARY;
    console.warn("[owner] system_alerts summary failed:", total.error.message);
    return EMPTY_ALERT_SUMMARY;
  }

  const latestRow = (latest.data ?? []) as { created_at: string }[];
  return {
    total:    total.count   ?? 0,
    open:     open.count    ?? 0,
    critical: critical.count ?? 0,
    latestAt: latestRow[0]?.created_at ?? null,
  };
}

export async function fetchSupportTicketSummary(): Promise<SupportTicketSummary> {
  const [total, open, highPriority, latest] = await Promise.all([
    supabase.from("support_tickets").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("priority", "high").eq("status", "open"),
    supabase.from("support_tickets").select("created_at").order("created_at", { ascending: false }).limit(1),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_TICKET_SUMMARY;
    console.warn("[owner] support_tickets summary failed:", total.error.message);
    return EMPTY_TICKET_SUMMARY;
  }

  const latestRow = (latest.data ?? []) as { created_at: string }[];
  return {
    total:       total.count       ?? 0,
    open:        open.count        ?? 0,
    highPriority: highPriority.count ?? 0,
    latestAt:    latestRow[0]?.created_at ?? null,
  };
}

export async function fetchFeatureUsageSummary(): Promise<FeatureUsageSummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, today] = await Promise.all([
    supabase.from("feature_usage_events").select("*", { count: "exact", head: true }),
    supabase.from("feature_usage_events").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_USAGE_SUMMARY;
    console.warn("[owner] feature_usage summary failed:", total.error.message);
    return EMPTY_USAGE_SUMMARY;
  }

  return {
    totalCount: total.count ?? 0,
    todayCount: today.count ?? 0,
  };
}

// ── C4: System Health Summary ─────────────────────────────────────────────────

export interface SystemHealthSummary {
  healthScore:          number;
  status:               "healthy" | "warning" | "critical";
  openErrors:           number;
  criticalErrors:       number;
  openAlerts:           number;
  criticalAlerts:       number;
  openTickets:          number;
  highPriorityTickets:  number;
  lastErrorAt:          string | null;
  lastAlertAt:          string | null;
  recommendedFocus:     string;
}

export async function fetchSystemHealthSummary(): Promise<SystemHealthSummary> {
  const [
    openErrors,
    criticalErrors,
    lastError,
    openAlerts,
    criticalAlerts,
    lastAlert,
    openTickets,
    highPriorityTickets,
  ] = await Promise.all([
    supabase.from("system_errors").select("*", { count: "exact", head: true }).is("resolved_at", null),
    supabase.from("system_errors").select("*", { count: "exact", head: true }).eq("severity", "critical").is("resolved_at", null),
    supabase.from("system_errors").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("system_alerts").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("system_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical").eq("status", "open"),
    supabase.from("system_alerts").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("priority", "high").eq("status", "open"),
  ]);

  // Gracefully handle missing tables (C3 not yet migrated)
  const oE  = openErrors.count           ?? 0;
  const cE  = criticalErrors.count       ?? 0;
  const oA  = openAlerts.count           ?? 0;
  const cA  = criticalAlerts.count       ?? 0;
  const oT  = openTickets.count          ?? 0;
  const hpT = highPriorityTickets.count  ?? 0;

  const lastErrorAt  = ((lastError.data  ?? []) as { created_at: string }[])[0]?.created_at ?? null;
  const lastAlertAt  = ((lastAlert.data  ?? []) as { created_at: string }[])[0]?.created_at ?? null;

  // Score: start at 100, deduct for open issues
  let score = 100;
  score -= cE  * 20; // each critical error is severe
  score -= cA  * 15; // each critical alert
  score -= oE  * 5;  // open errors
  score -= oA  * 3;  // open alerts
  score -= hpT * 5;  // high priority tickets
  score -= oT  * 1;  // open tickets
  const healthScore = Math.max(0, Math.min(100, Math.round(score)));

  let status: "healthy" | "warning" | "critical";
  if (healthScore >= 80 && cE === 0 && cA === 0) {
    status = "healthy";
  } else if (healthScore >= 50 || (cE === 0 && cA === 0)) {
    status = "warning";
  } else {
    status = "critical";
  }

  let recommendedFocus = "النظام في حالة جيدة";
  if (cE > 0) recommendedFocus = `${cE} خطأ حرج يتطلب معالجة فورية`;
  else if (cA > 0) recommendedFocus = `${cA} تنبيه حرج مفتوح`;
  else if (hpT > 0) recommendedFocus = `${hpT} تذكرة دعم عالية الأولوية`;
  else if (oE > 0) recommendedFocus = `${oE} خطأ مفتوح بانتظار المراجعة`;
  else if (oA > 0) recommendedFocus = `${oA} تنبيه مفتوح بانتظار المراجعة`;
  else if (oT > 0) recommendedFocus = `${oT} تذكرة دعم مفتوحة`;

  return {
    healthScore,
    status,
    openErrors:          oE,
    criticalErrors:      cE,
    openAlerts:          oA,
    criticalAlerts:      cA,
    openTickets:         oT,
    highPriorityTickets: hpT,
    lastErrorAt,
    lastAlertAt,
    recommendedFocus,
  };
}

// ── C5: Rate Limit Summary ────────────────────────────────────────────────────

export interface RateLimitSummary {
  totalToday:     number | null;
  blockedToday:   number | null;
  lastBlockedAt:  string | null;
  topRoute:       string | null;
}

const EMPTY_RL_SUMMARY: RateLimitSummary = {
  totalToday: null, blockedToday: null, lastBlockedAt: null, topRoute: null,
};

export async function fetchRateLimitSummary(): Promise<RateLimitSummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, blocked, lastBlocked, topRouteRow] = await Promise.all([
    supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString())
      .gt("blocked_count", 0),
    supabase
      .from("rate_limits")
      .select("updated_at")
      .gt("blocked_count", 0)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("rate_limits")
      .select("route")
      .gte("created_at", todayStart.toISOString())
      .gt("blocked_count", 0)
      .not("route", "is", null)
      .order("blocked_count", { ascending: false })
      .limit(1),
  ]);

  if (total.error) {
    if (isMissingTableError(total.error)) return EMPTY_RL_SUMMARY;
    console.warn("[owner] rate_limits summary failed:", total.error.message);
    return EMPTY_RL_SUMMARY;
  }

  const lastRow = (lastBlocked.data ?? []) as { updated_at: string }[];
  const topRow  = (topRouteRow.data ?? []) as { route: string }[];

  return {
    totalToday:    total.count   ?? 0,
    blockedToday:  blocked.count ?? 0,
    lastBlockedAt: lastRow[0]?.updated_at ?? null,
    topRoute:      topRow[0]?.route       ?? null,
  };
}

// ── C6: Feature Analytics Summary ─────────────────────────────────────────────

export interface FeatureAnalyticsSummary {
  eventsToday:                  number | null;
  events7d:                     number | null;
  activeOrganizations7d:        number | null;
  topFeatureToday:              string | null;
  topFeature7d:                 string | null;
  latestEventAt:                string | null;
  churnRiskOrganizations:       number | null;
  upgradeOpportunityOrganizations: number | null;
}

const EMPTY_ANALYTICS_SUMMARY: FeatureAnalyticsSummary = {
  eventsToday: null, events7d: null, activeOrganizations7d: null,
  topFeatureToday: null, topFeature7d: null, latestEventAt: null,
  churnRiskOrganizations: null, upgradeOpportunityOrganizations: null,
};

export async function fetchFeatureAnalyticsSummary(): Promise<FeatureAnalyticsSummary> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [eventsToday, events7d, activeOrgs7d, latestEvent, topToday, top7d, inactive30d] =
    await Promise.all([
      supabase.from("feature_usage_events").select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase.from("feature_usage_events").select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString()),
      supabase.from("feature_usage_events").select("organization_id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString())
        .not("organization_id", "is", null),
      supabase.from("feature_usage_events").select("created_at")
        .order("created_at", { ascending: false }).limit(1),
      // Top feature today: fetch up to 200 events and tally client-side
      supabase.from("feature_usage_events").select("feature_key")
        .gte("created_at", todayStart.toISOString()).limit(200),
      supabase.from("feature_usage_events").select("feature_key")
        .gte("created_at", sevenDaysAgo.toISOString()).limit(200),
      // Inactive orgs: orgs with no usage events in last 30 days (count via subscription proxy)
      supabase.from("organizations").select("*", { count: "exact", head: true })
        .eq("is_internal", false).is("deleted_at", null).eq("status", "active")
        .lt("updated_at", thirtyDaysAgo.toISOString()),
    ]);

  if (eventsToday.error) {
    if (isMissingTableError(eventsToday.error)) return EMPTY_ANALYTICS_SUMMARY;
    console.warn("[owner] feature analytics summary failed:", eventsToday.error.message);
    return EMPTY_ANALYTICS_SUMMARY;
  }

  // Tally top features client-side from capped rows
  function topFeatureFrom(rows: { feature_key: string }[]): string | null {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.feature_key] = (counts[r.feature_key] ?? 0) + 1;
    let best: string | null = null; let bestCount = 0;
    for (const [k, c] of Object.entries(counts)) { if (c > bestCount) { best = k; bestCount = c; } }
    return best;
  }

  const latestRow = (latestEvent.data ?? []) as { created_at: string }[];

  return {
    eventsToday:             eventsToday.count  ?? 0,
    events7d:                events7d.count     ?? 0,
    activeOrganizations7d:   activeOrgs7d.count ?? 0,
    topFeatureToday:         topToday.data ? topFeatureFrom(topToday.data as { feature_key: string }[]) : null,
    topFeature7d:            top7d.data   ? topFeatureFrom(top7d.data   as { feature_key: string }[]) : null,
    latestEventAt:           latestRow[0]?.created_at ?? null,
    churnRiskOrganizations:  inactive30d.count  ?? 0,
    upgradeOpportunityOrganizations: null, // future: needs subscription + usage join
  };
}

// ── C6: Tenant Activity Signals ───────────────────────────────────────────────

export interface TenantActivitySignals {
  activeTenants7d:    number | null;
  inactiveTenants30d: number | null;
  highUsageTenants7d: number | null;
  lowUsageTenants7d:  number | null;
  partial:            boolean;
}

export async function fetchTenantActivitySignals(): Promise<TenantActivitySignals> {
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [activeOrgs, inactiveOrgs, highUsage, lowUsage] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true })
      .eq("is_internal", false).is("deleted_at", null).eq("status", "active")
      .gte("updated_at", sevenDaysAgo.toISOString()),
    supabase.from("organizations").select("*", { count: "exact", head: true })
      .eq("is_internal", false).is("deleted_at", null).eq("status", "active")
      .lt("updated_at", thirtyDaysAgo.toISOString()),
    // High usage: organizations with >10 usage events in last 7 days
    // (approximate via distinct org count from a capped query)
    supabase.from("feature_usage_events").select("organization_id")
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("organization_id", "is", null)
      .limit(500),
    supabase.from("feature_usage_events").select("organization_id")
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("organization_id", "is", null)
      .limit(500),
  ]);

  // Tally org event counts from capped rows
  function orgCounts(rows: { organization_id: string }[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.organization_id] = (counts[r.organization_id] ?? 0) + 1;
    return counts;
  }

  const HIGH_THRESHOLD = 10;
  const LOW_THRESHOLD  = 2;

  let highCount: number | null = null;
  let lowCount:  number | null = null;
  if (highUsage.data) {
    const counts = orgCounts(highUsage.data as { organization_id: string }[]);
    highCount = Object.values(counts).filter(c => c >= HIGH_THRESHOLD).length;
    lowCount  = Object.values(counts).filter(c => c <= LOW_THRESHOLD).length;
  }

  return {
    activeTenants7d:    activeOrgs.error  ? null : (activeOrgs.count  ?? 0),
    inactiveTenants30d: inactiveOrgs.error ? null : (inactiveOrgs.count ?? 0),
    highUsageTenants7d: highCount,
    lowUsageTenants7d:  lowCount,
    partial: true, // usage-based signals are approximate from capped rows
  };
}
