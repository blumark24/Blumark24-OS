import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail, validatePassword, validateRole, validateName, firstError,
} from "@/lib/apiValidation";

const TAG          = "[create-user]";
const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

const ARABIC_TO_ROLE: Record<string, string> = {
  "مدير أعلى":           "super_admin",
  "مدير عام":            "super_admin",
  "عضو مجلس الإدارة":   "board_member",
  "مدير الدفاع":         "defense_manager",
  "مدير وكالة الدفاع":  "defense_manager",
  "مدير الهجوم":         "attack_manager",
  "مدير وكالة الهجوم":  "attack_manager",
  "مدير المالية":        "finance_manager",
  "مدير مالي":           "finance_manager",
  "موظف":                "employee",
};

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function POST(req: NextRequest) {
  // ── 0. Read env vars INSIDE the handler (never at module level in Next.js) ──
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  console.log(
    `${TAG} start | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY} (len=${SERVICE_KEY.length})`,
  );

  if (!SUPABASE_URL) {
    return fail(500,
      "NEXT_PUBLIC_SUPABASE_URL غير مضبوط",
      "step=env: NEXT_PUBLIC_SUPABASE_URL is empty",
    );
  }
  if (!SERVICE_KEY) {
    return fail(500,
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY",
      "step=env: SUPABASE_SERVICE_ROLE_KEY is empty or undefined",
    );
  }

  // ── 1. Build service-role admin client (only one client needed) ────────────
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 2. Authenticate caller via service-role getUser (no anon key needed) ──
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail(401,
      "Authorization header مفقود أو غير صالح",
      "step=auth: no Bearer prefix",
    );
  }
  const token = authHeader.slice(7);

  const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller) {
    return fail(403,
      "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً",
      `step=auth: ${callerErr?.message ?? "no user returned"}`,
    );
  }

  // Check caller is admin (by email whitelist or profile.role)
  const callerEmail = caller.email ?? "";
  let isAdmin = ADMIN_EMAILS.includes(callerEmail);
  if (!isAdmin) {
    const { data: prof } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .maybeSingle();
    isAdmin = prof?.role === "super_admin";
  }
  if (!isAdmin) {
    return fail(403,
      "غير مصرح — هذه العملية تتطلب صلاحيات المدير الأعلى",
      `step=auth: caller email=${callerEmail} id=${caller.id}`,
    );
  }
  console.log(`${TAG} step=auth ok | caller=${callerEmail}`);

  // ── 3. Parse body ──────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return fail(400,
      "طلب غير صالح — تعذر قراءة البيانات المرسلة",
      `step=parse: ${String(e)}`,
    );
  }

  // ── 4. Clean + map + validate ──────────────────────────────────────────────
  // Strip RTL/LTR invisible chars, Arabic comma, whitespace BEFORE validation
  const rawEmail = typeof body.email === "string" ? body.email : "";
  // eslint-disable-next-line no-control-regex
  const email = rawEmail.replace(/[^\x00-\x7F]/g, "").replace(/\s/g, "").trim().toLowerCase();
  if (email !== rawEmail.trim().toLowerCase()) {
    console.log(`${TAG} step=clean | raw=${JSON.stringify(rawEmail)} → email=${email}`);
  }

  const rawRole = typeof body.role === "string" ? body.role : "employee";
  const role    = ARABIC_TO_ROLE[rawRole] ?? rawRole;
  if (role !== rawRole) {
    console.log(`${TAG} step=role | raw="${rawRole}" → role="${role}"`);
  }

  const validationError = firstError(
    validateEmail(email),
    validatePassword(body.password),
    validateRole(role),
    validateName(body.name),
  );
  if (validationError) {
    return fail(400, validationError,
      `step=validate | email=${email} role=${role} name=${JSON.stringify(body.name)} pwdLen=${typeof body.password === "string" ? body.password.length : "?"}`,
    );
  }

  const password   = body.password as string;
  const name       = typeof body.name === "string" ? body.name.trim() : email.split("@")[0];
  const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
  const phone      = typeof body.phone   === "string" ? body.phone.slice(0, 20) : null;
  const salary     = typeof body.salary  === "number" && body.salary >= 0 ? body.salary : null;
  const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

  console.log(`${TAG} step=inputs | email=${email} role=${role} dept="${department}" status=${status} salary=${salary}`);

  // ── 5. Create auth user ────────────────────────────────────────────────────
  console.log(`${TAG} step=createUser | calling admin.auth.admin.createUser email=${email}`);

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  // Always log the full result so Vercel logs show exactly what happened
  console.log(
    `${TAG} step=createUser result | error="${authError?.message ?? "none"}" userId="${authData?.user?.id ?? "none"}"`,
  );

  if (authError) {
    const lower = authError.message.toLowerCase();
    const dup = lower.includes("already") || lower.includes("registered")
             || lower.includes("exists")  || lower.includes("duplicate");
    return fail(400,
      dup
        ? `البريد الإلكتروني (${email}) مسجل مسبقاً — احذف الحساب القديم من Supabase Auth أو استخدم بريداً مختلفاً`
        : `فشل إنشاء حساب المستخدم: ${authError.message}`,
      `step=createUser: ${authError.message}`,
    );
  }

  const userId = authData.user.id;
  console.log(`${TAG} step=createUser ok | userId=${userId}`);

  // ── 6. Upsert profiles row ─────────────────────────────────────────────────
  console.log(`${TAG} step=profiles | userId=${userId}`);
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id: userId, email, name, role, department, is_active: true }, { onConflict: "id" });

  if (profileError) {
    console.error(`${TAG} step=profiles error: ${profileError.message} — rolling back auth user`);
    const { error: rbErr } = await admin.auth.admin.deleteUser(userId);
    if (rbErr) console.error(`${TAG} rollback error: ${rbErr.message}`);
    return fail(500,
      `فشل إنشاء الملف الشخصي: ${profileError.message}`,
      `step=profiles: ${profileError.message}`,
    );
  }
  console.log(`${TAG} step=profiles ok`);

  // ── 7. Upsert employees row ────────────────────────────────────────────────
  console.log(`${TAG} step=employees | userId=${userId}`);
  const { error: empError } = await admin.from("employees").upsert(
    [{
      id: userId, name, email, phone, department, role, status, salary,
      join_date:       new Date().toISOString().split("T")[0],
      performance:     3,
      tasks:           0,
      completed_tasks: 0,
    }],
    { onConflict: "id" },
  );

  if (empError) {
    console.error(`${TAG} step=employees error: ${empError.message} — rolling back auth user`);
    const { error: rbErr } = await admin.auth.admin.deleteUser(userId);
    if (rbErr) console.error(`${TAG} rollback error: ${rbErr.message}`);
    return fail(500,
      `فشل إنشاء سجل الموظف: ${empError.message}`,
      `step=employees: ${empError.message}`,
    );
  }
  console.log(`${TAG} step=employees ok`);

  console.log(`${TAG} SUCCESS | userId=${userId} email=${email} role=${role}`);
  return ok({ success: true, id: userId, name });
}
