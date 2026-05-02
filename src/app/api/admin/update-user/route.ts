import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const admin = adminClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return false;
  const { data: profile } = await admin
    .from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "super_admin";
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, department, isActive, name } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = adminClient();

    const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role       !== undefined) profileUpdate.role       = role;
    if (department !== undefined) profileUpdate.department = department;
    if (isActive   !== undefined) profileUpdate.is_active  = isActive;
    if (name       !== undefined) profileUpdate.name       = name;

    const { error } = await admin
      .from("profiles").update(profileUpdate).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (name !== undefined) {
      await admin.auth.admin.updateUserById(userId, { user_metadata: { name } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
