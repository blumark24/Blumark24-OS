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
import {
  classifyContextLoadError,
  type AssistantDiagnosticCode,
  type AssistantDiagnosticDetail,
} from "@/lib/tenant/aiAssistantDiagnostics";

export type ResolvedTenantSession =
  | {
      ok: false;
      status: number;
      error: string;
      code: AssistantDiagnosticCode;
      detail: AssistantDiagnosticDetail;
    }
  | {
      ok: true;
      client: SupabaseClient;
      token: string;
      userId: string;
      email: string;
      role: string;
      organizationId: string;
    };

export type TenantContextLoadResult =
  | { ok: true; context: TenantAiContextPayload }
  | {
      ok: false;
      code: "RLS_ERROR" | "AI_CONTEXT_ERROR";
      detail: AssistantDiagnosticDetail;
      error: string;
    };

function mapAccessReasonToDetail(
  reason: string,
): AssistantDiagnosticDetail {
  switch (reason) {
    case "no_organization":
      return "TENANT_NO_ORGANIZATION";
    case "platform_role":
      return "TENANT_PLATFORM_ROLE";
    case "org_missing":
      return "TENANT_ORG_UNAVAILABLE";
    default:
      return "TENANT_NO_ORGANIZATION";
  }
}

export async function resolveTenantSession(
  req: NextRequest,
): Promise<ResolvedTenantSession> {
  const token = getTenantApiAccessToken(req);
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: tenantAiAccessErrorMessage("no_session"),
      code: "AUTH_ERROR",
      detail: "AUTH_MISSING_TOKEN",
    };
  }

  const client = createUserSupabaseClient(token);

  const { data: authData, error: authErr } = await client.auth.getUser(token);
  if (authErr || !authData?.user) {
    return {
      ok: false,
      status: 401,
      error: tenantAiAccessErrorMessage("no_session"),
      code: "AUTH_ERROR",
      detail: "AUTH_INVALID_SESSION",
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
    const rls = classifyContextLoadError(profErr);
    return {
      ok: false,
      status: rls.code === "RLS_ERROR" ? 403 : 503,
      error: "تعذر قراءة الملف الشخصي",
      code: rls.code === "RLS_ERROR" ? "RLS_ERROR" : "AI_CONTEXT_ERROR",
      detail: rls.code === "RLS_ERROR" ? "RLS_PROFILE_DENIED" : "AI_CONTEXT_BUILD_FAILED",
    };
  }

  const role = String(profile?.role ?? "");
  const organizationId = (profile?.organization_id as string | null) ?? null;

  const access = validateTenantAiAccess({ email, role, organizationId });
  if (!access.ok) {
    const detail = mapAccessReasonToDetail(access.reason);
    return {
      ok: false,
      status: access.reason === "no_session" ? 401 : 403,
      error: tenantAiAccessErrorMessage(access.reason),
      code: "TENANT_ERROR",
      detail,
    };
  }

  const orgId = organizationId as string;

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

export async function loadTenantAiContextSafe(
  session: Extract<ResolvedTenantSession, { ok: true }>,
): Promise<TenantContextLoadResult> {
  try {
    const context = await loadTenantAiContextForSession(session);
    return { ok: true, context };
  } catch (err) {
    const classified = classifyContextLoadError(err);
    return {
      ok: false,
      code: classified.code,
      detail: classified.detail,
      error:
        classified.code === "RLS_ERROR"
          ? "صلاحيات القراءة تمنع تحميل ملخص المنشأة"
          : "تعذر تجميع ملخص المنشأة الآمن",
    };
  }
}
