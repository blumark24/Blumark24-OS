import { ownerSupabase as supabase } from "@/lib/supabase/ownerClient";
import type { PlanLimitsValues } from "./ownerQueries";

export interface OwnerPlanActionResult {
  ok: boolean;
  error?: string;
}

export interface UpdatePlanPricingInput {
  id: string;
  name: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  sortOrder: number;
}

export interface UpdatePlanLimitsInput {
  id: string;
  limits: PlanLimitsValues;
}

export const OWNER_WORKSPACE_FEATURES = [
  "dashboard",
  "tasks",
  "clients",
  "employees",
  "reports",
  "org",
  "finance",
  "strategy",
  "automation",
  "ai",
  "virtual_office",
  "external_integrations",
] as const;

export type OwnerWorkspaceFeature = typeof OWNER_WORKSPACE_FEATURES[number];

const VALID_FEATURES = new Set<string>(OWNER_WORKSPACE_FEATURES);

export const OWNER_FEATURE_LABELS_AR: Record<OwnerWorkspaceFeature, string> = {
  dashboard: "لوحة التحكم",
  tasks: "المهام",
  clients: "العملاء",
  employees: "الموظفون",
  reports: "التقارير",
  org: "الهيكل الإداري",
  finance: "المالية",
  strategy: "الاستراتيجية",
  automation: "الأتمتة",
  ai: "الذكاء الاصطناعي",
  virtual_office: "المكتب الافتراضي",
  external_integrations: "التكاملات الخارجية",
};

const WORKSPACE_CONTEXT_REFRESH_KEY = "blumark_workspace_context_refresh";
const WORKSPACE_CONTEXT_REFRESH_EVENT = "blumark:workspace-context-refresh";
const WORKSPACE_CONTEXT_REFRESH_CHANNEL = "blumark:workspace-plan-events";

function signalPlanFeaturesChanged(payload: {
  planId: string;
  featureKeys: OwnerWorkspaceFeature[];
  updatedAt: string;
}) {
  if (typeof window === "undefined") return;

  const message = {
    type: "plan_features_changed",
    planId: payload.planId,
    featureKeys: payload.featureKeys,
    updatedAt: payload.updatedAt,
    stamp: Date.now(),
  };

  try {
    window.localStorage.setItem(WORKSPACE_CONTEXT_REFRESH_KEY, JSON.stringify(message));
  } catch {
    /* storage may be unavailable in restricted browsers */
  }

  try {
    window.dispatchEvent(new CustomEvent(WORKSPACE_CONTEXT_REFRESH_EVENT, { detail: message }));
  } catch {
    /* custom events may be unavailable in older embedded browsers */
  }

  try {
    const channel = new BroadcastChannel(WORKSPACE_CONTEXT_REFRESH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    /* BroadcastChannel is best-effort; focus/pageshow refresh remains as fallback */
  }
}

async function logPlanAction(
  action: string,
  planId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("owner_audit_logs").insert({
      owner_email: user?.email ?? "unknown",
      action,
      target_type: "plan",
      target_id: planId,
      metadata,
    });
  } catch (logErr) {
    console.warn(`[owner] plan audit log insert failed (${action}):`, logErr);
  }
}

function cleanNullableNumber(
  value: number | null,
  fieldName: string,
): { valid: true; value: number | null } | { valid: false; error: OwnerPlanActionResult } {
  if (value === null) return { valid: true, value: null };
  if (!Number.isFinite(value) || value < 0) {
    return { valid: false, error: { ok: false, error: `${fieldName} يجب أن يكون رقمًا صحيحًا أو فارغًا` } };
  }
  return { valid: true, value: Math.round(value) };
}

function cleanLimit(value: number | null, fieldName: string): number | OwnerPlanActionResult {
  if (value === null || !Number.isFinite(value)) {
    return { ok: false, error: `${fieldName} مطلوب` };
  }
  return Math.trunc(value);
}

function cleanFeatures(featureKeys: string[]): OwnerWorkspaceFeature[] {
  return Array.from(new Set(featureKeys))
    .filter((key): key is OwnerWorkspaceFeature => VALID_FEATURES.has(key));
}

export async function fetchPlanFeatures(planId: string): Promise<OwnerWorkspaceFeature[]> {
  const { data, error } = await supabase
    .from("plan_features")
    .select("feature_key")
    .eq("plan_id", planId);

  if (error) {
    console.error("[owner] fetch plan features error:", error.message);
    throw new Error("تعذّر تحميل ميزات الباقة");
  }

  return cleanFeatures((data ?? []).map((row) => String(row.feature_key)));
}

