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

export async function fetchOwnerAuditLogCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from("owner_audit_logs")
    .select("*", { count: "exact", head: true });

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

export async function fetchAuditCenterLogs(
  limit = 100,
  offset = 0,
): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, owner_email, action, target_type, target_id, metadata, created_at")
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
