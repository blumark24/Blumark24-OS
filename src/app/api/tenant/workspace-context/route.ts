import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizePlanSlug, type PlanSlug } from "@/lib/features/packageFeatures";
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

    if (!orgId) {
      return NextResponse.json({
        isInternal: isPlatformAdmin,
        planSlug: (isPlatformAdmin ? "advanced" : "basic") satisfies PlanSlug,
        isPlatformAdmin,
        organizationId: null,
        organizationStatus: null,
      });
    }

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, is_internal, plan_id, status, deleted_at")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) {
      console.error("[workspace-context] org error:", orgErr.message);
      return NextResponse.json({ error: "تعذر قراءة بيانات المنشأة" }, { status: 500 });
    }

    if (!org || org.deleted_at) {
      return NextResponse.json({
        isInternal: false,
        planSlug: "basic" satisfies PlanSlug,
        isPlatformAdmin,
        organizationId: orgId,
        organizationStatus: "missing",
      });
    }

    let planSlug: PlanSlug = "basic";
    if (org.plan_id) {
      const { data: plan } = await admin
        .from("plans")
        .select("slug")
        .eq("id", org.plan_id)
        .maybeSingle();
      planSlug = normalizePlanSlug(plan?.slug);
    }

    return NextResponse.json({
      isInternal: org.is_internal === true,
      planSlug,
      isPlatformAdmin,
      organizationId: org.id,
      organizationStatus: org.status ?? null,
    });
  } catch (err) {
    console.error("[workspace-context] unexpected:", err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
