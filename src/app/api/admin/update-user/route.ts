import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId, validateRole, validateName, firstError } from "@/lib/apiValidation";

const TAG          = "[update-user]";
const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function PATCH(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  console.log(`${TAG} start | URL=${!!SUPABASE_URL} SERVICE_KEY=${!!SERVICE_KEY} (len=${SERVICE_KEY.length})`);

  if (!SUPABASE_URL) {
    return fail(500, "NEXT_PUBLIC_SUPABASE_URL غير مضبوط", "step=env: NEXT_PUBLIC_SUPABASE_URL is empty");
  }
  if (!SERVICE_KEY) {
    return fail(500,
      "SUPABASE_SERVICE_ROLE_KEY غير مضبوط — أضفه في Vercel → Project Settings → Environment Variables → SUPABASE_SERVICE_ROLE_KEY",
      "step=env: SUPABASE_SERVICE_ROLE_KEY is empty or undefined",
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return fail(401, "Authorization header مفقود أو غير صالح", "step=auth: no Bearer prefix");
  }
  const token = authHeader.slice(7);

  const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token);
  if (callerErr || !caller) {
    return fail(403,
      "جلسة المستخدم غير صالحة أو انتهت — يرجى تسجيل الدخول مجدداً",
      `step=auth: ${callerErr?.message ?? "no user returned"}`,
    );
  }

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (e) {
    return fail(400, "طلب غير صالح — تعذر قراءة البيانات المرسلة", `step=parse: ${String(e)}`);
  }

  const validationError = firstError(
    validateUserId(body.userId),
    validateRole(body.role),
    validateName(body.name),
  );
  if (validationError) {
    return fail(400, validationError,
      `step=validate | userId=${JSON.stringify(body.userId)} role=${JSON.stringify(body.role)} name=${JSON.stringify(body.name)}`,
    );
  }

  const { userId, role, department, isActive, name } = body as {
    userId: string;
    role?: string;
    department?: string;
    isActive?: boolean;
    name?: string;
  };

  const cleanDept     = typeof department === "string" ? department.slice(0, 100) : undefined;
  const cleanIsActive = typeof isActive === "boolean" ? isActive : undefined;
  const cleanName     = typeof name === "string" ? name.trim().slice(0, 100) : undefined;
  const cleanRole     = typeof role === "string" ? role : undefined;

  if (!cleanRole && !cleanDept && cleanIsActive === undefined && !cleanName) {
    return fail(400, "لا توجد حقول للتحديث", "step=validate: no updatable fields");
  }

  // profiles table does not have updated_at — build update map without it
  const profileUpdate: Record<string, unknown> = {};
  if (cleanRole     !== undefined) profileUpdate.role       = cleanRole;
  if (cleanDept     !== undefined) profileUpdate.department = cleanDept;
  if (cleanIsActive !== undefined) profileUpdate.is_active  = cleanIsActive;
  if (cleanName     !== undefined) profileUpdate.name       = cleanName;

  console.log(`${TAG} step=updateProfile | userId=${userId} fields=${JSON.stringify(profileUpdate)}`);
  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("id", userId);
  if (profileError) {
    return fail(500,
      `فشل تحديث الملف الشخصي: ${profileError.message}`,
      `step=updateProfile: ${profileError.message}`,
    );
  }
  console.log(`${TAG} step=updateProfile ok`);

  if (cleanName !== undefined) {
    console.log(`${TAG} step=updateAuthMeta | userId=${userId} name=${cleanName}`);
    await admin.auth.admin.updateUserById(userId, { user_metadata: { name: cleanName } });
  }

  console.log(`${TAG} SUCCESS | userId=${userId}`);
  return ok({ success: true });
}
