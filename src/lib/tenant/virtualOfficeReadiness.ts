import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  resolveTenantSession,
  type ResolvedTenantSession,
} from "@/lib/tenant/resolveTenantSession";

const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;
const VIRTUAL_OFFICE_FEATURE_KEY = "virtual_office";
const VIRTUAL_OFFICE_TABLE = "tenant_virtual_office_rooms";

type ReadyTenantSession = Extract<ResolvedTenantSession, { ok: true }>;

export type VirtualOfficeApiReadiness =
  | { ok: true; session: ReadyTenantSession }
  | { ok: false; response: NextResponse };

function json(payload: Record<string, unknown>, status: number) {
  return NextResponse.json(payload, { status });
}

function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isMissingVirtualOfficeTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  const text = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
  return (
    err.code === "PGRST205"
    || err.code === "42P01"
    || (
      text.includes(VIRTUAL_OFFICE_TABLE)
      && (
        text.includes("schema cache")
        || text.includes("does not exist")
        || text.includes("relation")
      )
    )
  );
}

export function virtualOfficeTableMissingResponse() {
  return json(
    {
      error: "إعداد المكتب الافتراضي غير مكتمل — تواصل مع الدعم",
      code: "virtual_office_table_missing",
    },
    503,
  );
}

async function resolveEffectivePlanId(
  admin: SupabaseClient,
  organizationId: string,
): Promise<
  | { ok: true; effectivePlanId: string | null }
  | { ok: false; response: NextResponse }
> {
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, plan_id, deleted_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgErr) {
    console.error("[virtual-office/readiness] organization lookup:", orgErr.message);
    return { ok: false, response: json({ error: "تعذر التحقق من المنشأة" }, 500) };
  }
  if (!org || org.deleted_at) {
    return { ok: false, response: json({ error: "المنشأة غير متاحة" }, 403) };
  }

  const { data: liveSubscriptions, error: subErr } = await admin
    .from("subscriptions")
    .select("plan_id, status, started_at, created_at, updated_at")
    .eq("organization_id", organizationId)
    .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
    .not("plan_id", "is", null)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (subErr) {
    console.error("[virtual-office/readiness] live subscription lookup:", subErr.message);
    return { ok: false, response: json({ error: "تعذر التحقق من اشتراك المنشأة" }, 500) };
  }

  const livePlanId = (liveSubscriptions?.[0]?.plan_id as string | null | undefined) ?? null;
  const organizationPlanId = (org.plan_id as string | null | undefined) ?? null;
  return { ok: true, effectivePlanId: livePlanId ?? organizationPlanId };
}

async function verifyVirtualOfficeFeature(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const planResult = await resolveEffectivePlanId(admin, organizationId);
  if (!planResult.ok) return planResult;

  if (!planResult.effectivePlanId) {
    return {
      ok: false,
      response: json({ error: "ميزة المكتب الافتراضي غير مفعلة لهذه الباقة" }, 403),
    };
  }

  const { data, error } = await admin
    .from("plan_features")
    .select("feature_key")
    .eq("plan_id", planResult.effectivePlanId)
    .eq("feature_key", VIRTUAL_OFFICE_FEATURE_KEY)
    .limit(1);

  if (error) {
    console.error("[virtual-office/readiness] feature lookup:", error.message);
    return { ok: false, response: json({ error: "تعذر التحقق من ميزات الباقة" }, 500) };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      response: json({ error: "ميزة المكتب الافتراضي غير مفعلة لهذه الباقة" }, 403),
    };
  }

  return { ok: true };
}

async function verifyVirtualOfficeTable(
  admin: SupabaseClient,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { error } = await admin
    .from(VIRTUAL_OFFICE_TABLE)
    .select("id", { count: "exact", head: true })
    .limit(1);

  if (!error) return { ok: true };
  if (isMissingVirtualOfficeTableError(error)) {
    console.error("[virtual-office/readiness] table missing:", error.message);
    return { ok: false, response: virtualOfficeTableMissingResponse() };
  }

  console.error("[virtual-office/readiness] table probe failed:", error.message);
  return { ok: false, response: json({ error: "تعذر التحقق من جاهزية المكتب الافتراضي" }, 503) };
}

export async function resolveVirtualOfficeApiReadiness(
  req: NextRequest,
): Promise<VirtualOfficeApiReadiness> {
  const session = await resolveTenantSession(req);
  if (!session.ok) {
    return {
      ok: false,
      response: json({ error: session.error, code: session.code }, session.status),
    };
  }

  const admin = createServiceClient();
  if (!admin) {
    return { ok: false, response: json({ error: "إعداد الخادم غير مكتمل" }, 500) };
  }

  const feature = await verifyVirtualOfficeFeature(admin, session.organizationId);
  if (!feature.ok) return feature;

  const table = await verifyVirtualOfficeTable(admin);
  if (!table.ok) return table;

  return { ok: true, session };
}
