// Owner dashboard truthfulness helpers — read-only, no schema changes.
// Surfaces real data when available; safe Arabic empty/unavailable states otherwise.

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
import { supabase } from "@/lib/supabaseClient";
import { timeAgo } from "@/lib/utils";
import type { Accent } from "../_data";

export const UNAVAILABLE_KPI_VALUE = "—";
export const UNAVAILABLE_KPI_HINT = "غير متاح بعد";
export const AI_TRACKING_DISABLED_MSG = "لم يتم تفعيل تتبع الاستخدام بعد";
export const AI_TRACKING_EMPTY_MSG = "لا توجد طلبات مسجّلة بعد";
export const ACTIVITY_EMPTY_MSG = "لا توجد نشاطات مسجّلة بعد";

export interface OwnerAuditEntry {
  id: string;
  title: string;
  detail: string;
  time: string;
  accent: Accent;
  icon: LucideIcon;
}

export interface AiUsageTruthState {
  trackingEnabled: boolean;
  totalRequests: number | null;
}

export interface OwnerKpiAggregates {
  activeOrgCount: number;
  monthlyRecurringRevenueSar: number | null;
  totalCustomerStaff: number | null;
  aiTrackingEnabled: boolean;
  aiUsageRequestCount: number | null;
}

interface PlanPricingRow {
  id: string;
  price_monthly: number | null;
  price_annual: number | null;
}

interface SubscriptionPricingRow {
  plan_id: string;
  status: string;
  billing_cycle: string;
}

interface OrganizationRow {
  id: string;
  status: string;
  is_internal: boolean;
  deleted_at: string | null;
}

const ACTION_META: Record<string, { title: string; accent: Accent; icon: LucideIcon }> = {
  create_organization: { title: "تم إنشاء منشأة", accent: "cyan", icon: Building2 },
  activate_subscription: { title: "تم تفعيل اشتراك", accent: "blue", icon: ArrowUpCircle },
  update_organization: { title: "تم تحديث منشأة", accent: "cyan", icon: Pencil },
  change_plan: { title: "تم تغيير الباقة", accent: "purple", icon: Layers },
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

/** Returns false when ai_usage_logs table is not deployed yet. */
export async function isAiUsageTrackingEnabled(): Promise<boolean> {
  const { error } = await supabase
    .from("ai_usage_logs")
    .select("id", { head: true, count: "exact" });

  if (!error) return true;
  if (isMissingTableError(error)) return false;
  console.warn("[owner] ai_usage_logs probe failed:", error.message);
  return false;
}

export async function fetchAiUsageTruthState(): Promise<AiUsageTruthState> {
  const trackingEnabled = await isAiUsageTrackingEnabled();
  if (!trackingEnabled) {
    return { trackingEnabled: false, totalRequests: null };
  }

  const { count, error } = await supabase
    .from("ai_usage_logs")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.warn("[owner] ai_usage_logs count failed:", error.message);
    return { trackingEnabled: true, totalRequests: null };
  }

  return { trackingEnabled: true, totalRequests: count ?? 0 };
}

/** Sum MRR from active/trialing subs when plan prices exist; null when pricing unavailable. */
export function computeMonthlyRecurringRevenueSar(
  subscriptions: SubscriptionPricingRow[],
  plans: PlanPricingRow[],
): number | null {
  const planById = new Map(plans.map((p) => [p.id, p]));
  const billable = subscriptions.filter(
    (s) => (s.status === "active" || s.status === "trialing") && s.billing_cycle !== "internal",
  );

  let total = 0;
  let pricedSubCount = 0;

  for (const sub of billable) {
    const plan = planById.get(sub.plan_id);
    if (!plan) continue;

    if (sub.billing_cycle === "annual") {
      if (plan.price_annual == null) continue;
      total += Number(plan.price_annual) / 12;
      pricedSubCount += 1;
      continue;
    }

    if (plan.price_monthly == null) continue;
    total += Number(plan.price_monthly);
    pricedSubCount += 1;
  }

  if (pricedSubCount === 0) return null;
  return Math.round(total * 100) / 100;
}

export function countActiveOrganizations(organizations: OrganizationRow[]): number {
  return organizations.filter(
    (o) => !o.deleted_at && o.status === "active" && o.is_internal !== true,
  ).length;
}

export async function fetchTotalCustomerStaffCount(customerOrgIds: string[]): Promise<number | null> {
  if (customerOrgIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .in("organization_id", customerOrgIds);

  if (error) {
    if (isMissingTableError(error)) return null;
    console.warn("[owner] employees KPI count failed:", error.message);
    return null;
  }

  return count ?? 0;
}

export async function buildOwnerKpiAggregates(input: {
  organizations: OrganizationRow[];
  subscriptions: SubscriptionPricingRow[];
  planPricing: PlanPricingRow[];
}): Promise<OwnerKpiAggregates> {
  const customerOrgIds = input.organizations
    .filter((o) => !o.deleted_at && !o.is_internal)
    .map((o) => o.id);

  const [totalCustomerStaff, aiState] = await Promise.all([
    fetchTotalCustomerStaffCount(customerOrgIds),
    fetchAiUsageTruthState(),
  ]);

  return {
    activeOrgCount: countActiveOrganizations(input.organizations),
    monthlyRecurringRevenueSar: computeMonthlyRecurringRevenueSar(
      input.subscriptions,
      input.planPricing,
    ),
    totalCustomerStaff,
    aiTrackingEnabled: aiState.trackingEnabled,
    aiUsageRequestCount: aiState.totalRequests,
  };
}

export async function fetchOwnerAuditTimeline(limit = 8): Promise<OwnerAuditEntry[]> {
  const { data, error } = await supabase
    .from("owner_audit_logs")
    .select("id, action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingTableError(error)) {
      console.warn("[owner] audit timeline fetch failed:", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => {
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
  });
}
