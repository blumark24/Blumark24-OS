import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Read-only: resolve organizations.name for display on user/employee cards */
export async function GET(req: NextRequest) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: "إعداد الخادم غير مكتمل" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    const raw = req.nextUrl.searchParams.get("ids") ?? "";
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter((id) => UUID_RE.test(id))
      .slice(0, 64);

    if (ids.length === 0) {
      return NextResponse.json({ names: {} });
    }

    const { data, error } = await admin
      .from("organizations")
      .select("id, name")
      .in("id", ids);

    if (error) {
      console.error("[organization-names]", error.message);
      return NextResponse.json({ error: "تعذر قراءة أسماء المنشآت" }, { status: 500 });
    }

    const names: Record<string, string> = {};
    for (const row of data ?? []) {
      const id = row.id as string;
      const name = String(row.name ?? "").trim();
      if (id && name) names[id] = name;
    }

    return NextResponse.json({ names });
  } catch (err) {
    console.error("[organization-names] unexpected:", err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
