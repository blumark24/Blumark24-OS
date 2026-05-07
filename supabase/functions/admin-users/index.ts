// Supabase Edge Function: admin-users
// Handles create / update / delete auth users using the Service Role key.
// Replaces Vercel Next.js API routes which hit the 10s free-tier timeout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY غير مضبوط في بيئة Edge Function");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyAdmin(token: string): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const url     = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const caller  = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await caller.auth.getUser();
  if (error || !user) return { ok: false, error: "جلسة المستخدم غير صالحة أو انتهت" };
  const email = user.email ?? "";
  if (ADMIN_EMAILS.includes(email)) return { ok: true, userId: user.id };
  const { data: profile } = await caller.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "super_admin") return { ok: true, userId: user.id };
  return { ok: false, error: `غير مصرح — الدور (${profile?.role ?? "غير محدد"}) لا يملك هذه الصلاحية` };
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCreate(body: Record<string, unknown>): Promise<Response> {
  const email      = typeof body.email    === "string" ? body.email.trim().toLowerCase()  : "";
  const password   = typeof body.password === "string" ? body.password                    : "";
  const name       = typeof body.name     === "string" ? body.name.trim()                 : email.split("@")[0];
  const role       = typeof body.role     === "string" ? body.role                        : "employee";
  const department = typeof body.department === "string" ? body.department.slice(0, 100)  : "";
  const phone      = typeof body.phone    === "string" ? body.phone.slice(0, 20)          : null;
  const salary     = typeof body.salary   === "number" && body.salary >= 0 ? body.salary  : null;
  const status     = body.status === "غير_نشط" ? "غير_نشط" : "نشط";

  if (!email) return json({ error: "البريد الإلكتروني مطلوب" }, 400);
  if (!password || password.length < 6) return json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, 400);
  if (!name)  return json({ error: "الاسم مطلوب" }, 400);

  const admin = adminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authError) {
    const msg = authError.message.includes("already registered")
      ? "هذا البريد الإلكتروني مسجل مسبقاً"
      : authError.message;
    return json({ error: msg }, 400);
  }

  const userId = authData.user.id;

  // Upsert profile
  const { error: profileError } = await admin.from("profiles").upsert(
    { id: userId, email, name, role, department, is_active: true, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    return json({ error: `فشل إنشاء الملف الشخصي: ${profileError.message}` }, 500);
  }

  // Insert employee record
  const { error: empError } = await admin.from("employees").insert([{
    id: userId, name, email, phone, department, role, status,
    join_date: new Date().toISOString().split("T")[0],
    performance: 3, tasks: 0, completed_tasks: 0, salary,
  }]);
  if (empError) {
    await admin.auth.admin.deleteUser(userId);
    return json({ error: `فشل إنشاء سجل الموظف: ${empError.message}` }, 500);
  }

  return json({ id: userId, name });
}

async function handleUpdate(body: Record<string, unknown>): Promise<Response> {
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return json({ error: "userId مطلوب" }, 400);

  const cleanRole     = typeof body.role       === "string"  ? body.role.slice(0, 50)        : undefined;
  const cleanDept     = typeof body.department === "string"  ? body.department.slice(0, 100) : undefined;
  const cleanIsActive = typeof body.isActive   === "boolean" ? body.isActive                 : undefined;
  const cleanName     = typeof body.name       === "string"  ? body.name.trim().slice(0, 100): undefined;

  if (!cleanRole && !cleanDept && cleanIsActive === undefined && !cleanName) {
    return json({ error: "لا توجد حقول للتحديث" }, 400);
  }

  const admin = adminClient();
  const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (profileError) return json({ error: `فشل تحديث الملف الشخصي: ${profileError.message}` }, 400);

  if (cleanName !== undefined) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } });
  }

  return json({ ok: true });
}

async function handleDelete(body: Record<string, unknown>): Promise<Response> {
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!userId) return json({ error: "userId مطلوب" }, 400);

  const admin = adminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    const isNotFound = error.message.toLowerCase().includes("not found");
    if (!isNotFound) {
      return json({ error: error.message }, 400);
    }
    // User not in auth (legacy record) — treat as success
  }

  return json({ ok: true });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  // Verify Authorization header
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Authorization header مفقود" }, 401);
  }

  const identity = await verifyAdmin(authHeader.slice(7));
  if (!identity.ok) {
    return json({ error: identity.error }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "طلب غير صالح" }, 400);
  }

  const { action } = body;

  try {
    if (action === "create") return await handleCreate(body);
    if (action === "update") return await handleUpdate(body);
    if (action === "delete") return await handleDelete(body);
    return json({ error: `action غير معروف: ${action}` }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ داخلي في الخادم";
    return json({ error: msg }, 500);
  }
});
