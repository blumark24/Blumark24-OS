// /api/admin/create-user
// Single top-level try/catch wrapping the entire POST body. ALL logic is
// inside it. ALL Supabase calls are awaited. NO module-level state, NO
// top-level await, NO top-level createClient, NO unawaited promise chains.

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[create-user] start");

    // ── 1. env (read inside handler) ──────────────────────────────────────
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return Response.json(
        {
          success: false,
          error:
            "إعداد الخادم غير مكتمل — أضف NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في Vercel Environment Variables",
          debug: `urlSet=${!!SUPABASE_URL} keySet=${!!SERVICE_KEY}`,
        },
        { status: 500 },
      );
    }
    console.log(`[create-user] env loaded URL=${!!SUPABASE_URL} KEY=${!!SERVICE_KEY}`);

    // ── 2. service-role client (the ONLY client; no anon path) ────────────
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 3. caller auth (await) ────────────────────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return Response.json(
        { success: false, error: "Authorization header مفقود — يرجى تسجيل الدخول مجدداً" },
        { status: 401 },
      );
    }
    const token = authHeader.slice(7);

    const tokenResp = await admin.auth.getUser(token);
    if (tokenResp.error || !tokenResp.data?.user) {
      return Response.json(
        {
          success: false,
          error:   "جلسة المستخدم غير صالحة أو انتهت",
          debug:   tokenResp.error?.message ?? "no user",
        },
        { status: 401 },
      );
    }
    const callerEmail  = tokenResp.data.user.email ?? "";
    const callerId     = tokenResp.data.user.id;
    const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

    let isAdmin = ADMIN_EMAILS.includes(callerEmail);
    if (!isAdmin) {
      const profResp = await admin
        .from("profiles")
        .select("role")
        .eq("id", callerId)
        .maybeSingle();
      isAdmin = profResp.data?.role === "super_admin";
    }
    if (!isAdmin) {
      return Response.json(
        {
          success: false,
          error:   "غير مصرح — هذه العملية تتطلب صلاحيات المدير الأعلى",
          debug:   `caller=${callerEmail} id=${callerId}`,
        },
        { status: 403 },
      );
    }
    console.log(`[create-user] caller verified email=${callerEmail}`);

    // ── 4. parse body (await; outer catch handles malformed JSON) ─────────
    const body = (await req.json()) as Record<string, unknown>;
    console.log("[create-user] request parsed");

    // ── 5. inline clean + validate ────────────────────────────────────────
    const rawEmail = typeof body.email === "string" ? body.email : "";
    // eslint-disable-next-line no-control-regex
    const email = rawEmail.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").trim().toLowerCase();
    if (!email) {
      return Response.json({ success: false, error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, error: "البريد الإلكتروني غير صالح" }, { status: 400 });
    }
    if (email.length > 254) {
      return Response.json({ success: false, error: "البريد الإلكتروني طويل جداً" }, { status: 400 });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (!password)                       return Response.json({ success: false, error: "كلمة المرور مطلوبة" }, { status: 400 });
    if (password.length < 8)             return Response.json({ success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    if (password.length > 128)           return Response.json({ success: false, error: "كلمة المرور طويلة جداً" }, { status: 400 });
    if (!/[A-Z]/.test(password))         return Response.json({ success: false, error: "كلمة المرور يجب أن تحتوي على حرف كبير (A-Z)" }, { status: 400 });
    if (!/[a-z]/.test(password))         return Response.json({ success: false, error: "كلمة المرور يجب أن تحتوي على حرف صغير (a-z)" }, { status: 400 });
    if (!/[0-9]/.test(password))         return Response.json({ success: false, error: "كلمة المرور يجب أن تحتوي على رقم (0-9)" }, { status: 400 });
    if (!/[^A-Za-z0-9]/.test(password)) return Response.json({ success: false, error: "كلمة المرور يجب أن تحتوي على رمز (!@#$...)" }, { status: 400 });

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
      "موظف":                "employee",
    };
    const VALID_ROLES = [
      "super_admin", "board_member", "defense_manager",
      "attack_manager", "finance_manager", "employee",
    ];
    const rawRole = typeof body.role === "string" ? body.role : "employee";
    const role    = ARABIC_TO_ROLE[rawRole] ?? rawRole;
    if (!VALID_ROLES.includes(role)) {
      return Response.json(
        { success: false, error: `الدور غير مقبول: ${rawRole}`, debug: `mapped=${role}` },
        { status: 400 },
      );
    }

    const name       = typeof body.name === "string" && body.name.trim()
                          ? body.name.trim().slice(0, 100)
                          : email.split("@")[0];
    const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
    const phone      = typeof body.phone      === "string" ? body.phone.slice(0, 20)        : null;
    const salary     = typeof body.salary     === "number" && body.salary >= 0 ? body.salary : null;
    const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

    // ── 6. create auth user (await) ───────────────────────────────────────
    console.log(`[create-user] creating auth user email=${email} role=${role}`);
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
      return Response.json(
        {
          success: false,
          error: dup
            ? `البريد الإلكتروني (${email}) مسجل مسبقاً`
            : `فشل إنشاء الحساب: ${msg}`,
          debug: msg,
        },
        { status: 400 },
      );
    }
    const userId = createResp.data.user.id;
    console.log(`[create-user] auth create success userId=${userId}`);

    // ── 7. upsert profile (await; rollback auth user on failure) ──────────
    const profUpsert = await admin.from("profiles").upsert(
      { id: userId, email, name, role, department, is_active: true },
      { onConflict: "id" },
    );
    if (profUpsert.error) {
      console.error(`[create-user] profile upsert failed: ${profUpsert.error.message} — rolling back`);
      const rb = await admin.auth.admin.deleteUser(userId);
      if (rb.error) console.error(`[create-user] rollback (post-profile) failed: ${rb.error.message}`);
      return Response.json(
        {
          success: false,
          error:   `فشل إنشاء الملف الشخصي: ${profUpsert.error.message}`,
          debug:   profUpsert.error.message,
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
        status,
        salary,
        join_date:       new Date().toISOString().split("T")[0],
        performance:     3,
        tasks:           0,
        completed_tasks: 0,
      }],
      { onConflict: "id" },
    );
    if (empUpsert.error) {
      console.error(`[create-user] employees upsert failed: ${empUpsert.error.message} — rolling back`);
      const rb = await admin.auth.admin.deleteUser(userId);
      if (rb.error) console.error(`[create-user] rollback (post-employees) failed: ${rb.error.message}`);
      return Response.json(
        {
          success: false,
          error:   `فشل إنشاء سجل الموظف: ${empUpsert.error.message}`,
          debug:   empUpsert.error.message,
        },
        { status: 500 },
      );
    }
    console.log(`[create-user] db insert success userId=${userId}`);

    // ── 9. final success ──────────────────────────────────────────────────
    console.log(`[create-user] SUCCESS email=${email} userId=${userId}`);
    return Response.json({ success: true, id: userId, name });

  } catch (e: unknown) {
    const msg   = e instanceof Error ? e.message     : String(e);
    const stack = e instanceof Error ? e.stack ?? "" : "";
    console.error("FATAL_CREATE_USER", e);
    return Response.json(
      {
        success: false,
        fatal:   true,
        error:   msg || "Unknown error",
        stack:   String(stack),
      },
      { status: 500 },
    );
  }
}
