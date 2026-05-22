import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  evaluateTenantAccess,
  getAccessTokenFromRequest,
  TENANT_BLOCKED_BODY,
  TENANT_BLOCKED_TITLE,
  type OrganizationStatus,
  type SubscriptionStatus,
  type TenantAccessResult,
} from "@/lib/tenantAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[auth/tenant-access]";

function jsonResult(result: TenantAccessResult, status = 200) {
  return NextResponse.json(
    {
      allowed: result.allowed,
      code: result.code,
      message: result.message,
      title: result.allowed ? null : (result.message ?? TENANT_BLOCKED_TITLE),
      body: result.allowed ? null : TENANT_BLOCKED_BODY,
    },
    { status },
  );
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !anonKey) {
    console.warn(`${TAG} Supabase public env missing`);
    return NextResponse.json(
      { allowed: false, code: "CONFIG", message: "إعداد الخادم غير مكتمل" },
      { status: 503 },
    );
  }

  if (!serviceKey) {
    console.warn(`${TAG} SUPABASE_SERVICE_ROLE_KEY missing`);
    return NextResponse.json(
      { allowed: false, code: "CONFIG", message: "إعداد الخادم غير مكتمل" },
      { status: 503 },
    );
  }

  const accessToken = getAccessTokenFromRequest(req);
  if (!accessToken) {
    return NextResponse.json(
      { allowed: false, code: "UNAUTHORIZED", message: "يجب تسجيل الدخول" },
      { status: 401 },
    );
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await authClient.auth.getUser(accessToken);

  if (userErr || !user) {
    return NextResponse.json(
      { allowed: false, code: "UNAUTHORIZED", message: "جلسة غير صالحة أو منتهية" },
      { status: 401 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let organizationId: string | null = null;

  try {
    const profResp = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profResp.error) {
      console.error(`${TAG} profiles error:`, profResp.error.message);
      return NextResponse.json(
        { allowed: false, code: "LOOKUP_ERROR", message: "تعذّر التحقق من حالة المنشأة" },
        { status: 503 },
      );
    }

    organizationId =
      (profResp.data as { organization_id?: string | null } | null)?.organization_id ?? null;
  } catch (err) {
    console.error(`${TAG} profiles exception:`, err);
    return NextResponse.json(
      { allowed: false, code: "LOOKUP_ERROR", message: "تعذّر التحقق من حالة المنشأة" },
      { status: 503 },
    );
  }

  if (!organizationId) {
    return jsonResult(
      evaluateTenantAccess({
        organizationId: null,
        organization: null,
        subscription: null,
      }),
    );
  }

  let organization: {
    status: OrganizationStatus;
    is_internal: boolean;
    deleted_at: string | null;
  } | null = null;

  try {
    const orgResp = await admin
      .from("organizations")
      .select("status, is_internal, deleted_at")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgResp.error) {
      console.error(`${TAG} organizations error:`, orgResp.error.message);
      return NextResponse.json(
        { allowed: false, code: "LOOKUP_ERROR", message: "تعذّر التحقق من حالة المنشأة" },
        { status: 503 },
      );
    }

    if (orgResp.data) {
      const row = orgResp.data as {
        status: OrganizationStatus;
        is_internal: boolean;
        deleted_at: string | null;
      };
      organization = row;
    }
  } catch (err) {
    console.error(`${TAG} organizations exception:`, err);
    return NextResponse.json(
      { allowed: false, code: "LOOKUP_ERROR", message: "تعذّر التحقق من حالة المنشأة" },
      { status: 503 },
    );
  }

  let subscription: { status: SubscriptionStatus } | null = null;

  try {
    const subResp = await admin
      .from("subscriptions")
      .select("status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subResp.error) {
      // Subscriptions table may be absent on minimal schemas — org rules still apply.
      console.warn(`${TAG} subscriptions lookup skipped:`, subResp.error.message);
    } else if (subResp.data) {
      subscription = {
        status: (subResp.data as { status: SubscriptionStatus }).status,
      };
    }
  } catch (err) {
    console.warn(`${TAG} subscriptions exception (non-fatal):`, err);
  }

  const result = evaluateTenantAccess({
    organizationId,
    organization,
    subscription,
  });

  return jsonResult(result);
}
