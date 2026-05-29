import { NextRequest, NextResponse } from "next/server";
import { getTenantApiAccessToken } from "@/lib/api/tenantApiAuth";
import { createUserSupabaseClient } from "@/lib/supabase/userClient";
import {
  buildTenantAiContext,
  tenantAiAccessErrorMessage,
  validateTenantAiAccess,
} from "@/lib/tenant/aiContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/ai-context]";

/** Read-only tenant summaries for future AI assistant — no LLM calls, no writes. */
export async function GET(req: NextRequest) {
  try {
    const token = getTenantApiAccessToken(req);
    if (!token) {
      return NextResponse.json(
        { error: tenantAiAccessErrorMessage("no_session") },
        { status: 401 },
      );
    }

    const client = createUserSupabaseClient(token);

    const { data: authData, error: authErr } = await client.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { error: tenantAiAccessErrorMessage("no_session") },
        { status: 401 },
      );
    }

    const userId = authData.user.id;
    const email = authData.user.email ?? "";

    const { data: profile, error: profErr } = await client
      .from("profiles")
      .select("role, organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error(`${TAG} profile error:`, profErr.message);
      return NextResponse.json({ error: "تعذر قراءة الملف الشخصي" }, { status: 500 });
    }

    const role = String(profile?.role ?? "");
    const organizationId = (profile?.organization_id as string | null) ?? null;

    const access = validateTenantAiAccess({
      email,
      role,
      organizationId,
    });

    if (!access.ok) {
      return NextResponse.json(
        { error: tenantAiAccessErrorMessage(access.reason) },
        { status: access.reason === "no_session" ? 401 : 403 },
      );
    }

    const orgId = organizationId as string;

    const { data: org, error: orgErr } = await client
      .from("organizations")
      .select("id, deleted_at")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr) {
      console.error(`${TAG} org error:`, orgErr.message);
      return NextResponse.json({ error: "تعذر قراءة بيانات المنشأة" }, { status: 500 });
    }

    if (!org || org.deleted_at) {
      return NextResponse.json(
        { error: tenantAiAccessErrorMessage("org_missing") },
        { status: 403 },
      );
    }

    const context = await buildTenantAiContext(client, {
      userId,
      email,
      role,
      organizationId: orgId,
    });

    return NextResponse.json(context);
  } catch (err) {
    console.error(`${TAG} unexpected:`, err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
