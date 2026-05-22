// /api/owner/create-client-login
// Owner-only. Creates a Supabase Auth login account for an organization's
// owner_email and links it to that organization via profiles.organization_id.
// Service-role key is read and used ONLY here on the server — never shipped to
// the client. The caller must be the platform owner (is_owner allowlist).

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOwnerEmail } from "@/lib/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stored profile role for a client login. MUST be a value allowed by the
// profiles_role_check constraint — migration 015 adds 'organization_manager'
// (Arabic label "مدير المنشأة"). This is the establishment-level admin of a
// single customer organization: it manages its own org's data but is never an
// internal employee and never the platform owner. RLS confines every query to
// the account's profiles.organization_id, so the role grants no cross-tenant
// visibility.
const CLIENT_ROLE = "organization_manager";

function passwordError(password: string): string | null {
  if (!password) return "كلمة المرور مطلوبة";
  if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  if (password.length > 128) return "كلمة المرور طويلة جداً";
  if (!/[A-Z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)";
  if (!/[a-z]/.test(password)) return "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)";
  if (!/[0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رقم (0-9)";
  if (!/[^A-Za-z0-9]/.test(password)) return "كلمة المرور يجب أن تحتوي على رمز (!@#$...)";
  return null;
}

// Upserts the organization-linked profile row. Falls back without
// force_password_change if that column is not present in the project yet.
async function upsertLinkedProfile(
  admin: SupabaseClient,
  args: { userId: string; email: string; name: string; organizationId: string },
): Promise<{ error: string | null }> {
  const base = {
    id: args.userId,
    email: args.email,
    name: args.name,
    role: CLIENT_ROLE,
    is_active: true,
    organization_id: args.organizationId,
  };
  let res = await admin.from("profiles").upsert({ ...base, force_password_change: true }, { onConflict: "id" });
  if (res.error?.message?.toLowerCase().includes("force_password_change")) {
    res = await admin.from("profiles").upsert(base, { onConflict: "id" });
  }
  return { error: res.error ? res.error.message : null };
}

// Locates an existing auth user id by email (used to safely recover from a
// previous attempt that created the auth user but failed to link a profile).
async function findAuthUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
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

export async function POST(req: NextRequest) {
  try {
    // ── 1. env (server-only) ──────────────────────────────────────────────
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        { success: false, error: "إعداد الخادم غير مكتمل — أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 2. verify caller is the platform owner ────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "جلسة غير صالحة — سجّل الدخول مجدداً" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const tokenResp = await admin.auth.getUser(token);
    const callerEmail = tokenResp.data?.user?.email ?? "";
    if (tokenResp.error || !callerEmail || !isOwnerEmail(callerEmail)) {
      return NextResponse.json(
        { success: false, error: "غير مصرح — هذه العملية مخصصة لمالك المنصة" },
        { status: 403 },
      );
    }

    // ── 3. parse + validate input ─────────────────────────────────────────
    const body = (await req.json()) as Record<string, unknown>;
    const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!organizationId) {
      return NextResponse.json({ success: false, error: "معرّف المنشأة مطلوب" }, { status: 400 });
    }
    const pwErr = passwordError(password);
    if (pwErr) {
      return NextResponse.json({ success: false, error: pwErr }, { status: 400 });
    }

    // ── 4. load the organization (server-trusted source of the email) ─────
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
      return NextResponse.json({ success: false, error: "المنشأة لا تملك بريد مالك — أضف بريد المالك أولاً" }, { status: 400 });
    }
    if (isOwnerEmail(ownerEmail)) {
      return NextResponse.json({ success: false, error: "لا يمكن إنشاء حساب عميل لبريد مالك المنصة" }, { status: 400 });
    }

    // ── 5. block duplicate links for this organization ────────────────────
    const linkResp = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1);
    if (linkResp.error) {
      return NextResponse.json({ success: false, error: "تعذّر التحقق من الربط الحالي" }, { status: 500 });
    }
    if (linkResp.data && linkResp.data.length > 0) {
      return NextResponse.json({ success: false, error: "تم إنشاء حساب دخول لهذه المنشأة بالفعل" }, { status: 409 });
    }

    // ── 6. create (or safely adopt) the auth user ─────────────────────────
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

      // The email already has an auth user. This happens when a previous
      // attempt created the user but the profile link failed and the rollback
      // did not complete (e.g. the old role-check bug). Recover safely: adopt
      // the user ONLY if it has no profile yet — never hijack a real account.
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
          return NextResponse.json({ success: false, error: "تم إنشاء حساب دخول لهذه المنشأة بالفعل" }, { status: 409 });
        }
        return NextResponse.json(
          { success: false, error: `البريد (${ownerEmail}) مستخدم لحساب آخر — لا يمكن ربطه بهذه المنشأة` },
          { status: 409 },
        );
      }

      // Orphaned auth user (no profile): reset its password to the new temp
      // password, confirm the email, then link it below.
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

    // ── 7. upsert the linked profile ──────────────────────────────────────
    const linkRes = await upsertLinkedProfile(admin, { userId, email: ownerEmail, name, organizationId });
    if (linkRes.error) {
      // Only roll back a user WE created in this request — never delete an
      // adopted pre-existing auth user.
      if (!adopted) {
        const rb = await admin.auth.admin.deleteUser(userId);
        if (rb.error) console.error("[create-client-login] rollback failed:", rb.error.message);
      }
      return NextResponse.json(
        { success: false, error: `فشل ربط الحساب بالمنشأة: ${linkRes.error}` },
        { status: 500 },
      );
    }

    // ── 8. best-effort audit log (never undoes the created login) ─────────
    try {
      await admin.from("owner_audit_logs").insert({
        owner_email: callerEmail,
        action: "create_client_login",
        target_type: "organization",
        target_id: organizationId,
        metadata: { owner_email: ownerEmail, auth_user_id: userId, adopted },
      });
    } catch (logErr) {
      console.warn("[create-client-login] audit log insert failed:", logErr);
    }

    return NextResponse.json({ success: true, id: userId, email: ownerEmail, adopted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE_CLIENT_LOGIN_FATAL]", error);
    return NextResponse.json({ success: false, error: msg || "خطأ غير متوقع" }, { status: 500 });
  }
}