export async function updatePlanFeatures(input: {
  id: string;
  featureKeys: string[];
}): Promise<OwnerPlanActionResult> {
  const featureKeys = cleanFeatures(input.featureKeys);

  const { data: currentRows, error: fetchErr } = await supabase
    .from("plan_features")
    .select("feature_key")
    .eq("plan_id", input.id);

  if (fetchErr) {
    console.error("[owner] fetch current plan features error:", fetchErr.message);
    return { ok: false, error: "تعذّر قراءة ميزات الباقة الحالية" };
  }

  const current = cleanFeatures((currentRows ?? []).map((row) => String(row.feature_key)));
  const selected = new Set(featureKeys);
  const toDelete = current.filter((key) => !selected.has(key));

  if (toDelete.length > 0) {
    const { error: deleteErr } = await supabase
      .from("plan_features")
      .delete()
      .eq("plan_id", input.id)
      .in("feature_key", toDelete);

    if (deleteErr) {
      console.error("[owner] delete plan features error:", deleteErr.message);
      return { ok: false, error: "تعذّر حذف الميزات غير المطلوبة" };
    }
  }

  if (featureKeys.length > 0) {
    const { error: upsertErr } = await supabase
      .from("plan_features")
      .upsert(
        featureKeys.map((featureKey) => ({ plan_id: input.id, feature_key: featureKey })),
        { onConflict: "plan_id,feature_key" },
      );

    if (upsertErr) {
      console.error("[owner] upsert plan features error:", upsertErr.message);
      return { ok: false, error: "تعذّر حفظ ميزات الباقة" };
    }
  }

  await logPlanAction("update_plan_features", input.id, { feature_keys: featureKeys });
  signalPlanFeaturesChanged({
    planId: input.id,
    featureKeys,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function updatePlanPricing(input: UpdatePlanPricingInput): Promise<OwnerPlanActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم الباقة مطلوب" };

  const monthlyResult = cleanNullableNumber(input.priceMonthly, "السعر الشهري");
  if (!monthlyResult.valid) return monthlyResult.error;
  const priceMonthly = monthlyResult.value;
  const annualResult = cleanNullableNumber(input.priceAnnual, "السعر السنوي");
  if (!annualResult.valid) return annualResult.error;
  const priceAnnual = annualResult.value;

  if (!Number.isFinite(input.sortOrder) || input.sortOrder < 1) {
    return { ok: false, error: "ترتيب الباقة يجب أن يكون رقمًا أكبر من صفر" };
  }

  const payload = {
    name,
    price_monthly: priceMonthly,
    price_annual: priceAnnual,
    sort_order: Math.trunc(input.sortOrder),
  };

  const { error } = await supabase
    .from("plans")
    .update(payload)
    .eq("id", input.id);

  if (error) {
    console.error("[owner] update plan pricing error:", error.message);
    return { ok: false, error: "تعذّر تحديث بيانات الباقة — حاول مجددًا" };
  }

  await logPlanAction("update_plan_pricing", input.id, payload);
  return { ok: true };
}

export async function setPlanActive(input: { id: string; isActive: boolean }): Promise<OwnerPlanActionResult> {
  const { error } = await supabase
    .from("plans")
    .update({ is_active: input.isActive })
    .eq("id", input.id);

  if (error) {
    console.error("[owner] set plan active error:", error.message);
    return { ok: false, error: "تعذّر تحديث حالة الباقة — حاول مجددًا" };
  }

  await logPlanAction(input.isActive ? "activate_plan" : "deactivate_plan", input.id, {
    is_active: input.isActive,
  });
  return { ok: true };
}

export async function updatePlanLimits(input: UpdatePlanLimitsInput): Promise<OwnerPlanActionResult> {
  const limitRows = [
    ["max_employees", input.limits.maxEmployees, "الحد الأقصى للموظفين"],
    ["max_agencies", input.limits.maxAgencies, "الحد الأقصى للوكالات"],
    ["max_departments", input.limits.maxDepartments, "الحد الأقصى للإدارات"],
    ["max_sections", input.limits.maxSections, "الحد الأقصى للأقسام"],
    ["ai_level", input.limits.aiLevel, "مستوى الذكاء الاصطناعي"],
    ["whatsapp_enabled", input.limits.whatsappEnabled, "واتساب بوت"],
  ] as const;

  const rows: { plan_id: string; limit_key: string; limit_value: number }[] = [];
  for (const [limitKey, rawValue, label] of limitRows) {
    const cleaned = cleanLimit(rawValue, label);
    if (typeof cleaned === "object") return cleaned;
    rows.push({ plan_id: input.id, limit_key: limitKey, limit_value: cleaned });
  }

  const { error } = await supabase
    .from("plan_limits")
    .upsert(rows, { onConflict: "plan_id,limit_key" });

  if (error) {
    console.error("[owner] update plan limits error:", error.message);
    return { ok: false, error: "تعذّر تحديث حدود الباقة — حاول مجددًا" };
  }

  await logPlanAction("update_plan_limits", input.id, {
    limits: Object.fromEntries(rows.map((r) => [r.limit_key, r.limit_value])),
  });
  return { ok: true };
}
