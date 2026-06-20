import { NextRequest, NextResponse } from "next/server";
import {
  createServiceRoleAdmin,
  verifyOwnerBearer,
  writeOwnerAuditLog,
} from "@/lib/api/ownerServerCommon";
import { logAndAlert, normalizeError, generateRequestId } from "@/lib/monitoring/server";
import { getClientIp, buildRateLimitKey, checkRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChangePlanPayload = {
  organizationId?: unknown;
  planId?: unknown;
};

function jsonNoStore(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const svc = createServiceRoleAdmin();
    if ("error" in svc) {
      return jsonNoStore({ success: false, error: svc.error }, 500);
    }
    const { admin } = svc;

    const ownerCheck = await verifyOwnerBearer(req, admin);
    if (!ownerCheck.ok) {
      return jsonNoStore(
        { success: false, error: ownerCheck.error },
        ownerCheck.status,
      );
    }

    // Rate limit: 10 per owner per 10 min
    const ip = getClientIp(req);
    const rl = await checkRateLimit({
      scope:    "owner_change_plan",
      key:      buildRateLimitKey({ scope: "owner_change_plan", user_id: ownerCheck.callerEmail, ip }),
      limit:    10,
      windowMs: 10 * 60 * 1000,
      user_id:  null,
      ip,
      route:    "/api/owner/change-organization-plan",
      metadata: {},
    });
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = (await req.json().catch(() => ({}))) as ChangePlanPayload;
    const organizationId =
      typeof body.organizationId === "string" && body.organizationId.trim()
        ? body.organizationId.trim()
        : "";
    const planId =
      typeof body.planId === "string" && body.planId.trim()
        ? body.planId.trim()
        : null;

    if (!organizationId) {
      return jsonNoStore({ success: false, error: "معرّف المنشأة مطلوب" }, 400);
    }

    const orgResp = await admin
      .from("organizations")
      .select("id, name, plan_id, is_internal, deleted_at")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgResp.error) {
      console.error("[owner/change-plan] org lookup error:", orgResp.error.message);
      return jsonNoStore({ success: false, error: "تعذّر قراءة المنشأة" }, 500);
    }
    if (!orgResp.data) {
      return jsonNoStore({ success: false, error: "المنشأة غير موجودة" }, 404);
    }
    if (orgResp.data.deleted_at) {
      return jsonNoStore({ success: false, error: "لا يمكن تغيير باقة منشأة محذوفة" }, 400);
    }
    if (orgResp.data.is_internal === true) {
      return jsonNoStore({ success: false, error: "لا يمكن تغيير باقة المنشأة الداخلية من هنا" }, 400);
    }

    let planSlug: string | null = null;
    let planName: string | null = null;
    if (planId) {
      const planResp = await admin
        .from("plans")
        .select("id, name, slug, is_active")
        .eq("id", planId)
        .maybeSingle();

      if (planResp.error) {
        console.error("[owner/change-plan] plan lookup error:", planResp.error.message);
        return jsonNoStore({ success: false, error: "تعذّر قراءة الباقة" }, 500);
      }
      if (!planResp.data || planResp.data.is_active !== true) {
        return jsonNoStore({ success: false, error: "الباقة غير موجودة أو غير نشطة" }, 400);
      }
      planSlug = String(planResp.data.slug ?? "");
      planName = String(planResp.data.name ?? "");
    }

    const now = new Date().toISOString();
    const orgUpdate = await admin
      .from("organizations")
      .update({ plan_id: planId, updated_at: now })
      .eq("id", organizationId)
      .select("id, plan_id, updated_at")
      .single();

    if (orgUpdate.error) {
      console.error("[owner/change-plan] org update error:", orgUpdate.error.message);
      return jsonNoStore({ success: false, error: "تعذّر تغيير باقة المنشأة" }, 500);
    }

    if ((orgUpdate.data.plan_id as string | null) !== planId) {
      return jsonNoStore(
        { success: false, error: "لم يتم تأكيد تغيير الباقة — حاول مرة أخرى" },
        409,
      );
    }

    let subscriptionSyncCount = 0;
    const subUpdate = await admin
      .from("subscriptions")
      .update({ plan_id: planId, updated_at: now })
      .eq("organization_id", organizationId)
      .select("id, plan_id, updated_at");

    if (subUpdate.error) {
      console.error("[owner/change-plan] subscription sync error:", subUpdate.error.message);
      return jsonNoStore({ success: false, error: "تغيّرت باقة المنشأة لكن تعذّر مزامنة الاشتراك" }, 500);
    }
    subscriptionSyncCount = subUpdate.data?.length ?? 0;

    const truthResp = await admin
      .from("organizations")
      .select("id, plan_id, updated_at")
      .eq("id", organizationId)
      .single();

    if (truthResp.error) {
      console.error("[owner/change-plan] truth readback error:", truthResp.error.message);
      return jsonNoStore({ success: false, error: "تغيّرت الباقة لكن تعذّر فحص النتيجة النهائية" }, 500);
    }

    const finalOrgPlanId = (truthResp.data.plan_id as string | null) ?? null;
    const subscriptionMismatch = (subUpdate.data ?? []).some(
      (row) => ((row.plan_id as string | null) ?? null) !== planId,
    );

    if (finalOrgPlanId !== planId || subscriptionMismatch) {
      return jsonNoStore(
        {
          success: false,
          error: "لم تتطابق باقة المنشأة مع الاشتراك بعد الحفظ — لم يتم اعتماد التغيير",
          truth: {
            expectedPlanId: planId,
            organizationPlanId: finalOrgPlanId,
            subscriptionSyncCount,
          },
        },
        409,
      );
    }

    await writeOwnerAuditLog(admin, {
      owner_email: ownerCheck.callerEmail,
      action: "change_plan",
      target_type: "organization",
      target_id: organizationId,
      metadata: {
        previous_plan_id: orgResp.data.plan_id ?? null,
        plan_id: planId,
        plan_slug: planSlug,
        subscription_sync_count: subscriptionSyncCount,
        verified: true,
      },
    });

    return jsonNoStore({
      success: true,
      organizationId,
      planId,
      planSlug,
      planName,
      updatedAt: now,
      subscriptionSyncCount,
      truth: {
        organizationPlanId: finalOrgPlanId,
        subscriptionPlanId: planId,
        customerContextPlanSlug: planSlug,
        verified: true,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    const norm = normalizeError(err);
    console.error("[owner/change-plan] unexpected:", norm.message);
    void logAndAlert(
      {
        source:     "owner_change_plan",
        severity:   "critical",
        message:    norm.message,
        stack:      norm.stack,
        error_code: norm.error_code,
        request_id: requestId,
        path:       "/api/owner/change-organization-plan",
        metadata:   {},
      },
      "خطأ حرج في تغيير باقة المنشأة",
    );
    return jsonNoStore({ success: false, error: "خطأ داخلي", request_id: requestId }, 500);
  }
}
