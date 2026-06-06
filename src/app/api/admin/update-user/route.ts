import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId, validateRole, validateName, firstError } from "@/lib/apiValidation";
import {
  assertDepartmentInOrg,
  assertTargetUserInCallerOrg,
  authorizeUserProvisioner,
  sanitizeRoleForProvisioner,
} from "@/lib/api/tenantUserAdmin";

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

  const { userId, role, department, isActive, name, phone, salary, departmentId } = body as {
    userId: string;
    role?: string;
    department?: string;
    isActive?: boolean;
    name?: string;
    phone?: string | null;
    salary?: number | null;
    departmentId?: string | null;
  };

  const cleanDept     = typeof department === "string" ? department.slice(0, 100) : undefined;
  const cleanIsActive = typeof isActive === "boolean" ? isActive : undefined;
  const cleanName     = typeof name === "string" ? name.trim().slice(0, 100) : undefined;
  const cleanPhone =
    phone === null
      ? null
      : typeof phone === "string"
        ? phone.trim().slice(0, 30)
        : undefined;
  const cleanSalary =
    salary === null
      ? null
      : typeof salary === "number" && Number.isFinite(salary)
        ? salary
        : undefined;
  const cleanDepartmentId =
    departmentId === null
      ? null
      : typeof departmentId === "string" && departmentId.trim()
        ? departmentId.trim()
        : undefined;

  let cleanRole = typeof role === "string" ? role : undefined;

  const targetCheck = await assertTargetUserInCallerOrg(admin, userId, provisioner);
  if (!targetCheck.ok) {
    return fail(targetCheck.status, targetCheck.error, targetCheck.debug ?? "step=org-scope");
  }
  const { targetOrgId, hasProfile } = targetCheck;

  if (cleanRole) {
    const roleCheck = sanitizeRoleForProvisioner(provisioner, cleanRole);
    if (typeof roleCheck !== "string") {
      return fail(roleCheck.status, roleCheck.error, roleCheck.debug ?? "step=role");
    }
    cleanRole = roleCheck;
  }

  const hasEmployeeField =
    cleanRole !== undefined ||
    cleanDept !== undefined ||
    cleanIsActive !== undefined ||
    cleanName !== undefined ||
    cleanPhone !== undefined ||
    cleanSalary !== undefined ||
    cleanDepartmentId !== undefined;

  if (!hasEmployeeField) {
    return fail(400, "لا توجد حقول للتحديث", "step=validate: no updatable fields");
  }

  let resolvedDeptLabel = cleanDept;
  if (cleanDepartmentId) {
    const deptCheck = await assertDepartmentInOrg(admin, cleanDepartmentId, targetOrgId);
    if (!deptCheck.ok) {
      return fail(deptCheck.status, deptCheck.error, deptCheck.debug ?? "step=department");
    }
    resolvedDeptLabel = deptCheck.name;
  }

  // ── 1. Persist employee row (service role — bypasses client RLS) ──────────
  const employeeUpdate: Record<string, unknown> = {};
  if (cleanName !== undefined) employeeUpdate.name = cleanName;
  if (cleanRole !== undefined) employeeUpdate.role = cleanRole;
  if (resolvedDeptLabel !== undefined) employeeUpdate.department = resolvedDeptLabel;
  if (cleanIsActive !== undefined) {
    employeeUpdate.status = cleanIsActive ? "نشط" : "غير_نشط";
  }
  if (cleanPhone !== undefined) employeeUpdate.phone = cleanPhone;
  if (cleanSalary !== undefined) employeeUpdate.salary = cleanSalary;

  if (Object.keys(employeeUpdate).length > 0) {
    console.log(`${TAG} step=updateEmployee | userId=${userId} fields=${JSON.stringify(employeeUpdate)}`);
    const { error: empError } = await admin
      .from("employees")
      .update(employeeUpdate)
      .eq("id", userId);
    if (empError) {
      return fail(500,
        `فشل تحديث بيانات الموظف: ${empError.message}`,
        `step=updateEmployee: ${empError.message}`,
      );
    }
    console.log(`${TAG} step=updateEmployee ok`);
  }

  // ── 2. Org unit assignment (employee_relations) ───────────────────────────
  if (cleanDepartmentId && targetOrgId) {
    console.log(`${TAG} step=upsertRelation | userId=${userId} dept=${cleanDepartmentId}`);
    const { error: relError } = await admin
      .from("employee_relations")
      .upsert(
        {
          organization_id: targetOrgId,
          employee_id: userId,
          department_id: cleanDepartmentId,
          team_id: null,
          position_id: null,
          manager_id: null,
        },
        { onConflict: "organization_id,employee_id" },
      );
    if (relError) {
      return fail(500,
        `فشل ربط الموظف بالوحدة التنظيمية: ${relError.message}`,
        `step=upsertRelation: ${relError.message}`,
      );
    }
    console.log(`${TAG} step=upsertRelation ok`);
  }

  // ── 3. Profile + auth sync (PR5-B) — non-fatal when profile missing ───────
  let profileMissing = !hasProfile;

  if (hasProfile) {
    const profileUpdate: Record<string, unknown> = {};
    if (cleanRole !== undefined) profileUpdate.role = cleanRole;
    if (resolvedDeptLabel !== undefined) profileUpdate.department = resolvedDeptLabel;
    if (cleanIsActive !== undefined) profileUpdate.is_active = cleanIsActive;
    if (cleanName !== undefined) profileUpdate.name = cleanName;

    if (Object.keys(profileUpdate).length > 0) {
      console.log(`${TAG} step=updateProfile | userId=${userId} fields=${JSON.stringify(profileUpdate)}`);
      const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
      if (profileError) {
        return fail(500,
          `فشل تحديث الملف الشخصي: ${profileError.message}`,
          `step=updateProfile: ${profileError.message}`,
        );
      }
      console.log(`${TAG} step=updateProfile ok`);
    }

    if (cleanName !== undefined) {
      console.log(`${TAG} step=updateAuthMeta | userId=${userId} name=${cleanName}`);
      const { error: authMetaErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: { name: cleanName },
      });
      if (authMetaErr) {
        console.warn(`${TAG} auth metadata skipped (non-fatal): ${authMetaErr.message}`);
        profileMissing = true;
      }
    }
  }

  console.log(`${TAG} SUCCESS | userId=${userId} profileMissing=${profileMissing}`);
  return ok({ success: true, profileMissing });
}
