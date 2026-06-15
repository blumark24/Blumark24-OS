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
  if (process.env.NODE_ENV !== "production") {
    console.error(`${TAG} HTTP ${status} | ${debug}`);
  }
  const body: Record<string, unknown> = { success: false, error };
  if (process.env.NODE_ENV !== "production") body.debug = debug;
  return NextResponse.json(body, { status });
}

export async function PATCH(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (process.env.NODE_ENV !== "production") {
    console.log(`${TAG} start | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY}`);
  }

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

  // ── Guard 1: Self-removal / self-deactivation ──────────────────────────────
  // A caller may not deactivate themselves or change their own role. This
  // prevents a manager from accidentally locking themselves out.
  if (provisioner.callerId === userId) {
    const wouldDeactivate = cleanIsActive === false;
    const wouldChangeRole = cleanRole !== undefined;
    if (wouldDeactivate || wouldChangeRole) {
      return fail(
        403,
        "لا يمكنك إزالة أو تعطيل حسابك من نفس المنشأة.",
        "step=self-removal-guard: caller is the update target",
      );
    }
  }

  // ── Guard 2: Last active organization_manager ──────────────────────────────
  // Prevent removing or downgrading the last remaining active manager in an
  // organization, which would leave no one able to administer the tenant.
  const targetIsManager = targetCheck.targetRole === "organization_manager";
  const wouldLoseManagerStatus =
    cleanIsActive === false ||
    (cleanRole !== undefined && cleanRole !== "organization_manager");

  if (targetIsManager && wouldLoseManagerStatus && targetCheck.targetOrgId) {
    const { count, error: countErr } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", targetCheck.targetOrgId)
      .eq("role", "organization_manager")
      .eq("is_active", true);

    if (countErr) {
      return fail(
        500,
        "تعذّر التحقق من مديري المنشأة النشطين — حاول مجدداً.",
        `step=last-manager-guard: count query failed: ${countErr.message}`,
      );
    }
    if ((count ?? 0) <= 1) {
      return fail(
        403,
        "لا يمكن إزالة آخر مدير نشط في المنشأة. عيّن مديرًا آخر أولًا.",
        "step=last-manager-guard: removing last active organization_manager",
      );
    }
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

  // Build both update payloads before any DB write so no write begins until
  // all guards have passed and all inputs are fully validated.

  // profiles table does not have updated_at — build update map without it
  const profileUpdate: Record<string, unknown> = {};
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  const employeeSync: Record<string, unknown> = {};
  if (cleanName     !== undefined) employeeSync.name       = cleanName;
  if (cleanRole     !== undefined) employeeSync.role       = cleanRole;
  if (cleanDept     !== undefined) employeeSync.department = cleanDept;
  if (cleanJobTitle !== undefined) employeeSync.job_title  = cleanJobTitle;
  if (cleanPhone    !== undefined) employeeSync.phone      = cleanPhone;
  if (cleanSalary   !== undefined) employeeSync.salary     = cleanSalary;
  if (cleanIsActive !== undefined) employeeSync.status     = cleanIsActive ? "نشط" : "غير_نشط";

  // Guarantee the employee row exists BEFORE the profile update so the
  // subsequent sync can never silently no-op against a missing row.
  // Note: true atomicity across profiles + employees requires a DB RPC/
  // migration and is intentionally out of scope for this PR. If the process
  // fails between the profile write and the employee sync, retrying the
  // request will re-apply the profile update (idempotent) and re-attempt sync.
  const ensured = await ensureEmployeeRow(admin, userId);
  if (!ensured.ok) {
    return fail(ensured.status, ensured.error, ensured.debug);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`${TAG} step=updateProfile | userId=${userId} fields=${JSON.stringify(profileUpdate)}`);
  }
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
  if (cleanName !== undefined) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } });
  }

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
      // Employee sync failure is now fatal. Profile was already updated above;
      // retrying the request will re-apply the profile change (idempotent) and
      // re-attempt the employee sync, restoring consistency.
      return fail(
        500,
        "فشل مزامنة سجل الموظف — يُرجى المحاولة مجدداً.",
        `step=syncEmployees: ${empError.message}`,
      );
    }
    if (process.env.NODE_ENV !== "production") {
      console.log(`${TAG} step=syncEmployees ok`);
    }
  }

  return ok({ success: true });
}
