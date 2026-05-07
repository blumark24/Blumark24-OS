// Supabase Edge Function: admin-users
// Handles create / update / delete Supabase Auth users.
// Service Role key never leaves this server-side Deno runtime.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function makeAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("إعدادات Supabase غير مكتملة — SUPABASE_SERVICE_ROLE_KEY غير مضبوط في Edge Function");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Verify the caller is an admin using the SERVICE ROLE key to validate JWT
// (avoids a second round-trip to get an anon-key session)
async function verifyAdmin(
  token: string
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  let admin;
  try {
    admin = makeAdminClient();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" };
  }

  // Validate the JWT via the admin API — no extra round-trip needed
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    console.error("[admin-users] getUser error:", error?.message);
    return { ok: false, error: "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً" };
  }

  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) return { ok: true, userId: user.id };

  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[admin-users] profile lookup error:", profileErr.message);
    return { ok: false, error: "تعذر التحقق من صلاحيات المستخدم" };
  }

  if (profile?.role === "super_admin") return { ok: true, userId: user.id };
  return {
    ok: false,
    error: `غير مصرح — الدور (${profile?.role ?? "غير محدد"}) لا يملك هذه الصلاحية`,
  };
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handleCreate(body: Record<string, unknown>): Promise<Response> {
  const email      = typeof body.email      === "string" ? body.email.trim().toLowerCase()    : "";
  const password   = typeof body.password   === "string" ? body.password                      : "";
  const name       = typeof body.name       === "string" ? body.name.trim()                   : email.split("@")[0];
  const role       = typeof body.role       === "string" ? body.role                          : "employee";
  const department = typeof body.department === "string" ? body.department.slice(0, 100)      : "";
  const phone      = typeof body.phone      === "string" ? body.phone.slice(0, 20)            : null;
  const salary     = typeof body.salary     === "number" && body.salary >= 0 ? body.salary    : null;
  const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

  if (!email)                            return jsonResp({ error: "البريد الإلكتروني مطلوب" }, 400);
  if (!password || password.length < 6) return jsonResp({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, 400);
  if (!name)                             return jsonResp({ error: "الاسم مطلوب" }, 400);

  let admin;
  try { admin = makeAdminClient(); }
  catch (err) { return jsonResp({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, 500); }

  console.log("[admin-users] create:", email, role, department);

  // Step 1: Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError) {
    console.error("[admin-users] createUser error:", authError.message);
    const msg = authError.message.includes("already registered")
      ? "البريد الإلكتروني مستخدم مسبقاً"
      : authError.message;
    return jsonResp({ error: msg }, 400);
  }

  const userId = authData.user.id;
  console.log("[admin-users] auth user created:", userId);

  // Step 2: Upsert profile
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId, email, name, role, department,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error("[admin-users] profile upsert error:", profileError.message);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return jsonResp({ error: `فشل إنشاء الملف الشخصي: ${profileError.message}` }, 500);
  }

  // Step 3: Insert employee record
  const { error: empError } = await admin.from("employees").insert([{
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
  }]);
  if (empError) {
    console.error("[admin-users] employees insert error:", empError.message);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return jsonResp({ error: `فشل إنشاء سجل الموظف: ${empError.message}` }, 500);
  }

  console.log("[admin-users] employee created successfully:", userId);
  return jsonResp({ id: userId, name });
}

async function handleUpdate(body: Record<string, unknown>): Promise<Response> {
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return jsonResp({ error: "userId مطلوب" }, 400);

  const cleanRole     = typeof body.role       === "string"  ? body.role.slice(0, 50)         : undefined;
  const cleanDept     = typeof body.department === "string"  ? body.department.slice(0, 100)  : undefined;
  const cleanIsActive = typeof body.isActive   === "boolean" ? body.isActive                  : undefined;
  const cleanName     = typeof body.name       === "string"  ? body.name.trim().slice(0, 100) : undefined;

  if (!cleanRole && !cleanDept && cleanIsActive === undefined && !cleanName) {
    return jsonResp({ error: "لا توجد حقول للتحديث" }, 400);
  }

  let admin;
  try { admin = makeAdminClient(); }
  catch (err) { return jsonResp({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, 500); }

  const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (profileError) {
    return jsonResp({ error: `فشل تحديث الملف الشخصي: ${profileError.message}` }, 400);
  }

  if (cleanName !== undefined) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } }).catch(() => {});
  }

  return jsonResp({ ok: true });
}

async function handleDelete(body: Record<string, unknown>): Promise<Response> {
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return jsonResp({ error: "userId مطلوب" }, 400);

  let admin;
  try { admin = makeAdminClient(); }
  catch (err) { return jsonResp({ error: err instanceof Error ? err.message : "خطأ في إعداد الخادم" }, 500); }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    const isNotFound = error.message.toLowerCase().includes("not found")
                    || error.message.toLowerCase().includes("user not found");
    if (!isNotFound) {
      console.error("[admin-users] deleteUser error:", error.message);
      return jsonResp({ error: error.message }, 400);
    }
    // User not in auth (legacy record without auth account) — treat as success
    console.log("[admin-users] auth user not found (legacy), skipping auth delete:", userId);
  }

  return jsonResp({ ok: true });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResp({ error: "Method Not Allowed" }, 405);
  }

  // Authenticate caller
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResp({ error: "Authorization header مفقود" }, 401);
  }

  const identity = await verifyAdmin(authHeader.slice(7));
  if (!identity.ok) {
    console.warn("[admin-users] auth failed:", identity.error);
    return jsonResp({ error: identity.error }, 403);
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResp({ error: "طلب غير صالح — تعذر قراءة JSON" }, 400);
  }

  const { action } = body;
  console.log("[admin-users] action:", action, "caller:", identity.userId);

  try {
    if (action === "create") return await handleCreate(body);
    if (action === "update") return await handleUpdate(body);
    if (action === "delete") return await handleDelete(body);
    return jsonResp({ error: `action غير معروف: ${action}` }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ داخلي في الخادم";
    console.error("[admin-users] unhandled error:", msg);
    return jsonResp({ error: msg }, 500);
  }
});
