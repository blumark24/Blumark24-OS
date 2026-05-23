import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  defaultFeaturesForPlan,
  normalizePlanSlug,
  type PlanSlug,
  type WorkspaceFeature,
} from "@/lib/features/packageFeatures";
import { isPlatformAdminEmail } from "@/lib/platformAdmins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { error: "إعداد الخادم غير مكتمل" },
        { status: 500 },
      );
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
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
      return NextResponse.json({ error: "تعذر قراءة الملف الشخصي" }, { status: 500 });
    }

    const role = String(profile?.role ?? "");
    const orgId = profile?.organization_id as string | null | undefined;

    const isPlatformAdmin =
      isPlatformAdminEmail(email) || role === "super_admin";

    const emptyPayload = {
      planSlug: "basic" as PlanSlug,
      enabledFeatures: [] as WorkspaceFeature[],
      planLimits: {} as Record<string, number>,
      isPlatformAdmin,
      organizationId: orgId ?? null,
      organizationStatus: null as string | null,
    };

    if (!orgId) {
      return NextResponse.json({
        ...emptyPayload,
        planSlug: isPlatformAdmin ? "advanced" : "basic",
        enabledFeatures: isPlatformAdmin
          ? defaultFeaturesForPlan("advanced")
          : [],
        organizationStatus: null,
      });
    }

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, plan_id, status, deleted_at")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) {
      console.error("[workspace-context] org error:", orgErr.message);
      return NextResponse.json({ error: "تعذر قراءة بيانات المنشأة" }, { status: 500 });
    }

    if (!org || org.deleted_at) {
      return NextResponse.json({
        ...emptyPayload,
        organizationStatus: "missing",
      });
    }

    let planSlug: PlanSlug = "basic";
    let planId: string | null = null;
    if (org.plan_id) {
      planId = org.plan_id as string;
      const { data: plan } = await admin
        .from("plans")
        .select("slug")
        .eq("id", planId)
        .maybeSingle();
      planSlug = normalizePlanSlug(plan?.slug);
    }

    let enabledFeatures: WorkspaceFeature[] = defaultFeaturesForPlan(planSlug);
    if (planId) {
      const { data: features, error: featErr } = await admin
        .from("plan_features")
        .select("feature_key")
        .eq("plan_id", planId);

      if (!featErr && features && features.length > 0) {
        enabledFeatures = features.map(
          (f) => f.feature_key as WorkspaceFeature,
        );
      }
    }

    const planLimits: Record<string, number> = {};
    if (planId) {
      const { data: limits } = await admin
        .from("plan_limits")
        .select("limit_key, limit_value")
        .eq("plan_id", planId);
      for (const row of limits ?? []) {
        planLimits[row.limit_key] = row.limit_value;
      }
    }

    return NextResponse.json({
      planSlug,
      enabledFeatures,
      planLimits,
      isPlatformAdmin,
      organizationId: org.id,
      organizationStatus: org.status ?? null,
    });
  } catch (err) {
    console.error("[workspace-context] unexpected:", err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
