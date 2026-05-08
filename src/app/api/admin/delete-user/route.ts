import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { validateUserId } from "@/lib/apiValidation";

const TAG          = "[delete-user]";
const ADMIN_EMAILS = ["blumark24@gmail.com", "blumark.sa@gmail.com"];

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}
function fail(status: number, error: string, debug: string) {
  console.error(`${TAG} HTTP ${status} | ${debug}`);
  return NextResponse.json({ success: false, error, debug }, { status });
}

export async function DELETE(req: NextRequest) {
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

  const idError = validateUserId(body.userId);
  if (idError) return fail(400, idError, `step=validate: userId=${JSON.stringify(body.userId)}`);

  const userId = body.userId as string;
  console.log(`${TAG} step=deleteUser | userId=${userId}`);

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    const msg = deleteError.message.toLowerCase().includes("not found")
      ? "المستخدم غير موجود في نظام المصادقة"
      : `فشل حذف المستخدم: ${deleteError.message}`;
    return fail(400, msg, `step=deleteUser: ${deleteError.message}`);
  }

  console.log(`${TAG} SUCCESS | userId=${userId}`);
  return ok({ success: true });
}
