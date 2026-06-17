import { NextRequest, NextResponse } from "next/server";
import { validatePasswordForAuth } from "@/lib/security/passwordGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-cache" };

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const password = typeof body.password === "string" ? body.password : "";

  const result = await validatePasswordForAuth(password);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400, headers: NO_STORE });
  }

  return NextResponse.json(
    { ok: true, ...(result.warning ? { warning: result.warning } : {}) },
    { status: 200, headers: NO_STORE },
  );
}
