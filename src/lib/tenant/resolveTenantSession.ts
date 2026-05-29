import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTenantApiAccessToken } from "@/lib/api/tenantApiAuth";
import { createUserSupabaseClient } from "@/lib/supabase/userClient";
import {
  buildTenantAiContext,
  tenantAiAccessErrorMessage,
  validateTenantAiAccess,
  type TenantAiContextPayload,
} from "@/lib/tenant/aiContext";

export type ResolvedTenantSession =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      client: SupabaseClient;
      token: string;
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    };

export async function resolveTenantSession(
  req: NextRequest,
): Promise<ResolvedTenantSession> {
  const token = getTenantApiAccessToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: tenantAiAccessErrorMessage("no_session"),
    };
  }

  const client = createUserSupabaseClient(token);

  const { data: authData, error: authErr } = await client.auth.getUser(token);
  if (authErr || !authData?.user) {
    return {
      ok: false,
      status: 401,
      error: tenantAiAccessErrorMessage("no_session"),
    };
  }

  const userId = authData.user.id;
  const email = authData.user.email ?? "";

  const { data: profile, error: profErr } = await client
    .from("profiles")
    .select("role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    return { ok: false, status: 500, error: "تعذر قراءة الملف الشخصي" };
  }

  const role = String(profile?.role ?? "");
  const organizationId = (profile?.organization_id as string | null) ?? null;

  const access = validateTenantAiAccess({ email, role, organizationId });
  if (!access.ok) {
    return {
      ok: false,
      status: access.reason === "no_session" ? 401 : 403,
      error: tenantAiAccessErrorMessage(access.reason),
    };
  }

  const orgId = organizationId as string;

  const { data: org, error: orgErr } = await client
    .from("organizations")
    .select("id, deleted_at")
    .eq("id", orgId)
    .maybeSingle();

  if (orgErr) {
    return { ok: false, status: 500, error: "تعذر قراءة بيانات المنشأة" };
  }

  if (!org || org.deleted_at) {
    return {
      ok: false,
      status: 403,
      error: tenantAiAccessErrorMessage("org_missing"),
    };
  }

  return {
    ok: true,
    client,
    token,
    userId,
    email,
    role,
    organizationId: orgId,
  };
}

export async function loadTenantAiContextForSession(
  session: Extract<ResolvedTenantSession, { ok: true }>,
): Promise<TenantAiContextPayload> {
  return buildTenantAiContext(session.client, {
    userId: session.userId,
    email: session.email,
    role: session.role,
    organizationId: session.organizationId,
  });
}
