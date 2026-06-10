import type { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOwnerEmail } from "@/lib/owner";
import { ensureEmployeeRow } from "@/lib/api/ensureEmployee";

export const CLIENT_MANAGER_ROLE = "organization_manager";

export function createServiceRoleAdmin(): { admin: SupabaseClient } | { error: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    return {
      error: "إعداد الخادم غير مكتمل — أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY",
    };
  }
  return {
    admin: createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function verifyOwnerBearer(
  req: NextRequest,
  admin: SupabaseClient,
): Promise<{ ok: true; callerEmail: string } | { ok: false; error: string; status: number }> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "جلسة غير صالحة — سجّل الدخول مجدداً", status: 401 };
  }
  const token = authHeader.slice(7);
  const tokenResp = await admin.auth.getUser(token);
  const callerEmail = tokenResp.data?.user?.email ?? "";
  if (tokenResp.error || !callerEmail || !isOwnerEmail(callerEmail)) {
    return {
      ok: false,
      error: "غير مصرح — هذه العملية مخصصة لمالك المنصة",
      status: 403,
    };
  }
  return { ok: true, callerEmail };
}

export function passwordError(password: string): string | null {
  if (!password) return "كلمة المرور مطلوبة";
  if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (password.length > 128) return "كلمة المرور طويلة جداً";
  if (!/[A-Z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)";
  if (!/[a-z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)";
  if (!/[0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رقم (0-9)";
  if (!/[^A-Za-z0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رمز (!@#$...)";
  return null;
}

export async function upsertLinkedProfile(
  admin: SupabaseClient,
  args: { userId: string; email: string; name: string; organizationId: string },
): Promise<{ error: string | null }> {
  const base = {
    id: args.userId,
    email: args.email,
    name: args.name,
    role: CLIENT_MANAGER_ROLE,
    is_active: true,
    organization_id: args.organizationId,
  };
  let res = await admin
    .from("profiles")
    .upsert({ ...base, force_password_change: true }, { onConflict: "id" });
  if (res.error?.message?.toLowerCase().includes("force_password_change")) {
    res = await admin.from("profiles").upsert(base, { onConflict: "id" });
  }
  if (res.error) {
    return { error: res.error.message };
  }
  // Tenant identity invariant: every provisioned manager must also have a
  // matching employees row (same id + organization_id) from day one — otherwise
  // their profile phone / work context cannot be saved. Idempotent; never
  // touches owner-panel UI or subscription/package logic.
  const ensured = await ensureEmployeeRow(admin, args.userId);
  if (!ensured.ok) {
    return { error: ensured.error };
  }
  return { error: null };
}

export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) return null;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < perPage) break;
  }
  return null;
}

export async function findProfileByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ id: string; organization_id: string | null } | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, organization_id")
    .ilike("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    organization_id: (data.organization_id as string | null) ?? null,
  };
}

export async function writeOwnerAuditLog(
  admin: SupabaseClient,
  entry: {
    owner_email: string;
    action: string;
    target_type: string;
    target_id?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await admin.from("owner_audit_logs").insert({
      owner_email: entry.owner_email,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (logErr) {
    console.warn(`[owner-audit] ${entry.action} insert failed:`, logErr);
  }
}
