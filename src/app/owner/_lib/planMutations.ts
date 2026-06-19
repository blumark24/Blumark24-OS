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

function cleanNullableNumber(value: number | null, fieldName: string): number | null | OwnerPlanActionResult {
  if (value === null) return null;
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: `${fieldName} يجب أن يكون رقمًا صحيحًا أو فارغًا` };
  }
  return Math.round(value);
}

function cleanLimit(value: number | null, fieldName: string): number | OwnerPlanActionResult {
  if (value === null || !Number.isFinite(value)) {
    return { ok: false, error: `${fieldName} مطلوب` };
  }
  return Math.trunc(value);
}

export async function updatePlanPricing(input: UpdatePlanPricingInput): Promise<OwnerPlanActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم الباقة مطلوب" };

  const priceMonthly = cleanNullableNumber(input.priceMonthly, "السعر الشهري");
  if (typeof priceMonthly === "object") return priceMonthly;
  const priceAnnual = cleanNullableNumber(input.priceAnnual, "السعر السنوي");
  if (typeof priceAnnual === "object") return priceAnnual;

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
