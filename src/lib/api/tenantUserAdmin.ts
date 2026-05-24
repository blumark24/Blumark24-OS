import type { SupabaseClient, User } from "@supabase/supabase-js";

const OWNER_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

/** Roles a tenant organization_manager may assign (never platform roles). */
export const TENANT_ASSIGNABLE_ROLES = new Set([
  "employee",
  "finance_manager",
  "organization_manager",
]);

const BLOCKED_TARGET_ROLES = new Set(["super_admin", "board_member", "admin"]);

export type UserProvisionerAuth = {
  caller: User;
  callerId: string;
  callerEmail: string;
  callerOrgId: string | null;
  callerRole: string;
  isPlatformAdmin: boolean;
  isOrgManager: boolean;
};

export type AuthFail = {
  ok: false;
  status: number;
  error: string;
  debug?: string;
};

export type AuthOk = { ok: true; auth: UserProvisionerAuth };

export async function authorizeUserProvisioner(
  admin: SupabaseClient,
  token: string,
): Promise<AuthOk | AuthFail> {
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return {
      ok: false,
      status: 403,
      error: "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً",
      debug: error?.message ?? "no user",
    };
  }

  const caller = data.user;
  const callerEmail = caller.email ?? "";
  const callerId = caller.id;

  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("role, organization_id")
    .eq("id", callerId)
    .maybeSingle();

  if (profErr) {
    return {
      ok: false,
      status: 500,
      error: "تعذر التحقق من صلاحيات المستخدم",
      debug: profErr.message,
    };
  }

  const callerRole = String(prof?.role ?? "employee");
  const callerOrgId = (prof?.organization_id as string | null) ?? null;

  const isOwnerEmail = OWNER_EMAILS.includes(callerEmail);
  const isSuperAdmin = callerRole === "super_admin";
  const isPlatformAdmin = isOwnerEmail || isSuperAdmin;
  const isOrgManager = callerRole === "organization_manager";

  if (!isPlatformAdmin && !isOrgManager) {
    return {
      ok: false,
      status: 403,
      error: "غير مصرح — إدارة المستخدمين تتطلب مدير المنشأة أو المدير الأعلى",
      debug: `caller=${callerEmail} role=${callerRole}`,
    };
  }

  if (isOrgManager && !isPlatformAdmin && !callerOrgId) {
    return {
      ok: false,
      status: 403,
      error: "حسابك غير مربوط بمنشأة — تواصل مع الدعم",
      debug: "organization_manager without organization_id",
    };
  }

  return {
    ok: true,
    auth: {
      caller,
      callerId,
      callerEmail,
      callerOrgId,
      callerRole,
      isPlatformAdmin,
      isOrgManager,
    },
  };
}

export function sanitizeRoleForProvisioner(
  auth: UserProvisionerAuth,
  requestedRole: string,
): string | AuthFail {
  const role = String(requestedRole ?? "employee").trim();

  if (auth.isPlatformAdmin) {
    return role;
  }

  if (BLOCKED_TARGET_ROLES.has(role) || !TENANT_ASSIGNABLE_ROLES.has(role)) {
    return {
      ok: false,
      status: 403,
      error: "لا يمكن تعيين هذا الدور ضمن منشأتك",
      debug: `blocked role=${role}`,
    };
  }

  return role;
}

export async function assertTargetUserInCallerOrg(
  admin: SupabaseClient,
  targetUserId: string,
  auth: UserProvisionerAuth,
): Promise<{ ok: true; targetOrgId: string | null; targetRole: string } | AuthFail> {
  if (auth.isPlatformAdmin) {
    const { data } = await admin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", targetUserId)
      .maybeSingle();
    return {
      ok: true,
      targetOrgId: (data?.organization_id as string | null) ?? null,
      targetRole: String(data?.role ?? ""),
    };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      status: 404,
      error: "المستخدم غير موجود",
      debug: error?.message,
    };
  }

  const targetOrgId = (data.organization_id as string | null) ?? null;
  const targetRole = String(data.role ?? "");

  if (BLOCKED_TARGET_ROLES.has(targetRole)) {
    return {
      ok: false,
      status: 403,
      error: "لا يمكن تعديل حسابات المنصة من داخل منشأة العميل",
    };
  }

  if (targetOrgId !== auth.callerOrgId) {
    return {
      ok: false,
      status: 403,
      error: "غير مصرح — المستخدم ينتمي لمنشأة أخرى",
      debug: `targetOrg=${targetOrgId} callerOrg=${auth.callerOrgId}`,
    };
  }

  return { ok: true, targetOrgId, targetRole };
}
