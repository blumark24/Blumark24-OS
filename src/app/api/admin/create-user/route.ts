// /api/admin/create-user
// Real Supabase flow inside a single top-level try/catch.
// Creates auth user → upserts profiles → upserts employees, with rollback.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  authorizeUserProvisioner,
  sanitizeRoleForProvisioner,
} from "@/lib/api/tenantUserAdmin";
import { checkRateLimit, resolveIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 10 user creations per caller per hour — prevents runaway provisioning.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60_000;

export async function POST(req: NextRequest) {
  try {
    // ── 0. rate limit by IP before any heavy work ─────────────────────────
    const ip = resolveIp(req);
    const rl = checkRateLimit(`create-user:ip:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "تجاوزت الحد المسموح من العمليات. حاول لاحقاً." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
      );
    }

    // ── 1. env (read inside handler) ──────────────────────────────────────
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "إعداد الخادم غير مكتمل — أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في Vercel Environment Variables",
          ...(process.env.NODE_ENV !== "production" ? { debug: `urlSet=${!!SUPABASE_URL} keySet=${!!SERVICE_KEY}` } : {}),
        },
        { status: 500 },
      );
    }

    // ── 2. service-role admin client (the ONLY client used) ───────────────
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 3. caller auth (await) ────────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header مفقود — يرجى تسجيل الدخول مجدداً" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);

    const tokenResp = await admin.auth.getUser(token);
    if (tokenResp.error || !tokenResp.data?.user) {
      return NextResponse.json(
        {
          success: false,
          error:   "جلسة المستخدم غير صالحة أو انتهت",
          ...(process.env.NODE_ENV !== "production" ? { debug: tokenResp.error?.message ?? "no user" } : {}),
        },
        { status: 401 },
      );
    }
    const authResult = await authorizeUserProvisioner(admin, token);
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error, ...(process.env.NODE_ENV !== "production" ? { debug: authResult.debug } : {}) },
        { status: authResult.status },
      );
    }
    const provisioner = authResult.auth;
    const callerEmail = provisioner.callerEmail;
    const callerId = provisioner.callerId;
    const callerOrgId = provisioner.callerOrgId;
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[create-user] caller verified email=${callerEmail} platform=${provisioner.isPlatformAdmin} orgManager=${provisioner.isOrgManager}`,
      );
    }

    // ── 4. parse body (await; outer catch handles malformed JSON) ─────────
    const body = (await req.json()) as Record<string, unknown>;

    // ── 5. inline clean + validate ────────────────────────────────────────
    const rawEmail = typeof body.email === "string" ? body.email : "";
    // eslint-disable-next-line no-control-regex
    const email = rawEmail.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }
    if (email.length > 254) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني طويل جداً" }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (!password)                       return NextResponse.json({ success: false, error: "كلمة المرور مطلوبة" }, { status: 400 });
    if (password.length < 8)             return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    if (password.length > 128)           return NextResponse.json({ success: false, error: "كلمة المرور طويلة جداً" }, { status: 400 });
    if (!/[A-Z]/.test(password))         return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)" }, { status: 400 });
    if (!/[a-z]/.test(password))         return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)" }, { status: 400 });
    if (!/[0-9]/.test(password))         return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تحتوي على رقم (0-9)" }, { status: 400 });
    if (!/[^A-Za-z0-9]/.test(password)) return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تحتوي على رمز (!@#$...)" }, { status: 400 });

    const ARABIC_TO_ROLE: Record<string, string> = {
      "مدير أعلى":          "super_admin",
      "مدير عام":           "super_admin",
      "عضو مجلس الإدارة":  "board_member",
      "مدير الدفاع":         "defense_manager",
      "مدير وكالة الدفاع":  "defense_manager",
      "مدير الهجوم":         "attack_manager",
      "مدير وكالة الهجوم":  "attack_manager",
      "مدير المالية":        "finance_manager",
      "مدير مالي":           "finance_manager",
      "مدير المنشأة":        "organization_manager",
      "مدير_المنشأة":        "organization_manager",
      "موظف":                "employee",
    };
    const PLATFORM_ROLES = [
      "super_admin",
      "board_member",
      "defense_manager",
      "attack_manager",
      "finance_manager",
      "organization_manager",
      "employee",
    ];
    const rawRole = typeof body.role === "string" ? body.role : "employee";
    let role = ARABIC_TO_ROLE[rawRole] ?? rawRole;
    // Organizational job-title tier (display label only; not an auth role).
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.slice(0, 60) : null;
    if (provisioner.isPlatformAdmin) {
      if (!PLATFORM_ROLES.includes(role)) {
        return NextResponse.json(
          { success: false, error: `الدور غير مقبول: ${rawRole}`, ...(process.env.NODE_ENV !== "production" ? { debug: `mapped=${role}` } : {}) },
          { status: 400 },
        );
      }
    }
    const roleCheck = sanitizeRoleForProvisioner(provisioner, role);
    if (typeof roleCheck !== "string") {
      return NextResponse.json(
        { success: false, error: roleCheck.error, ...(process.env.NODE_ENV !== "production" ? { debug: roleCheck.debug } : {}) },
        { status: roleCheck.status },
      );
    }
    role = roleCheck;

    const name       = typeof body.name === "string" && body.name.trim()
                          ? body.name.trim().slice(0, 100)
                          : email.split("@")[0];
    const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
    const phone      = typeof body.phone      === "string" ? body.phone.slice(0, 20)        : null;
    const salary     = typeof body.salary     === "number" && body.salary >= 0 ? body.salary : null;
    const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

    // ── 6. create auth user (await) ───────────────────────────────────────
    const createResp = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (createResp.error || !createResp.data?.user) {
      const msg   = createResp.error?.message ?? "تعذر إنشاء حساب المصادقة";
      const lower = msg.toLowerCase();
      const dup =
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists") ||
        lower.includes("duplicate");
      return NextResponse.json(
        {
          success: false,
          error: dup
            ? `البريد الإلكتروني (${email}) مسجل مسبقاً`
            : `فشل إنشاء الحساب: ${msg}`,
          ...(process.env.NODE_ENV !== "production" ? { debug: msg } : {}),
        },
        { status: 400 },
      );
    }
    const userId = createResp.data.user.id;

    // ── 7. upsert profile (await; rollback auth user on failure) ──────────
    // Try with force_password_change first; fall back without it if the column
    // is absent (migration 005 not yet applied in this Supabase project).
    const orgStamp = callerOrgId ? { organization_id: callerOrgId } : {};
    let profUpsert = await admin.from("profiles").upsert(
      { id: userId, email, name, role, department, is_active: true, force_password_change: true, ...orgStamp },
      { onConflict: "id" },
    );
    if (profUpsert.error?.message?.toLowerCase().includes("force_password_change")) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[create-user] force_password_change column missing — retrying without it");
      }
      profUpsert = await admin.from("profiles").upsert(
        { id: userId, email, name, role, department, is_active: true, ...orgStamp },
        { onConflict: "id" },
      );
    }
    if (profUpsert.error) {
      console.error(`[create-user] profile upsert failed: ${profUpsert.error.message} — rolling back`);
      const rb = await admin.auth.admin.deleteUser(userId);
      if (rb.error) console.error(`[create-user] rollback (post-profile) failed: ${rb.error.message}`);
      return NextResponse.json(
        {
          success: false,
          error:   `فشل إنشاء الملف الشخصي: ${profUpsert.error.message}`,
          ...(process.env.NODE_ENV !== "production" ? { debug: profUpsert.error.message } : {}),
        },
        { status: 500 },
      );
    }

    // ── 8. upsert employee (await; rollback auth user on failure) ─────────
    const empUpsert = await admin.from("employees").upsert(
      [{
        id:              userId,
        name,
        email,
        phone,
        department,
        role,
        ...(jobTitle ? { job_title: jobTitle } : {}),
        status,
        salary,
        join_date:       new Date().toISOString().split("T")[0],
        performance:     3,
        tasks:           0,
        completed_tasks: 0,
        ...orgStamp,
      }],
      { onConflict: "id" },
    );
    if (empUpsert.error) {
      console.error(`[create-user] employees upsert failed: ${empUpsert.error.message} — rolling back`);
      const rb = await admin.auth.admin.deleteUser(userId);
      if (rb.error) console.error(`[create-user] rollback (post-employees) failed: ${rb.error.message}`);
      return NextResponse.json(
        {
          success: false,
          error:   `فشل إنشاء سجل الموظف: ${empUpsert.error.message}`,
          ...(process.env.NODE_ENV !== "production" ? { debug: empUpsert.error.message } : {}),
        },
        { status: 500 },
      );
    }
    // ── 9. final success ──────────────────────────────────────────────────
    return NextResponse.json({ success: true, id: userId, name });

  } catch (error: unknown) {
    const msg   = error instanceof Error ? error.message     : String(error);
    const stack = error instanceof Error ? error.stack ?? "" : "";
    console.error("[CREATE_USER_FATAL]", error);
    return NextResponse.json(
      {
        success: false,
        fatal:   true,
        error:   msg || "Unknown error",
        ...(process.env.NODE_ENV !== "production" ? { stack: String(stack) } : {}),
      },
      { status: 500 },
    );
  }
}
