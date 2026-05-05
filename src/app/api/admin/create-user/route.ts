import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — اذهب إلى Vercel → Project Settings → Environment Variables وأضف SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Verify that the caller is an admin using their own JWT — no service role key needed. */
async function verifyAdmin(token: string): Promise<{ userId: string; email: string } | { error: string }> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { error: "جلسة المستخدم غير صالحة أو انتهت" };
  }

  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) {
    return { userId: user.id, email };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "super_admin") {
    return { userId: user.id, email };
  }

  return {
    error: `غير مصرح — دورك الحالي (${profile?.role ?? "غير محدد"}) لا يملك صلاحية إنشاء المستخدمين`,
  };
}

export async function POST(req: NextRequest) {
  // 1. Extract Bearer token
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization header مفقود" }, { status: 401 });
  }
  const token = auth.slice(7);

  // 2. Verify admin identity (uses anon client — no service role needed)
  const identity = await verifyAdmin(token);
  if ("error" in identity) {
    return NextResponse.json({ error: identity.error }, { status: 403 });
  }

  // 3. Parse body
  let body: { email?: string; password?: string; name?: string; role?: string; department?: string; phone?: string; salary?: number; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const { email, password, name, role, department, phone, salary, status } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  // 4. Create auth user (requires service role key)
  let admin: ReturnType<typeof serviceClient>;
  try {
    admin = serviceClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" },
      { status: 500 }
    );
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? email },
  });

  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "هذا البريد الإلكتروني مسجل مسبقاً"
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // 5. Upsert profile
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id:         userId,
      email,
      name:       name ?? email.split("@")[0],
      role:       role ?? "employee",
      department: department ?? "",
      is_active:  true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    // Auth user was created — try to roll back
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `فشل إنشاء الملف الشخصي: ${profileError.message}` },
      { status: 500 }
    );
  }

  // 6. Insert employee record
  const { error: empError } = await admin.from("employees").insert([
    {
      id:              userId,
      name:            name ?? email.split("@")[0],
      email,
      phone:           phone ?? null,
      department:      department ?? "",
      role:            role ?? "employee",
      status:          status ?? "نشط",
      join_date:       new Date().toISOString().split("T")[0],
      performance:     3,
      tasks:           0,
      completed_tasks: 0,
      salary:          salary ?? null,
    },
  ]);

  if (empError) {
    // Auth user + profile created — try to clean up auth user
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: `فشل إنشاء سجل الموظف: ${empError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: userId, name: name ?? email.split("@")[0] });
}
