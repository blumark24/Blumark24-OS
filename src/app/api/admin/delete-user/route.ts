import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId } from "@/lib/apiValidation";
import {
  assertTargetUserInCallerOrg,
  authorizeUserProvisioner,
} from "@/lib/api/tenantUserAdmin";

const TAG = "[delete-user]";
const IS_PROD = process.env.NODE_ENV === "production";

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  if (!IS_PROD) console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json(
    { success: false, error, ...(IS_PROD ? {} : { debug }) },
    { status },
  );
}

export async function DELETE(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!IS_PROD) console.log(`${TAG} start | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY} (len=${SERVICE_KEY.length})`);

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
  if (!IS_PROD) console.log(`${TAG} step=auth ok | caller=${provisioner.callerEmail}`);

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

  if (!IS_PROD) console.log(`${TAG} step=deleteUser | userId=${userId}`);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    const msg = deleteError.message.toLowerCase().includes("not found")
      ? "المستخدم غير موجود في نظام المصادقة"
      : `فشل حذف المستخدم: ${deleteError.message}`;
    return fail(400, msg, `step=deleteUser: ${deleteError.message}`);
  }

  if (!IS_PROD) console.log(`${TAG} SUCCESS | userId=${userId}`);
  return ok({ success: true });
}
