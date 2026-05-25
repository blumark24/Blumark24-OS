import { createClient } from "@supabase/supabase-js";

export interface PlanLimitContext {
  organizationId: string | null;
  aiLevel: number | null;
  monthlyAiRequests: number;
}

const AI_REQUESTS_PER_LEVEL = 50;

export function getAiRequestCap(aiLevel: number | null): number | null {
  if (aiLevel == null || aiLevel <= 0) return null;
  return aiLevel * AI_REQUESTS_PER_LEVEL;
}

export async function loadPlanLimitContext(
  accessToken: string,
): Promise<{ ok: true; ctx: PlanLimitContext } | { ok: false; message: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, message: "إعداد الخادم غير مكتمل" };
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authErr } = await admin.auth.getUser(accessToken);
  if (authErr || !authData?.user) {
    return { ok: false, message: "جلسة غير صالحة" };
  }

  const userId = authData.user.id;
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const orgId = (profile?.organization_id as string | null) ?? null;
  if (!orgId) {
    return { ok: true, ctx: { organizationId: null, aiLevel: null, monthlyAiRequests: 0 } };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("plan_id")
    .eq("id", orgId)
    .maybeSingle();

  let aiLevel: number | null = null;
  if (org?.plan_id) {
    const { data: limitRow } = await admin
      .from("plan_limits")
      .select("limit_value")
      .eq("plan_id", org.plan_id)
      .eq("limit_key", "ai_level")
      .maybeSingle();
    aiLevel = limitRow?.limit_value ?? null;
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", monthStart.toISOString());

  return {
    ok: true,
    ctx: {
      organizationId: orgId,
      aiLevel,
      monthlyAiRequests: count ?? 0,
    },
  };
}

export async function logAiUsage(input: {
  organizationId: string | null;
  userId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) return;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await admin.from("ai_usage_logs").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    model: input.model,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
  });
}
