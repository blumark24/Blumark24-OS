// Owner-only: atomic tenant provisioning (organization + optional subscription +
// workspace settings + auth user + linked profile) via service role.

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isOwnerEmail } from "@/lib/owner";
import {
  createServiceRoleAdmin,
  findAuthUserIdByEmail,
  findProfileByEmail,
  passwordError,
  upsertLinkedProfile,
  verifyOwnerBearer,
  writeOwnerAuditLog,
} from "@/lib/api/ownerServerCommon";
import { logAndAlert, normalizeError, generateRequestId } from "@/lib/monitoring/server";
import { getClientIp, buildRateLimitKey, checkRateLimit, rateLimitResponse } from "@/lib/security/rateLimit";
import { trackFeatureUsage } from "@/lib/analytics/featureUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrgStatus = "active" | "trial" | "suspended" | "cancelled";
type BillingCycle = "monthly" | "annual";
type SubStatus = "active" | "trialing";

type ProvisionStep =
  | "validate"
  | "create_organization"
  | "create_subscription"
  | "tenant_workspace_settings"
  | "create_auth_user"
  | "link_profile";

interface PartialState {
  organizationId?: string;
  // OWNER-PROVISION-TENANT-CODE-FIX-1: tracks `organizations.organization_code`
  // (the post-migration-033 public code). Production no longer has the legacy
  // `customer_code` column, so we read `organization_code` instead.
  organizationCode?: string | null;
  subscriptionId?: string | null;
  authUserId?: string;
  failedStep?: ProvisionStep;
}

function subscriptionStatusForOrg(orgStatus: OrgStatus): SubStatus {
  return orgStatus === "trial" ? "trialing" : "active";
}

async function ensureTenantWorkspaceSettings(
  admin: SupabaseClient,
  organizationId: string,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const existing = await admin
    .from("tenant_workspace_settings")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing.error) {
    const msg = existing.error.message.toLowerCase();
    if (msg.includes("tenant_workspace_settings") && msg.includes("does not exist")) {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: existing.error.message };
  }
  if (existing.data) return { ok: true, skipped: true };

  const ins = await admin.from("tenant_workspace_settings").insert({
    organization_id: organizationId,
  });
  if (ins.error) {
    const msg = ins.error.message.toLowerCase();
    if (msg.includes("tenant_workspace_settings") && msg.includes("does not exist")) {
      return { ok: true, skipped: true };
    }
    return { ok: false, error: ins.error.message };
  }
  return { ok: true };
}

async function createOrganizationRow(
  admin: SupabaseClient,
  input: {
    name: string;
    slug: string | null;
    ownerEmail: string;
    planId: string | null;
    status: OrgStatus;
  },
): Promise<
  | { ok: true; id: string; organizationCode: string | null }
  | { ok: false; error: string; code?: "duplicate_slug" }
> {
  const { data, error } = await admin
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      owner_email: input.ownerEmail,
      plan_id: input.planId,
      status: input.status,
    })
    // OWNER-PROVISION-TENANT-CODE-FIX-1: was `id, customer_code`. Production
    // lacks the legacy `customer_code` column (PostgREST 42703), so we read
    // the post-migration-033 `organization_code` instead. The trigger
    // `b24_assign_organization_code()` populates this on insert.
    .select("id, organization_code")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "المعرّف (slug) مستخدم مسبقًا", code: "duplicate_slug" };
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    id: data.id as string,
    organizationCode: (data.organization_code as string | null) ?? null,
  };
}

