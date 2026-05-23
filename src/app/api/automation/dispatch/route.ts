import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { dispatchEventForOrg } from "@/lib/automation/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[automation/dispatch]";

export async function POST(req: NextRequest) {
  let body: { event?: string; payload?: Record<string, unknown>; organization_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = body.event?.trim();
  if (!event) {
    return NextResponse.json({ error: "event required" }, { status: 400 });
  }

  const payload = body.payload ?? {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  let organizationId = body.organization_id ?? "";

  const authHeader = req.headers.get("authorization") ?? "";
  if (!organizationId && authHeader.startsWith("Bearer ") && url && anon) {
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const uid = userData.user?.id;
    if (uid) {
      const { data: profile } = await userClient
        .from("profiles")
        .select("organization_id")
        .eq("id", uid)
        .maybeSingle();
      organizationId = (profile?.organization_id as string) ?? "";
    }
  }

  if (!organizationId && service && url) {
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: orgId, error } = await admin.rpc("current_org_id");
    if (!error && orgId) organizationId = orgId as string;
  }

  if (!organizationId) {
    return NextResponse.json({ error: "organization_id not resolved" }, { status: 400 });
  }

  const authorName =
    (payload.author_name as string) ??
    (payload.authorName as string) ??
    "الأتمتة";

  try {
    const { runs, errors } = await dispatchEventForOrg(
      organizationId,
      event,
      payload,
      authorName,
    );
    if (errors.length) {
      console.warn(`${TAG} partial errors`, errors);
    }
    return NextResponse.json({ ok: true, runs, errors });
  } catch (e) {
    console.error(`${TAG}`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "dispatch failed" },
      { status: 500 },
    );
  }
}
