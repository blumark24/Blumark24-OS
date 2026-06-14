import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId } from "@/lib/apiValidation";
import {
  assertTargetUserInCallerOrg,
  authorizeUserProvisioner,
} from "@/lib/api/tenantUserAdmin";
import { isOwnerEmail } from "@/lib/owner";

const TAG = "[delete-user]";

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function DELETE(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL) {
    return fail(500, "NEXT_PUBLIC_SUPABASE_URL غير مضبوط", "step=env: NEXT_PUBLIC_SUPABASE_URL is empty");
  }
  if (!SERVICE_KEY) {
    return fail(500,
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY",
      "step=env: SUPABASE_SERVICE_ROLE_KEY is empty or undefined",
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail(401, "Authorization header مفقود أو غير صالح", "step=auth: no Bearer prefix");
  }
  const token = authHeader.slice(7);

  const authResult = await authorizeUserProvisioner(admin, token);
  if (!authResult.ok) {
    return fail(authResult.status, authResult.error, authResult.debug ?? "step=auth");
  }
  const provisioner = authResult.auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return fail(400, "طلب غير صالح — تعذر قراءة البيانات المرسلة", `step=parse: ${String(e)}`);
  }

  const idError = validateUserId(body.userId);
  if (idError) return fail(400, idError, `step=validate: userId=${JSON.stringify(body.userId)}`);

  const userId = body.userId as string;

  if (userId === provisioner.callerId) {
    return fail(400, "لا يمكنك حذف حسابك الحالي", "step=validate: self-delete");
  }

  const targetCheck = await assertTargetUserInCallerOrg(admin, userId, provisioner);
  if (!targetCheck.ok) {
    return fail(targetCheck.status, targetCheck.error, targetCheck.debug ?? "step=org-scope");
  }

  // ── Hard-delete guard ────────────────────────────────────────────────────
  // Hard delete (removing from auth.users entirely) is destructive and breaks
  // all historical records linked to this userId. It is restricted to platform
  // owner or super_admin ONLY, and requires an explicit { hardDelete: true }
  // flag in the request body. Default behaviour is always a soft deactivation.
  const requestedHardDelete = body.hardDelete === true;
  const callerCanHardDelete =
    isOwnerEmail(provisioner.callerEmail) || provisioner.callerRole === "super_admin";

  if (requestedHardDelete && !callerCanHardDelete) {
    return fail(
      403,
      "الحذف الكامل متاح لمالك المنصة أو المدير الأعلى فقط.",
      "step=hard-delete-guard: caller lacks permission",
    );
  }

  if (requestedHardDelete && callerCanHardDelete) {
    // Before hard delete, verify no open tasks are assigned to this user.
    const { data: openTasks } = await admin
      .from("tasks")
      .select("id")
      .eq("assignee_id", userId)
      .not("status", "eq", "مكتملة")
      .limit(1);

    if (openTasks && openTasks.length > 0) {
      return fail(
        409,
        "لا يمكن الحذف الكامل — يوجد مهام مفتوحة مرتبطة بهذا الموظف. أعد تعيين المهام أولاً.",
        "step=hard-delete-guard: open tasks found",
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      const msg = deleteError.message.toLowerCase().includes("not found")
        ? "المستخدم غير موجود في نظام المصادقة"
        : `فشل الحذف الكامل: ${deleteError.message}`;
      return fail(400, msg, `step=hardDelete: ${deleteError.message}`);
    }

    return ok({ success: true, mode: "hard_delete" });
  }

  // ── Default: soft deactivation ───────────────────────────────────────────
  // Sets profiles.is_active=false and employees.status="غير_نشط".
  // The auth user and all historical records (tasks, audit logs) are preserved.
  const orgFilter = targetCheck.targetOrgId;

  let profileQuery = admin
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);
  if (orgFilter) profileQuery = profileQuery.eq("organization_id", orgFilter);

  const { error: profileError } = await profileQuery;
  if (profileError) {
    return fail(500, `فشل تعطيل الملف الشخصي: ${profileError.message}`, `step=softDelete.profile: ${profileError.message}`);
  }

  // Non-fatal: employee row may not exist for some account types.
  let empQuery = admin
    .from("employees")
    .update({ status: "غير_نشط" })
    .eq("id", userId);
  if (orgFilter) empQuery = empQuery.eq("organization_id", orgFilter);
  const { error: empError } = await empQuery;
  if (empError) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`${TAG} employees soft-deactivate skipped (non-fatal): ${empError.message}`);
    }
  }

  return ok({ success: true, mode: "soft_delete" });
}
