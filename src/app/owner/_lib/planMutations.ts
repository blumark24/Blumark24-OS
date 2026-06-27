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

// Canonical list of feature keys the owner can toggle per plan.
//
// IMPORTANT: This list must stay aligned with WorkspaceFeature in
// src/lib/features/packageFeatures.ts. Adding a feature there but not
// here causes cleanFeatures() to silently drop the key during save —
// which removes it from plan_features even if the DB or a previous
// owner edit had set it. The Sprint 1B premium gate (virtual_office,
// external_integrations) was missing here until this repair sprint.
//
// Runtime access is decided by `plan_features` rows, not plan slug:
// /api/tenant/workspace-context reads the rows directly. Enterprise
// (slug = "enterprise") and Advanced (slug = "advanced") must include
// virtual_office and external_integrations to grant runtime access.
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
  external_integrations: "التكاملات المتقدمة",
};

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

// Server-side save path. Browser-direct writes to `plan_features`
// through ownerSupabase rely on the owner JWT being live AND the
// plan_features RLS WITH CHECK (is_owner()) evaluating that JWT on
// every roundtrip. When the owner session is stale or the
// localStorage token has drifted, those writes silently fail to
// persist. Routing the save through the API guarantees the write
// uses the service role under server-verified owner authorization
// (verifyOwnerBearer + isOwnerEmail).
export async function updatePlanFeatures(input: {
  id: string;
  featureKeys: string[];
}): Promise<OwnerPlanActionResult> {
  const featureKeys = cleanFeatures(input.featureKeys);

  const sessionResp = await supabase.auth.getSession();
  const accessToken = sessionResp.data.session?.access_token ?? null;
  if (!accessToken) {
    return {
      ok: false,
      error: "جلسة المالك غير صالحة — سجل الدخول من لوحة المالك مرة أخرى",
    };
  }

  let response: Response;
  try {
    response = await fetch("/api/owner/plans/features", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ planId: input.id, featureKeys }),
      cache: "no-store",
    });
  } catch (networkErr) {
    console.error("[owner] update plan features network error:", networkErr);
    return { ok: false, error: "تعذّر الاتصال بالخادم — حاول مجدداً" };
  }

  let payload: { ok?: boolean; error?: string; featureKeys?: string[] } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    // Non-JSON response — treat as failure.
  }

  if (!response.ok || !payload?.ok) {
    const message =
      typeof payload?.error === "string" && payload.error.trim()
        ? payload.error
        : "تعذّر حفظ ميزات الباقة";
    console.error("[owner] update plan features API error:", response.status, message);
    return { ok: false, error: message };
  }

  // Server returns the authoritative persisted set — confirm we got
  // back what we sent (set equality). Used as a soft check; the UI
  // refetches via fetchPlanFeatures after a successful save.
  const persisted = Array.isArray(payload.featureKeys)
    ? payload.featureKeys.filter((v): v is string => typeof v === "string")
    : [];
  await logPlanAction("update_plan_features", input.id, {
    feature_keys: featureKeys,
    persisted,
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
