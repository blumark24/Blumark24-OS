// /api/owner/create-client-login
// Owner-only. Creates a Supabase Auth login account for an organization's
// owner_email and links it to that organization via profiles.organization_id.
// Service-role key is read and used ONLY here on the server — never shipped to
// the client. The caller must be the platform owner (is_owner allowlist).

import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail } from "@/lib/owner";
import {
  createServiceRoleAdmin,
  findAuthUserIdByEmail,
  upsertLinkedProfile,
  verifyOwnerBearer,
  writeOwnerAuditLog,
} from "@/lib/api/ownerServerCommon";
import { validatePasswordForAuth } from "@/lib/security/passwordGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!organizationId) {
      return NextResponse.json({ success: false, error: "معرّف المنشأة مطلوب" }, { status: 400 });
    }
    const pwResult = await validatePasswordForAuth(password);
    if (!pwResult.ok) {
      return NextResponse.json({ success: false, error: pwResult.error }, { status: 400 });
    }
    const pwGuardWarning = pwResult.ok && !!pwResult.warning;

    const orgResp = await admin
      .from("organizations")
      .select("id, name, owner_email")
      .eq("id", organizationId)
      .maybeSingle();
    if (orgResp.error) {
      return NextResponse.json({ success: false, error: "تعذّر قراءة بيانات المنشأة" }, { status: 500 });
    }
    if (!orgResp.data) {
      return NextResponse.json({ success: false, error: "المنشأة غير موجودة" }, { status: 404 });
    }
    const orgName = (orgResp.data.name as string) ?? "";
    const ownerEmail = ((orgResp.data.owner_email as string | null) ?? "").trim().toLowerCase();
    if (!ownerEmail) {
      return NextResponse.json(
        { success: false, error: "المنشأة لا تملك بريد مالك — أضف بريد المالك أولاً" },
        { status: 400 },
      );
    }
    if (isOwnerEmail(ownerEmail)) {
      return NextResponse.json(
        { success: false, error: "لا يمكن إنشاء حساب عميل لبريد مالك المنصة" },
        { status: 400 },
      );
    }

    const linkResp = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1);
    if (linkResp.error) {
      return NextResponse.json({ success: false, error: "تعذّر التحقق من الربط الحالي" }, { status: 500 });
    }
    if (linkResp.data && linkResp.data.length > 0) {
      return NextResponse.json(
        { success: false, error: "تم إنشاء حساب دخول لهذه المنشأة بالفعل" },
        { status: 409 },
      );
    }

    const name = orgName || ownerEmail.split("@")[0];
    let userId: string;
    let adopted = false;

    const createResp = await admin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createResp.error || !createResp.data?.user) {
      const msg = createResp.error?.message ?? "";
      const dup = /already|registered|exists|duplicate/i.test(msg);
      if (!dup) {
        return NextResponse.json({ success: false, error: `فشل إنشاء الحساب: ${msg}` }, { status: 400 });
      }

      const existingId = await findAuthUserIdByEmail(admin, ownerEmail);
      if (!existingId) {
        return NextResponse.json(
          { success: false, error: `البريد (${ownerEmail}) مسجّل مسبقاً ولا يمكن ربطه تلقائياً` },
          { status: 409 },
        );
      }

      const existingProf = await admin
        .from("profiles")
        .select("id, organization_id")
        .eq("id", existingId)
        .maybeSingle();
      if (existingProf.error) {
        return NextResponse.json({ success: false, error: "تعذّر التحقق من الحساب الحالي" }, { status: 500 });
      }
      if (existingProf.data) {
        if (existingProf.data.organization_id === organizationId) {
          return NextResponse.json(
            { success: false, error: "تم إنشاء حساب دخول لهذه المنشأة بالفعل" },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { success: false, error: `البريد (${ownerEmail}) مستخدم لحساب آخر — لا يمكن ربطه بهذه المنشأة` },
          { status: 409 },
        );
      }

      const upd = await admin.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (upd.error) {
        return NextResponse.json(
          { success: false, error: `تعذّر تحديث الحساب الحالي: ${upd.error.message}` },
          { status: 500 },
        );
      }
      userId = existingId;
      adopted = true;
    } else {
      userId = createResp.data.user.id;
    }

    const linkRes = await upsertLinkedProfile(admin, {
      userId,
      email: ownerEmail,
      name,
      organizationId,
    });
    if (linkRes.error) {
      if (!adopted) {
        const rb = await admin.auth.admin.deleteUser(userId);
        if (rb.error) console.error("[create-client-login] rollback failed:", rb.error.message);
      }
      return NextResponse.json(
        { success: false, error: `فشل ربط الحساب بالمنشأة: ${linkRes.error}` },
        { status: 500 },
      );
    }

    await writeOwnerAuditLog(admin, {
      owner_email: callerEmail,
      action: "create_client_login",
      target_type: "organization",
      target_id: organizationId,
      metadata: { owner_email: ownerEmail, auth_user_id: userId, adopted, ...(pwGuardWarning ? { password_guard_warning: true } : {}) },
    });

    return NextResponse.json({ success: true, id: userId, email: ownerEmail, adopted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE_CLIENT_LOGIN_FATAL]", error);
    return NextResponse.json({ success: false, error: msg || "خطأ غير متوقع" }, { status: 500 });
  }
}
