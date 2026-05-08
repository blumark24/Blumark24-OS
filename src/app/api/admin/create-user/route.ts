import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail, validatePassword, validateRole, validateName, firstError,
} from "@/lib/apiValidation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];
const TAG = "[create-user]";

// ─── response helpers ─────────────────────────────────────────────────────────

function apiError(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} — ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

// ─── service client ───────────────────────────────────────────────────────────

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── caller verification ──────────────────────────────────────────────────────

type VerifyResult =
  | { ok: true;  userId: string; callerEmail: string }
  | { ok: false; error: string;  debug: string };

async function verifyAdmin(token: string): Promise<VerifyResult> {
  if (!SUPABASE_URL || !ANON_KEY) {
    return { ok: false, error: "إعداد Supabase غير مكتمل", debug: "NEXT_PUBLIC_SUPABASE_URL or ANON_KEY missing from env" };
  }

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authErr } = await client.auth.getUser();
  if (authErr || !user) {
    return { ok: false, error: "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً", debug: `getUser: ${authErr?.message ?? "no user returned"}` };
  }

  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) {
    return { ok: true, userId: user.id, callerEmail: email };
  }

  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return { ok: false, error: "تعذر قراءة صلاحيات المستخدم من قاعدة البيانات", debug: `profiles.select: ${profileErr.message}` };
  }

  if (profile?.role === "super_admin") {
    return { ok: true, userId: user.id, callerEmail: email };
  }

  return {
    ok: false,
    error: `غير مصرح — دورك (${profile?.role ?? "غير محدد"}) لا يملك صلاحية إنشاء المستخدمين`,
    debug: `role=${profile?.role ?? "null"}, userId=${user.id}`,
  };
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log(`${TAG} POST received from ${req.headers.get("x-forwarded-for") ?? "unknown"}`);

  // 1. Authenticate caller
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return apiError(401, "Authorization header مفقود أو غير صالح", "no Bearer prefix in Authorization header");
  }

  const identity = await verifyAdmin(authHeader.slice(7));
  if (!identity.ok) {
    return apiError(403, identity.error, identity.debug);
  }
  console.log(`${TAG} caller verified: ${identity.callerEmail}`);

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return apiError(400, "طلب غير صالح — تعذر قراءة البيانات المرسلة", `JSON.parse error: ${String(e)}`);
  }

  // 3. Pre-sanitise email and map role BEFORE validation
  // Strip RTL/LTR marks, zero-width chars, Arabic comma, then trim + lowercase
  const rawEmailInput = typeof body.email === "string" ? body.email : "";
  const email = rawEmailInput
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x00-\x7F]/g, "")   // strip all non-ASCII (invisible RTL marks, Arabic comma ،, etc.)
    .replace(/\s/g, "")              // strip any whitespace that slipped in
    .trim()
    .toLowerCase();

  if (email !== rawEmailInput.trim().toLowerCase()) {
    console.warn(`${TAG} email pre-cleaned — raw: ${JSON.stringify(rawEmailInput)}, clean: ${email}`);
  }

  // Map Arabic role labels → English system roles (safety net for any client that sends Arabic)
  const ARABIC_TO_ROLE: Record<string, string> = {
    "مدير أعلى":          "super_admin",
    "موظف":                "employee",
    "مدير مالي":          "finance_manager",
    "عضو مجلس الإدارة":  "board_member",
    "مدير وكالة الدفاع": "defense_manager",
    "مدير وكالة الهجوم": "attack_manager",
  };
  const rawRole   = typeof body.role === "string" ? body.role : "employee";
  const mappedRole = ARABIC_TO_ROLE[rawRole] ?? rawRole;

  const validationError = firstError(
    validateEmail(email),
    validatePassword(body.password),
    validateRole(mappedRole),
    validateName(body.name),
  );
  if (validationError) {
    return apiError(
      400,
      validationError,
      `validation: email=${JSON.stringify(email)}, role=${mappedRole} (raw=${rawRole}), name=${JSON.stringify(body.name)}, pwdLen=${typeof body.password === "string" ? body.password.length : "?"}`
    );
  }

  // 4. Sanitise remaining inputs
  const password   = body.password as string;
  const name       = typeof body.name === "string" ? body.name.trim() : email.split("@")[0];
  const role       = mappedRole;
  const department = typeof body.department === "string" ? body.department.slice(0, 100) : "";
  const phone      = typeof body.phone  === "string" ? body.phone.slice(0, 20) : null;
  const salary     = typeof body.salary === "number" && body.salary >= 0 ? body.salary : null;
  const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

  console.log(`${TAG} creating: email=${email}, role=${role}, dept=${department}`);

  // 5. Build service-role client
  let admin: ReturnType<typeof serviceClient>;
  try {
    admin = serviceClient();
  } catch (e) {
    return apiError(500, e instanceof Error ? e.message : "خطأ في إعداد خادم Supabase", `serviceClient: ${String(e)}`);
  }

  // 6. Create Supabase Auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError) {
    const msg = authError.message.toLowerCase();
    const isAlreadyExists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
    const userMsg = isAlreadyExists
      ? `البريد الإلكتروني (${email}) مسجل مسبقاً في النظام — استخدم بريداً مختلفاً أو احذف الحساب القديم من Supabase Auth`
      : `فشل إنشاء حساب المستخدم: ${authError.message}`;
    return apiError(400, userMsg, `auth.admin.createUser: ${authError.message}`);
  }

  const userId = authData.user.id;
  console.log(`${TAG} auth user created: ${userId}`);

  // 7. Upsert profile row (profiles table has no updated_at column)
  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, email, name, role, department, is_active: true },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error(`${TAG} profiles.upsert failed for ${userId}: ${profileError.message} — rolling back`);
    const { error: rollbackErr } = await admin.auth.admin.deleteUser(userId);
    if (rollbackErr) console.error(`${TAG} rollback (deleteUser ${userId}) failed: ${rollbackErr.message}`);
    return apiError(500, `فشل إنشاء الملف الشخصي: ${profileError.message}`, `profiles.upsert: ${profileError.message}`);
  }
  console.log(`${TAG} profile upserted: ${userId}`);

  // 8. Upsert employee row
  const { error: empError } = await admin.from("employees").upsert([{
    id: userId, name, email, phone, department, role, status,
    join_date:       new Date().toISOString().split("T")[0],
    performance:     3,
    tasks:           0,
    completed_tasks: 0,
    salary,
  }], { onConflict: "id" });
  if (empError) {
    console.error(`${TAG} employees.upsert failed for ${userId}: ${empError.message} — rolling back`);
    const { error: rollbackErr } = await admin.auth.admin.deleteUser(userId);
    if (rollbackErr) console.error(`${TAG} rollback (deleteUser ${userId}) failed: ${rollbackErr.message}`);
    return apiError(500, `فشل إنشاء سجل الموظف: ${empError.message}`, `employees.upsert: ${empError.message}`);
  }

  console.log(`${TAG} SUCCESS: userId=${userId}, email=${email}`);
  return NextResponse.json({ success: true, id: userId, name });
}
