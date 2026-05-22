import type { NextRequest } from "next/server";

export type OrganizationStatus = "active" | "suspended" | "trial" | "cancelled";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "suspended";

export type TenantAccessCode =
  | "ALLOWED"
  | "NO_ORG"
  | "INTERNAL"
  | "ORG_DELETED"
  | "ORG_SUSPENDED"
  | "ORG_CANCELLED"
  | "SUB_SUSPENDED"
  | "SUB_CANCELLED"
  | "ORG_NOT_FOUND"
  | "LOOKUP_ERROR";

/** PostgREST / Postgres error shape from supabase-js */
export type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export interface TenantOrganizationSnapshot {
  status: OrganizationStatus;
  is_internal: boolean;
  deleted_at: string | null;
}

export interface TenantSubscriptionSnapshot {
  status: SubscriptionStatus;
}

export interface TenantAccessInput {
  organizationId: string | null;
  organization: TenantOrganizationSnapshot | null;
  subscription: TenantSubscriptionSnapshot | null;
}

export interface TenantAccessResult {
  allowed: boolean;
  code: TenantAccessCode;
  /** User-facing Arabic message when blocked or lookup failed */
  message: string | null;
}

export const TENANT_BLOCKED_TITLE = "تم تعليق وصول هذه المنشأة مؤقتًا";
export const TENANT_BLOCKED_BODY =
  "يرجى التواصل مع إدارة Blumark24 لإعادة التفعيل.";

const BLOCKED_BY_CODE: Partial<Record<TenantAccessCode, string>> = {
  ORG_DELETED: TENANT_BLOCKED_TITLE,
  ORG_SUSPENDED: TENANT_BLOCKED_TITLE,
  ORG_CANCELLED: TENANT_BLOCKED_TITLE,
  SUB_SUSPENDED: TENANT_BLOCKED_TITLE,
  SUB_CANCELLED: TENANT_BLOCKED_TITLE,
  ORG_NOT_FOUND:
    "تعذّر التحقق من حالة المنشأة — يرجى المحاولة لاحقاً أو التواصل مع الدعم.",
  LOOKUP_ERROR:
    "تعذّر التحقق من حالة المنشأة — يرجى المحاولة لاحقاً أو التواصل مع الدعم.",
};

const LOOKUP_ERROR_MSG =
  "تعذّر التحقق من حالة المنشأة — يرجى المحاولة لاحقاً أو التواصل مع الدعم.";

/** Fail-closed result when subscription/org lookup fails (non-missing-schema). */
export function tenantAccessLookupError(): TenantAccessResult {
  return {
    allowed: false,
    code: "LOOKUP_ERROR",
    message: LOOKUP_ERROR_MSG,
  };
}

/**
 * True only when the subscriptions relation is absent (minimal schema).
 * Any other error must fail closed in tenant-access.
 */
export function isSubscriptionsSchemaMissingError(
  error: SupabaseErrorLike | null | undefined,
): boolean {
  if (!error) return false;

  const code = String(error.code ?? "");
  if (code === "42P01" || code === "PGRST205") return true;

  const combined = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  if (!combined.includes("subscription")) return false;

  return (
    combined.includes("does not exist") ||
    combined.includes("could not find") ||
    combined.includes("not found") ||
    combined.includes("schema cache")
  );
}

/**
 * Pure tenant access rules for the client workspace.
 * Service-role lookups happen in /api/auth/tenant-access before calling this.
 */
export function evaluateTenantAccess(input: TenantAccessInput): TenantAccessResult {
  if (!input.organizationId) {
    return { allowed: true, code: "NO_ORG", message: null };
  }

  if (!input.organization) {
    return {
      allowed: false,
      code: "ORG_NOT_FOUND",
      message: BLOCKED_BY_CODE.ORG_NOT_FOUND ?? TENANT_BLOCKED_TITLE,
    };
  }

  if (input.organization.is_internal) {
    return { allowed: true, code: "INTERNAL", message: null };
  }

  if (input.organization.deleted_at) {
    return {
      allowed: false,
      code: "ORG_DELETED",
      message: BLOCKED_BY_CODE.ORG_DELETED ?? TENANT_BLOCKED_TITLE,
    };
  }

  if (input.organization.status === "suspended") {
    return {
      allowed: false,
      code: "ORG_SUSPENDED",
      message: BLOCKED_BY_CODE.ORG_SUSPENDED ?? TENANT_BLOCKED_TITLE,
    };
  }

  if (input.organization.status === "cancelled") {
    return {
      allowed: false,
      code: "ORG_CANCELLED",
      message: BLOCKED_BY_CODE.ORG_CANCELLED ?? TENANT_BLOCKED_TITLE,
    };
  }

  if (input.subscription?.status === "suspended") {
    return {
      allowed: false,
      code: "SUB_SUSPENDED",
      message: BLOCKED_BY_CODE.SUB_SUSPENDED ?? TENANT_BLOCKED_TITLE,
    };
  }

  if (input.subscription?.status === "cancelled") {
    return {
      allowed: false,
      code: "SUB_CANCELLED",
      message: BLOCKED_BY_CODE.SUB_CANCELLED ?? TENANT_BLOCKED_TITLE,
    };
  }

  return { allowed: true, code: "ALLOWED", message: null };
}

/** Bearer header or Supabase session cookies (same-origin fetch from the app). */
export function getAccessTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  return getAccessTokenFromSupabaseCookies(req);
}

function getAccessTokenFromSupabaseCookies(req: NextRequest): string | null {
  const authCookies = req.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (authCookies.length === 0) return null;

  const rawCookieValue = authCookies.map((cookie) => cookie.value).join("");
  if (!rawCookieValue) return null;

  const parseSession = (value: string): string | null => {
    try {
      const parsed: unknown = JSON.parse(value);
      const session = Array.isArray(parsed) ? parsed[0] : parsed;
      if (
        session &&
        typeof session === "object" &&
        "access_token" in session &&
        typeof (session as { access_token: unknown }).access_token === "string"
      ) {
        return (session as { access_token: string }).access_token;
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  return parseSession(decodeURIComponent(rawCookieValue)) ?? parseSession(rawCookieValue);
}
