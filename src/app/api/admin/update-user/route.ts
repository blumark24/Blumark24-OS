import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId, validateRole, validateName, firstError } from "@/lib/apiValidation";
import {
  assertTargetUserInCallerOrg,
  authorizeUserProvisioner,
  sanitizeRoleForProvisioner,
} from "@/lib/api/tenantUserAdmin";
import { ensureEmployeeRow } from "@/lib/api/ensureEmployee";

const TAG = "[update-user]";

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function PATCH(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  console.log(`${TAG} start | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY} (len=${SERVICE_KEY.length})`);

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
  console.log(`${TAG} step=auth ok | caller=${provisioner.callerEmail}`);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return fail(400, "طلب غير صالح — تعذر قراءة البيانات المرسلة", `step=parse: ${String(e)}`);
  }

  const validationError = firstError(
    validateUserId(body.userId),
    validateRole(body.role),
    validateName(body.name),
  );
  if (validationError) {
    return fail(400, validationError,
      `step=validate | userId=${JSON.stringify(body.userId)} role=${JSON.stringify(body.role)} name=${JSON.stringify(body.name)}`,
    );
  }

  const { userId, role, department, isActive, name, jobTitle, phone, salary } = body as {
    userId: string;
    role?: string;
    department?: string;
    isActive?: boolean;
    name?: string;
    jobTitle?: string;
    phone?: string | null;
    salary?: number | null;
  };

  const cleanDept     = typeof department === "string" ? department.slice(0, 100) : undefined;
  const cleanIsActive = typeof isActive === "boolean" ? isActive : undefined;
  const cleanName     = typeof name === "string" ? name.trim().slice(0, 100) : undefined;
  // Organizational job-title tier (display label only; employees table only).
  const cleanJobTitle = typeof jobTitle === "string" ? jobTitle.slice(0, 60) : undefined;
  // Contact/compensation fields live on the employees record only (not profiles).
  // `null` is an explicit clear; `undefined` means "leave unchanged".
  const cleanPhone    = typeof phone === "string" ? phone.slice(0, 20) : phone === null ? null : undefined;
  const cleanSalary   = typeof salary === "number" && salary >= 0 ? salary : salary === null ? null : undefined;
  let cleanRole = typeof role === "string" ? role : undefined;

  const targetCheck = await assertTargetUserInCallerOrg(admin, userId, provisioner);
  if (!targetCheck.ok) {
    return fail(targetCheck.status, targetCheck.error, targetCheck.debug ?? "step=org-scope");
  }

  if (cleanRole) {
    const roleCheck = sanitizeRoleForProvisioner(provisioner, cleanRole);
    if (typeof roleCheck !== "string") {
      return fail(roleCheck.status, roleCheck.error, roleCheck.debug ?? "step=role");
    }
    cleanRole = roleCheck;
  }

  if (
    !cleanRole &&
    !cleanDept &&
    cleanIsActive === undefined &&
    !cleanName &&
    cleanJobTitle === undefined &&
    cleanPhone === undefined &&
    cleanSalary === undefined
  ) {
    return fail(400, "لا توجد حقول للتحديث", "step=validate: no updatable fields");
  }

  // profiles table does not have updated_at — build update map without it
  const profileUpdate: Record<string, unknown> = {};
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  console.log(`${TAG} step=updateProfile | userId=${userId} fields=${JSON.stringify(profileUpdate)}`);
  let profileUpdateQuery = admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (targetCheck.targetOrgId) {
    profileUpdateQuery = profileUpdateQuery.eq("organization_id", targetCheck.targetOrgId);
  }
  const { error: profileError } = await profileUpdateQuery;
  if (profileError) {
    return fail(500,
      `فشل تحديث الملف الشخصي: ${profileError.message}`,
      `step=updateProfile: ${profileError.message}`,
    );
  }
  console.log(`${TAG} step=updateProfile ok`);

  if (cleanName !== undefined) {
    console.log(`${TAG} step=updateAuthMeta | userId=${userId} name=${cleanName}`);
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } });
  }

  // Guarantee the target has an employees row BEFORE syncing, so the sync can
  // never silently no-op against a missing row. The target was already verified
  // to be in the caller's organization (assertTargetUserInCallerOrg above).
  const ensured = await ensureEmployeeRow(admin, userId);
  if (!ensured.ok) {
    return fail(ensured.status, ensured.error, ensured.debug);
  }

  // Sync the same fields to the employees table so the employees list
  // stays consistent with the profiles table after a Settings-panel edit.
  const employeeSync: Record<string, unknown> = {};
  if (cleanName     !== undefined) employeeSync.name       = cleanName;
  if (cleanRole     !== undefined) employeeSync.role       = cleanRole;
  if (cleanDept     !== undefined) employeeSync.department = cleanDept;
  if (cleanJobTitle !== undefined) employeeSync.job_title  = cleanJobTitle;
  if (cleanPhone    !== undefined) employeeSync.phone      = cleanPhone;
  if (cleanSalary   !== undefined) employeeSync.salary     = cleanSalary;
  if (cleanIsActive !== undefined) employeeSync.status     = cleanIsActive ? "نشط" : "غير_نشط";
  if (Object.keys(employeeSync).length > 0) {
    let employeeUpdateQuery = admin
      .from("employees")
      .update(employeeSync)
      .eq("id", userId);
    if (targetCheck.targetOrgId) {
      employeeUpdateQuery = employeeUpdateQuery.eq("organization_id", targetCheck.targetOrgId);
    }
    const { error: empError } = await employeeUpdateQuery;
    if (empError) {
      console.warn(`${TAG} employees sync skipped (non-fatal): ${empError.message}`);
    } else {
      console.log(`${TAG} step=syncEmployees ok`);
    }
  }

  console.log(`${TAG} SUCCESS | userId=${userId}`);
  return ok({ success: true });
}