async function createSubscriptionRow(
  admin: SupabaseClient,
  input: {
    organizationId: string;
    planId: string;
    status: SubStatus;
    billingCycle: BillingCycle;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string; code?: "already_exists" }> {
  const { data: existing, error: checkErr } = await admin
    .from("subscriptions")
    .select("id")
    .eq("organization_id", input.organizationId)
    .limit(1);

  if (checkErr) return { ok: false, error: checkErr.message };
  if (existing && existing.length > 0) {
    return { ok: false, error: "يوجد اشتراك لهذه المنشأة بالفعل", code: "already_exists" };
  }

  const { data, error } = await admin
    .from("subscriptions")
    .insert({
      organization_id: input.organizationId,
      plan_id: input.planId,
      status: input.status,
      billing_cycle: input.billingCycle,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

async function createOrAdoptAuthUser(
  admin: SupabaseClient,
  input: { email: string; password: string; name: string },
): Promise<
  | { ok: true; userId: string; adopted: boolean }
  | { ok: false; error: string; status: number }
> {
  const createResp = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });

  if (!createResp.error && createResp.data?.user) {
    return { ok: true, userId: createResp.data.user.id, adopted: false };
  }

  const msg = createResp.error?.message ?? "";
  const dup = /already|registered|exists|duplicate/i.test(msg);
  if (!dup) {
    return { ok: false, error: `فشل إنشاء الحساب: ${msg}`, status: 400 };
  }

  const existingId = await findAuthUserIdByEmail(admin, input.email);
  if (!existingId) {
    return {
      ok: false,
      error: `البريد (${input.email}) مسجّل مسبقاً ولا يمكن ربطه تلقائياً`,
      status: 409,
    };
  }

  const existingProf = await admin
    .from("profiles")
    .select("id, organization_id")
    .eq("id", existingId)
    .maybeSingle();

  if (existingProf.error) {
    return { ok: false, error: "تعذّر التحقق من الحساب الحالي", status: 500 };
  }
  if (existingProf.data) {
    const linkedOrg = existingProf.data.organization_id as string | null;
    return {
      ok: false,
      error: linkedOrg
        ? `البريد (${input.email}) مستخدم لمنشأة أخرى — لا يمكن إنشاء مستأجر جديد به`
        : "البريد مرتبط بملف شخصي موجود — لا يمكن الاعتماد التلقائي",
      status: 409,
    };
  }

  const upd = await admin.auth.admin.updateUserById(existingId, {
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.name },
  });
  if (upd.error) {
    return {
      ok: false,
      error: `تعذّر تحديث الحساب الحالي: ${upd.error.message}`,
      status: 500,
    };
  }

  return { ok: true, userId: existingId, adopted: true };
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const partial: PartialState = {};

  try {
    const svc = createServiceRoleAdmin();
    if ("error" in svc) {
      return NextResponse.json({ success: false, error: svc.error }, { status: 500 });
    }
    const { admin } = svc;

    const ownerCheck = await verifyOwnerBearer(req, admin);
    if (!ownerCheck.ok) {
      return NextResponse.json(
        { success: false, error: ownerCheck.error },
        { status: ownerCheck.status },
      );
    }
    const callerEmail = ownerCheck.callerEmail;

    // Rate limit: 5 per owner per 10 min + 20 per IP per hour
    const ip = getClientIp(req);
    const [rlUser, rlIp] = await Promise.all([
      checkRateLimit({
        scope:    "owner_provision_tenant_user",
        key:      buildRateLimitKey({ scope: "owner_provision_tenant_user", user_id: callerEmail, ip }),
        limit:    5,
        windowMs: 10 * 60 * 1000,
        ip,
        route:    "/api/owner/provision-tenant",
        metadata: {},
      }),
      checkRateLimit({
        scope:    "owner_provision_tenant_ip",
        key:      buildRateLimitKey({ scope: "owner_provision_tenant_ip", ip }),
        limit:    20,
        windowMs: 60 * 60 * 1000,
        ip,
        route:    "/api/owner/provision-tenant",
        metadata: {},
      }),
    ]);
    if (!rlUser.allowed) return NextResponse.json({ success: false, error: "تجاوزت الحد المسموح به — يرجى الانتظار قبل المحاولة مجدداً", request_id: rlUser.requestId }, { status: 429 });
    if (!rlIp.allowed)   return NextResponse.json({ success: false, error: "تجاوزت الحد المسموح به — يرجى الانتظار قبل المحاولة مجدداً", request_id: rlIp.requestId  }, { status: 429 });

    const body = (await req.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const slugRaw = typeof body.slug === "string" ? body.slug.trim() : "";
    const slug = slugRaw || null;
    const ownerEmail = typeof body.ownerEmail === "string" ? body.ownerEmail.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const planId = typeof body.planId === "string" && body.planId.trim() ? body.planId.trim() : null;
    const billingCycle =
      body.billingCycle === "annual" ? "annual" : ("monthly" as BillingCycle);

    const statusRaw = typeof body.status === "string" ? body.status.trim() : "active";
    const allowedOrgStatus = new Set<OrgStatus>(["active", "trial", "suspended", "cancelled"]);
    const status: OrgStatus = allowedOrgStatus.has(statusRaw as OrgStatus)
      ? (statusRaw as OrgStatus)
      : "active";

    if (!name) {
      return NextResponse.json({ success: false, error: "اسم المنشأة مطلوب" }, { status: 400 });
    }
    if (!ownerEmail) {
      return NextResponse.json({ success: false, error: "بريد مالك المنشأة مطلوب" }, { status: 400 });
    }
    if (isOwnerEmail(ownerEmail)) {
      return NextResponse.json(
        { success: false, error: "لا يمكن استخدام بريد مالك المنصة كمالك للمنشأة" },
        { status: 400 },
      );
    }
    const pwErr = passwordError(password);
    if (pwErr) {
      return NextResponse.json({ success: false, error: pwErr }, { status: 400 });
    }

    if (planId) {
      const planResp = await admin.from("plans").select("id").eq("id", planId).maybeSingle();
      if (planResp.error) {
        return NextResponse.json(
          { success: false, error: "تعذّر التحقق من الباقة" },
          { status: 500 },
        );
      }
      if (!planResp.data) {
        return NextResponse.json({ success: false, error: "الباقة غير موجودة" }, { status: 400 });
      }
    }

    const existingProfile = await findProfileByEmail(admin, ownerEmail);
    if (existingProfile?.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: `البريد (${ownerEmail}) مرتبط بمنشأة أخرى — لا يمكن إنشاء مستأجر جديد`,
        },
        { status: 409 },
      );
    }
    if (existingProfile && !existingProfile.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: "البريد مرتبط بملف شخصي موجود — لا يمكن الاعتماد التلقائي لهذا المسار",
        },
        { status: 409 },
      );
    }

    const orgRes = await createOrganizationRow(admin, {
      name,
      slug,
      ownerEmail,
      planId,
      status,
    });
    if (!orgRes.ok) {
      const httpStatus = orgRes.code === "duplicate_slug" ? 409 : 500;
      return NextResponse.json(
        { success: false, error: orgRes.error, errorCode: orgRes.code },
        { status: httpStatus },
      );
    }

    partial.organizationId = orgRes.id;
    partial.organizationCode = orgRes.organizationCode;

    let subscriptionId: string | null = null;
    if (planId) {
      const subRes = await createSubscriptionRow(admin, {
        organizationId: orgRes.id,
        planId,
        status: subscriptionStatusForOrg(status),
        billingCycle,
      });
      if (!subRes.ok) {
        partial.failedStep = "create_subscription";
        await writeOwnerAuditLog(admin, {
          owner_email: callerEmail,
          action: "provision_tenant_failed",
          target_type: "organization",
          target_id: orgRes.id,
          metadata: {
            failed_step: "create_subscription",
            error: subRes.error,
            owner_email: ownerEmail,
            plan_id: planId,
            organization_id: orgRes.id,
            organization_code: orgRes.organizationCode,
          },
        });
        return NextResponse.json(
          {
            success: false,
            error: subRes.error,
            partial: true,
            organizationId: orgRes.id,
            // OWNER-PROVISION-TENANT-CODE-FIX-1: emit all three keys so
            // existing client mappings (`organizationCode ?? organization_code
            // ?? customerCode`) keep working without changes.
            organizationCode: orgRes.organizationCode,
            organization_code: orgRes.organizationCode,
            customerCode: orgRes.organizationCode,
            failedStep: "create_subscription",
          },
          { status: 500 },
        );
      }
      subscriptionId = subRes.id;
      partial.subscriptionId = subscriptionId;
    }

    const wsRes = await ensureTenantWorkspaceSettings(admin, orgRes.id);
    if (!wsRes.ok) {
      partial.failedStep = "tenant_workspace_settings";
      await writeOwnerAuditLog(admin, {
        owner_email: callerEmail,
        action: "provision_tenant_failed",
        target_type: "organization",
        target_id: orgRes.id,
        metadata: {
          failed_step: "tenant_workspace_settings",
          error: wsRes.error,
          organization_id: orgRes.id,
          subscription_id: subscriptionId,
          organization_code: orgRes.organizationCode,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: wsRes.error ?? "تعذّر إنشاء إعدادات مساحة العمل",
          partial: true,
          organizationId: orgRes.id,
          organizationCode: orgRes.organizationCode,
          organization_code: orgRes.organizationCode,
          customerCode: orgRes.organizationCode,
          subscriptionId,
          failedStep: "tenant_workspace_settings",
        },
        { status: 500 },
      );
    }

    const displayName = name || ownerEmail.split("@")[0];
    const authRes = await createOrAdoptAuthUser(admin, {
      email: ownerEmail,
      password,
      name: displayName,
    });
    if (!authRes.ok) {
      partial.failedStep = "create_auth_user";
      await writeOwnerAuditLog(admin, {
        owner_email: callerEmail,
        action: "provision_tenant_failed",
        target_type: "organization",
        target_id: orgRes.id,
        metadata: {
          failed_step: "create_auth_user",
          error: authRes.error,
          organization_id: orgRes.id,
          subscription_id: subscriptionId,
          organization_code: orgRes.organizationCode,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: authRes.error,
          partial: true,
          organizationId: orgRes.id,
          organizationCode: orgRes.organizationCode,
          organization_code: orgRes.organizationCode,
          customerCode: orgRes.organizationCode,
          subscriptionId,
          failedStep: "create_auth_user",
        },
        { status: authRes.status },
      );
    }

    partial.authUserId = authRes.userId;

    const linkRes = await upsertLinkedProfile(admin, {
      userId: authRes.userId,
      email: ownerEmail,
      name: displayName,
      organizationId: orgRes.id,
    });
    if (linkRes.error) {
      if (!authRes.adopted) {
        const rb = await admin.auth.admin.deleteUser(authRes.userId);
        if (rb.error) console.error("[provision-tenant] auth rollback failed:", rb.error.message);
      }
      partial.failedStep = "link_profile";
      await writeOwnerAuditLog(admin, {
        owner_email: callerEmail,
        action: "provision_tenant_failed",
        target_type: "organization",
        target_id: orgRes.id,
        metadata: {
          failed_step: "link_profile",
          error: linkRes.error,
          organization_id: orgRes.id,
          subscription_id: subscriptionId,
          auth_user_id: authRes.userId,
          adopted: authRes.adopted,
          organization_code: orgRes.organizationCode,
          auth_rolled_back: !authRes.adopted,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: `فشل ربط الحساب بالمنشأة: ${linkRes.error}`,
          partial: true,
          organizationId: orgRes.id,
          organizationCode: orgRes.organizationCode,
          organization_code: orgRes.organizationCode,
          customerCode: orgRes.organizationCode,
          subscriptionId,
          failedStep: "link_profile",
          authRolledBack: !authRes.adopted,
        },
        { status: 500 },
      );
    }

    await writeOwnerAuditLog(admin, {
      owner_email: callerEmail,
      action: "provision_tenant",
      target_type: "organization",
      target_id: orgRes.id,
      metadata: {
        name,
        slug,
        owner_email: ownerEmail,
        plan_id: planId,
        status,
        billing_cycle: billingCycle,
        organization_id: orgRes.id,
        organization_code: orgRes.organizationCode,
        subscription_id: subscriptionId,
        auth_user_id: authRes.userId,
        adopted: authRes.adopted,
        workspace_settings_created: wsRes.skipped !== true,
      },
    });

    trackFeatureUsage({
      feature_key:     "owner_provision_tenant",
      event_type:      "completed",
      organization_id: orgRes.id,
      path:            "/api/owner/provision-tenant",
      metadata:        { plan_id: planId ?? null, status, adopted: authRes.adopted },
    });

    return NextResponse.json({
      success: true,
      organizationId: orgRes.id,
      // OWNER-PROVISION-TENANT-CODE-FIX-1: emit all three keys for backward
      // compatibility with cached clients. Source is always the same
      // `organization_code` value.
      organizationCode: orgRes.organizationCode,
      organization_code: orgRes.organizationCode,
      customerCode: orgRes.organizationCode,
      subscriptionId,
      authUserId: authRes.userId,
      email: ownerEmail,
      adopted: authRes.adopted,
    });
  } catch (error: unknown) {
    const norm = normalizeError(error);
    console.error("[PROVISION_TENANT_FATAL]", norm.message);
    void logAndAlert(
      {
        source:     "owner_provision_tenant",
        severity:   "critical",
        message:    norm.message,
        stack:      norm.stack,
        error_code: norm.error_code,
        request_id: requestId,
        path:       "/api/owner/provision-tenant",
        metadata:   { partial: Boolean(partial.organizationId) },
      },
      "خطأ حرج في تزويد عميل جديد",
    );
    return NextResponse.json(
      {
        success: false,
        error: norm.message || "خطأ غير متوقع",
        request_id: requestId,
        partial: Boolean(partial.organizationId),
        ...partial,
        // OWNER-PROVISION-TENANT-CODE-FIX-1: backward-compatible alias for
        // older clients that still read `customerCode`. Sourced from the same
        // `organization_code` value tracked in PartialState.
        customerCode: partial.organizationCode ?? null,
        organization_code: partial.organizationCode ?? null,
      },
      { status: 500 },
    );
  }
}
