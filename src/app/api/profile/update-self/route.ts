import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ensureEmployeeRow } from "@/lib/api/ensureEmployee";

/**
 * Self-service profile update — the ONLY write path a regular employee has for
 * their own personal fields (name, phone). It is deliberately self-scoped:
 *
 *  - The target is ALWAYS the caller's own id, taken from the verified JWT.
 *    The request body can NOT name another user — no privilege path exists.
 *  - Only `name` and `phone` are ever written. role, salary, status,
 *    job_title, department, organization_id, is_active and permissions are
 *    never touched here.
 *  - Writes are scoped by the caller's own organization_id, so nothing in
 *    another tenant can be reached even in theory.
 *  - Inactive accounts (profiles.is_active = false) are rejected, mirroring the
 *    WorkspaceRouteGuard block.
 *
 * phone lives only on the employees row (profiles has no phone column), and the
 * employees table is RLS-restricted to owner/super_admin writes — so this
 * service-role route is required; a client update would be silently blocked.
 */

const TAG = "[profile/update-self]";

function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function PATCH(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL) {
    return fail(500, "NEXT_PUBLIC_SUPABASE_URL غير مضبوط", "step=env: url empty");
  }
  if (!SERVICE_KEY) {
    return fail(500, "إعداد الخادم غير مكتمل", "step=env: SERVICE_ROLE_KEY empty");
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail(401, "جلسة المستخدم غير صالحة — يرجى تسجيل الدخول مجدداً", "step=auth: no Bearer");
  }
  const token = authHeader.slice(7);

  // Identity comes ONLY from the verified token — never from the request body.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return fail(401, "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً", `step=auth: ${userErr?.message ?? "no user"}`);
  }
  const callerId = userData.user.id;

  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("organization_id, is_active")
    .eq("id", callerId)
    .maybeSingle();

  if (profErr) {
    return fail(500, "تعذر التحقق من حسابك", `step=profile: ${profErr.message}`);
  }
  if (!prof) {
    return fail(404, "لا يوجد ملف شخصي مرتبط بحسابك", "step=profile: no row");
  }
  if (prof.is_active === false) {
    return fail(403, "تم تعطيل حسابك داخل هذه المنشأة. يرجى التواصل مع مدير المنشأة.", "step=guard: inactive");
  }
  const callerOrgId = (prof.organization_id as string | null) ?? null;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return fail(400, "طلب غير صالح — تعذر قراءة البيانات", `step=parse: ${String(e)}`);
  }

  const { name, phone } = body as { name?: string; phone?: string | null };

  // Only personal fields. `null` phone is an explicit clear; `undefined` leaves
  // the value unchanged. Anything else in the body is ignored entirely.
  const cleanName =
    typeof name === "string" && name.trim().length > 0 ? name.trim().slice(0, 100) : undefined;
  const cleanPhone =
    typeof phone === "string" ? phone.slice(0, 20) : phone === null ? null : undefined;

  if (cleanName === undefined && cleanPhone === undefined) {
    return fail(400, "لا توجد حقول للتحديث", "step=validate: no name/phone");
  }

  // profiles: name only (no phone column). Scoped to the caller's own id.
  if (cleanName !== undefined) {
    const { error: pErr } = await admin
      .from("profiles")
      .update({ name: cleanName })
      .eq("id", callerId);
    if (pErr) {
      return fail(500, `فشل تحديث الاسم: ${pErr.message}`, `step=updateProfile: ${pErr.message}`);
    }
    await admin.auth.admin.updateUserById(callerId, { user_metadata: { name: cleanName } });
  }

  // Guarantee the identity invariant BEFORE writing phone: owner-provisioned
  // managers historically had a profile but no employees row, which is exactly
  // why their phone could not be saved (the update matched 0 rows). This is
  // self-scoped — callerId comes only from the verified token.
  const ensured = await ensureEmployeeRow(admin, callerId);
  if (!ensured.ok) {
    return fail(ensured.status, ensured.error, ensured.debug);
  }

  // employees: name + phone. Scoped to the caller's own id AND organization, so
  // a same-email row in another tenant can never be reached. phone lives ONLY
  // here (profiles has no phone column), so a phone change MUST verify a row was
  // actually written — otherwise the UI would show a false success and the value
  // would appear to "revert" to غير محدد on the next read.
  let persistedPhone: string | null | undefined = undefined;
  const employeeSync: Record<string, unknown> = {};
  if (cleanName !== undefined) employeeSync.name = cleanName;
  if (cleanPhone !== undefined) employeeSync.phone = cleanPhone;
  if (Object.keys(employeeSync).length > 0) {
    let q = admin.from("employees").update(employeeSync).eq("id", callerId);
    if (callerOrgId) q = q.eq("organization_id", callerOrgId);
    // .select() returns the rows actually updated, so we can both detect a
    // no-op (0 rows) and read back the value that was truly persisted.
    const { data: updatedRows, error: eErr } = await q.select("phone");

    if (eErr) {
      // A phone change has no fallback store — surface the failure rather than
      // claim success. A name-only change is already safe in profiles, so it
      // stays non-fatal there.
      if (cleanPhone !== undefined) {
        return fail(500, `تعذّر حفظ رقم الهاتف: ${eErr.message}`, `step=updateEmployee: ${eErr.message}`);
      }
      console.warn(`${TAG} employees name sync skipped (non-fatal): ${eErr.message}`);
    } else if (!updatedRows || updatedRows.length === 0) {
      // No employees row matched (missing row or org mismatch). The phone could
      // not be stored, so never report a silent success for a phone change.
      if (cleanPhone !== undefined) {
        return fail(
          404,
          "تعذّر حفظ رقم الهاتف — لا يوجد سجل موظف مرتبط بحسابك في هذه المنشأة. يرجى التواصل مع مدير المنشأة.",
          "step=updateEmployee: 0 rows affected",
        );
      }
    } else {
      persistedPhone = (updatedRows[0]?.phone as string | null) ?? null;
    }
  }

  return NextResponse.json({
    success: true,
    name: cleanName,
    // Echo the value actually stored in the employees row (not the requested
    // value) so the client always reflects ground truth. undefined = unchanged.
    phone: cleanPhone === undefined ? undefined : persistedPhone ?? null,
  });
}
