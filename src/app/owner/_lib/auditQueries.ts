import { ownerSupabase as supabase } from "@/lib/supabase/ownerClient";

export interface DbOwnerAuditLog {
  id: string;
  owner_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DisplayOwnerAuditLog {
  id: string;
  ownerEmail: string;
  action: string;
  actionLabel: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  risk: "low" | "medium" | "high";
}

export interface AuditCenterFilters {
  action?: string;
  targetType?: string;
  ownerEmail?: string;
  limit?: number;
}

const ACTION_LABELS: Record<string, string> = {
  create_plan: "إنشاء باقة",
  update_plan_pricing: "تعديل سعر الباقة",
  update_plan_limits: "تعديل حدود الباقة",
  update_plan_features: "تعديل ميزات الباقة",
  activate_plan: "تفعيل باقة",
  deactivate_plan: "تعطيل باقة",
  create_organization: "إنشاء منشأة",
  update_organization: "تعديل منشأة",
  change_plan: "تغيير باقة منشأة",
  suspend_organization: "تعليق منشأة",
  reactivate_organization: "إعادة تفعيل منشأة",
  soft_delete_organization: "حذف ناعم لمنشأة",
  create_client_login: "إنشاء حساب دخول عميل",
  reset_client_password: "إعادة تعيين كلمة مرور",
  activate_subscription: "تفعيل اشتراك",
  update_subscription: "تعديل اشتراك",
};

const HIGH_RISK_ACTIONS = new Set([
  "deactivate_plan",
  "soft_delete_organization",
  "suspend_organization",
]);

const MEDIUM_RISK_ACTIONS = new Set([
  "update_plan_pricing",
  "update_plan_limits",
  "update_plan_features",
  "change_plan",
  "reset_client_password",
  "activate_subscription",
  "update_subscription",
]);

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function riskForAction(action: string): DisplayOwnerAuditLog["risk"] {
  if (HIGH_RISK_ACTIONS.has(action)) return "high";
  if (MEDIUM_RISK_ACTIONS.has(action)) return "medium";
  return "low";
}

function targetLabel(row: DbOwnerAuditLog): string {
  const metadata = row.metadata ?? {};
  const name = metadata.name;
  const slug = metadata.slug;
  const planId = metadata.plan_id;
  const email = metadata.owner_email;

  if (typeof name === "string" && name.trim()) return name;
  if (typeof slug === "string" && slug.trim()) return slug;
  if (typeof email === "string" && email.trim()) return email;
  if (typeof planId === "string" && planId.trim()) return planId;
  if (row.target_id) return row.target_id.slice(0, 8);
  return "—";
}

function normalize(row: DbOwnerAuditLog): DisplayOwnerAuditLog {
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    action: row.action,
    actionLabel: ACTION_LABELS[row.action] ?? row.action,
    targetType: row.target_type ?? "—",
    targetId: row.target_id,
    targetLabel: targetLabel(row),
    metadata: row.metadata ?? {},
    createdAt: formatDateTime(row.created_at),
    risk: riskForAction(row.action),
  };
}

export async function fetchOwnerAuditLogs(filters: AuditCenterFilters = {}): Promise<DisplayOwnerAuditLog[]> {
  const limit = Math.min(Math.max(filters.limit ?? 100, 10), 250);
  let query = supabase
    .from("owner_audit_logs")
    .select("id, owner_email, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }
  if (filters.targetType && filters.targetType !== "all") {
    query = query.eq("target_type", filters.targetType);
  }
  if (filters.ownerEmail && filters.ownerEmail.trim()) {
    query = query.ilike("owner_email", `%${filters.ownerEmail.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[owner] audit logs fetch error:", error.message);
    throw new Error(error.message);
  }

  return ((data ?? []) as DbOwnerAuditLog[]).map(normalize);
}
