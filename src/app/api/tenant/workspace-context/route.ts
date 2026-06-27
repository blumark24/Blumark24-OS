import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  normalizePlanSlug,
  type PlanSlug,
  type WorkspaceFeature,
} from "@/lib/features/packageFeatures";
import { isPlatformAdminEmail } from "@/lib/platformAdmins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

function jsonNoStore(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return jsonNoStore({ error: "إعداد الخادم غير مكتمل" }, 500);
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonNoStore({ error: "غير مصرح" }, 401);
    }
    const token = authHeader.slice(7);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return jsonNoStore({ error: "جلسة غير صالحة" }, 401);
    }

    const userId = authData.user.id;
    const email = authData.user.email ?? "";

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("role, organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("[workspace-context] profile error:", profErr.message);
      return jsonNoStore({ error: "تعذر قراءة الملف الشخصي" }, 500);
    }

    const role = String(profile?.role ?? "");
    const orgId = profile?.organization_id as string | null | undefined;

    const isPlatformAdmin =
      isPlatformAdminEmail(email) || role === "super_admin";

    const emptyPayload = {
      planSlug: "basic" as PlanSlug,
      planId: null as string | null,
      planName: null as string | null,
      enabledFeatures: [] as WorkspaceFeature[],
      planLimits: {} as Record<string, number>,
      featuresConfigured: false,
      isPlatformAdmin,
      organizationId: orgId ?? null,
      organizationStatus: null as string | null,
      organizationUpdatedAt: null as string | null,
      effectivePlanId: null as string | null,
      effectivePlanSlug: null as string | null,
      effectivePlanSource: "none" as "live_subscription" | "organization" | "none",
      organizationPlanId: null as string | null,
      liveSubscriptionPlanId: null as string | null,
      planMismatch: false,
      contextVersion: new Date().toISOString(),
    };

    if (!orgId) {
      return jsonNoStore({
        ...emptyPayload,
        planSlug: "basic",
        enabledFeatures: [],
        featuresConfigured: false,
        organizationStatus: null,
      });
    }

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, plan_id, status, deleted_at, updated_at")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) {
      console.error("[workspace-context] org error:", orgErr.message);
      return jsonNoStore({ error: "تعذر قراءة بيانات المنشأة" }, 500);
    }

    if (!org || org.deleted_at) {
      return jsonNoStore({
        ...emptyPayload,
        organizationStatus: "missing",
      });
    }

    const organizationPlanId = (org.plan_id as string | null | undefined) ?? null;

    const { data: liveSubscriptions, error: subErr } = await admin
      .from("subscriptions")
      .select("id, plan_id, status, started_at, created_at, updated_at")
      .eq("organization_id", org.id)
      .in("status", [...LIVE_SUBSCRIPTION_STATUSES])
      .not("plan_id", "is", null)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (subErr) {
      console.error("[workspace-context] live subscription error:", subErr.message);
      return jsonNoStore({ error: "تعذر قراءة اشتراك المنشأة" }, 500);
    }

    const liveSubscription = liveSubscriptions?.[0] ?? null;
    const liveSubscriptionPlanId =
      (liveSubscription?.plan_id as string | null | undefined) ?? null;
    const effectivePlanId = liveSubscriptionPlanId ?? organizationPlanId;
    const effectivePlanSource = liveSubscriptionPlanId
      ? "live_subscription"
      : organizationPlanId
        ? "organization"
        : "none";
    const planMismatch = Boolean(
      liveSubscriptionPlanId
      && organizationPlanId
      && liveSubscriptionPlanId !== organizationPlanId,
    );

    let planSlug: PlanSlug = "basic";
    let effectivePlanSlug: string | null = null;
    let planId: string | null = effectivePlanId;
    let planName: string | null = null;
    if (effectivePlanId) {
      const { data: plan } = await admin
        .from("plans")
        .select("name, slug")
        .eq("id", effectivePlanId)
        .maybeSingle();
      planSlug = normalizePlanSlug(plan?.slug);
      effectivePlanSlug = (plan?.slug as string | null | undefined) ?? null;
      planName = (plan?.name as string | null | undefined) ?? null;
    }

    let enabledFeatures: WorkspaceFeature[] = [];
    let featuresConfigured = false;

    if (effectivePlanId) {
      const { data: features, error: featErr } = await admin
        .from("plan_features")
        .select("feature_key")
        .eq("plan_id", effectivePlanId);

      if (featErr) {
        console.error("[workspace-context] plan_features error:", featErr.message);
        return jsonNoStore({ error: "تعذر قراءة ميزات الباقة" }, 500);
      }

      if (features && features.length > 0) {
        enabledFeatures = features.map(
          (f) => f.feature_key as WorkspaceFeature,
        );
        featuresConfigured = true;
      }
    }

    const planLimits: Record<string, number> = {};
    if (effectivePlanId) {
      const { data: limits } = await admin
        .from("plan_limits")
        .select("limit_key, limit_value")
        .eq("plan_id", effectivePlanId);
      for (const row of limits ?? []) {
        planLimits[row.limit_key] = row.limit_value;
      }
    }

    return jsonNoStore({
      planSlug,
      planId,
      planName,
      enabledFeatures,
      planLimits,
      featuresConfigured,
      isPlatformAdmin,
      organizationId: org.id,
      organizationStatus: org.status ?? null,
      organizationUpdatedAt: org.updated_at ?? null,
      effectivePlanId,
      effectivePlanSlug,
      effectivePlanSource,
      organizationPlanId,
      liveSubscriptionPlanId,
      planMismatch,
      contextVersion: `${org.id}:${effectivePlanId ?? "none"}:${org.updated_at ?? "na"}`,
    });
  } catch (err) {
    console.error("[workspace-context] unexpected:", err);
    return jsonNoStore({ error: "خطأ داخلي" }, 500);
  }
}
