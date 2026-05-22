// /api/owner/reset-client-password
// Owner-only. Sends a SECURE password-recovery link to the tenant manager's
// email for a given organization. It NEVER generates, returns, logs, or
// displays a password — the manager sets their own new password through the
// standard Supabase recovery flow (/auth/reset-password).
//
// Security model (mirrors create-client-login):
//   • The service-role key is read and used ONLY here on the server.
//   • The caller must present a Bearer access token belonging to the platform
//     owner (is_owner allowlist).
//   • Internal Blumark24 orgs are rejected — this flow is for customer tenants.
//
// Future-ready: the resolved manager email + channel are returned so a later
// AI Support Agent / WhatsApp integration can reuse this same owner-gated route
// to dispatch the recovery link over another channel. No password is ever part
// of that payload.

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isOwnerEmail } from "@/lib/owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Locates an existing auth user id by email so we only ever send a recovery
// link to a real account (and can tell the owner when none is linked yet).
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

// Heuristic: did recovery fail because the project has no email/SMTP provider
// configured (vs. a transient error)? Used to surface a clearer Arabic message.
function looksLikeEmailNotConfigured(message: string, status?: number): boolean {
  const m = message.toLowerCase();
  if (/smtp|mailer|email provider|sending|send email|not configured|email.*disabled/.test(m)) {
    return true;
  }
  // GoTrue returns 500 when it cannot hand the mail off to a provider.
  return status === 500;
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
    if (!organizationId) {
      return NextResponse.json({ success: false, error: "معرّف المنشأة مطلوب" }, { status: 400 });
    }

    // ── 4. load the organization (server-trusted source of the email) ─────
    const orgResp = await admin
      .from("organizations")
      .select("id, name, owner_email, is_internal")
      .eq("id", organizationId)
      .maybeSingle();
    if (orgResp.error) {
      return NextResponse.json({ success: false, error: "تعذّر قراءة بيانات المنشأة" }, { status: 500 });
    }
    if (!orgResp.data) {
      return NextResponse.json({ success: false, error: "المنشأة غير موجودة" }, { status: 404 });
    }

    // Internal Blumark24 org is never a "customer tenant" — block here as a
    // server-side safety net behind the UI hiding the action.
    if (orgResp.data.is_internal === true) {
      return NextResponse.json(
        { success: false, error: "هذه عملية مخصصة لعملاء المنصة فقط — لا تنطبق على منشأة Blumark24 الداخلية" },
        { status: 400 },
      );
    }

    const managerEmail = ((orgResp.data.owner_email as string | null) ?? "").trim().toLowerCase();
    if (!managerEmail) {
      return NextResponse.json(
        { success: false, error: "المنشأة لا تملك بريد مدير لإرسال الرابط إليه" },
        { status: 400 },
      );
    }
    if (isOwnerEmail(managerEmail)) {
      return NextResponse.json(
        { success: false, error: "لا يمكن تنفيذ هذه العملية على بريد مالك المنصة" },
        { status: 400 },
      );
    }

    // ── 5. ensure a real manager login exists for this email ──────────────
    const managerUserId = await findAuthUserIdByEmail(admin, managerEmail);
    if (!managerUserId) {
      return NextResponse.json(
        { success: false, error: "لا يوجد حساب مدير مرتبط بهذه المنشأة — أنشئ حساب الدخول أولاً" },
        { status: 404 },
      );
    }

    // ── 6. send the secure recovery link (NO password is created) ─────────
    // Prefer an explicit site URL for the redirect; fall back to the request
    // origin so the link always lands on the standard reset-password screen.
    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? origin).replace(/\/$/, "");
    const redirectTo = `${siteUrl}/auth/reset-password`;

    const { error: recoverErr } = await admin.auth.resetPasswordForEmail(managerEmail, { redirectTo });
    if (recoverErr) {
      const status = (recoverErr as { status?: number }).status;
      if (looksLikeEmailNotConfigured(recoverErr.message, status)) {
        return NextResponse.json(
          {
            success: false,
            error: "تعذّر إرسال البريد — يجب إعداد خدمة البريد الإلكتروني (SMTP) في Supabase لتفعيل إعادة التعيين عبر البريد. لم يتم إنشاء أو عرض أي كلمة مرور.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { success: false, error: "تعذّر إرسال رابط إعادة التعيين، حاول مرة أخرى" },
        { status: 502 },
      );
    }

    // ── 7. best-effort audit log (email only — never any password) ────────
    try {
      await admin.from("owner_audit_logs").insert({
        owner_email: callerEmail,
        action: "reset_client_password",
        target_type: "organization",
        target_id: organizationId,
        metadata: { email: managerEmail, channel: "email" },
      });
    } catch (logErr) {
      console.warn("[reset-client-password] audit log insert failed:", logErr);
    }

    return NextResponse.json({ success: true, email: managerEmail, channel: "email" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[RESET_CLIENT_PASSWORD_FATAL]", error);
    return NextResponse.json(
      { success: false, error: "تعذّر إرسال رابط إعادة التعيين، حاول مرة أخرى" },
      { status: 500 },
    );
  }
}
