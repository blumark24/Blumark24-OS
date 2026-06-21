/**
 * Server-side monitoring utility — C4 Error Tracking & Alert Engine.
 *
 * Rules:
 * - Server-side ONLY. Never import in client components.
 * - Uses service role client (bypasses RLS) so it can write even when the
 *   calling request has no authenticated session, e.g. uncaught API errors.
 * - All public functions are non-blocking and swallow failures with console.warn.
 * - No secrets, tokens, or private credentials are stored in metadata.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Admin client (server-only) ────────────────────────────────────────────────

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── generateRequestId ─────────────────────────────────────────────────────────

export function generateRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const ts   = Date.now().toString(36);
  return `req_${rand}_${ts}`;
}

// ── normalizeError ────────────────────────────────────────────────────────────

export interface NormalizedError {
  message:    string;
  stack:      string | null;
  error_code: string | null;
  metadata:   Record<string, unknown>;
}

export function normalizeError(err: unknown): NormalizedError {
  try {
    if (err instanceof Error) {
      const ext = err as Error & { code?: unknown; statusCode?: unknown; status?: unknown };
      const code =
        typeof ext.code       === "string" ? ext.code :
        typeof ext.statusCode === "string" ? ext.statusCode :
        typeof ext.status     === "number" ? String(ext.status) :
        null;
      return {
        message:    err.message || "Unknown error",
        stack:      err.stack   ?? null,
        error_code: code,
        metadata:   {},
      };
    }
    if (typeof err === "string") {
      return { message: err || "Unknown error", stack: null, error_code: null, metadata: {} };
    }
    if (err !== null && typeof err === "object") {
      const o = err as Record<string, unknown>;
      return {
        message:    typeof o["message"] === "string" ? o["message"] : JSON.stringify(err),
        stack:      typeof o["stack"]   === "string" ? o["stack"]   : null,
        error_code: typeof o["code"]    === "string" ? o["code"]    : null,
        metadata:   {},
      };
    }
    return { message: String(err), stack: null, error_code: null, metadata: {} };
  } catch {
    return { message: "Error normalization failed", stack: null, error_code: null, metadata: {} };
  }
}

// ── logSystemError ────────────────────────────────────────────────────────────

export interface LogSystemErrorInput {
  source:          string;
  severity?:       "low" | "medium" | "high" | "critical";
  message:         string;
  stack?:          string | null;
  error_code?:     string | null;
  path?:           string | null;
  request_id?:     string | null;
  organization_id?: string | null;
  user_id?:        string | null;
  metadata?:       Record<string, unknown>;
}

export async function logSystemError(input: LogSystemErrorInput): Promise<void> {
  try {
    const admin = getAdminClient();
    if (!admin) {
      console.warn("[monitoring] logSystemError: no admin client — check env vars");
      return;
    }
    const { error } = await admin.from("system_errors").insert({
      source:          input.source,
      severity:        input.severity        ?? "medium",
      message:         input.message,
      stack:           input.stack           ?? null,
      error_code:      input.error_code      ?? null,
      path:            input.path            ?? null,
      request_id:      input.request_id      ?? null,
      organization_id: input.organization_id ?? null,
      user_id:         input.user_id         ?? null,
      metadata:        input.metadata        ?? {},
    });
    if (error) {
      console.warn("[monitoring] logSystemError insert failed:", error.message);
    }
  } catch (err) {
    console.warn("[monitoring] logSystemError threw:", err);
  }
}

// ── createSystemAlert ─────────────────────────────────────────────────────────

export interface CreateSystemAlertInput {
  alert_type:   string;
  severity?:    "low" | "medium" | "high" | "critical";
  title:        string;
  description?: string | null;
  target_type?: string | null;
  target_id?:   string | null;
  metadata?:    Record<string, unknown>;
}

/**
 * Creates a system alert.
 *
 * Dedup: checks for an existing open alert with the same alert_type + title
 * created within the last 30 minutes. If one exists, skips insertion.
 * Full dedup by error_code/metadata is a future improvement.
 */
export async function createSystemAlert(input: CreateSystemAlertInput): Promise<void> {
  try {
    const admin = getAdminClient();
    if (!admin) {
      console.warn("[monitoring] createSystemAlert: no admin client — check env vars");
      return;
    }

    // Simple dedup: skip if same alert_type + title exists as open within 30 min
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("system_alerts")
      .select("*", { count: "exact", head: true })
      .eq("alert_type", input.alert_type)
      .eq("title",      input.title)
      .eq("status",     "open")
      .gte("created_at", since);

    if ((count ?? 0) > 0) return; // duplicate suppressed

    const { error } = await admin.from("system_alerts").insert({
      alert_type:  input.alert_type,
      severity:    input.severity    ?? "medium",
      title:       input.title,
      description: input.description ?? null,
      target_type: input.target_type ?? null,
      target_id:   input.target_id   ?? null,
      status:      "open",
      metadata:    input.metadata    ?? {},
    });
    if (error) {
      console.warn("[monitoring] createSystemAlert insert failed:", error.message);
    }
  } catch (err) {
    console.warn("[monitoring] createSystemAlert threw:", err);
  }
}

// ── logAndAlert ───────────────────────────────────────────────────────────────
//
// Convenience: log an error AND create an alert when severity warrants it.
// Alert is created when severity = critical or high AND source signals a
// sensitive owner operation or auth event.

const ALERT_SOURCES = new Set([
  "auth",
  "owner_sensitive_action",
  "owner_change_plan",
  "owner_provision_tenant",
  "owner_reset_password",
]);

export async function logAndAlert(
  input: LogSystemErrorInput,
  alertTitle?: string,
): Promise<string> {
  const requestId = input.request_id ?? generateRequestId();

  // Always log error
  void logSystemError({ ...input, request_id: requestId });

  // Alert only on critical/high or sensitive sources
  const severity = input.severity ?? "medium";
  const shouldAlert =
    severity === "critical" ||
    (severity === "high" && ALERT_SOURCES.has(input.source));

  if (shouldAlert) {
    const title =
      alertTitle ??
      (severity === "critical"
        ? "خطأ حرج في النظام"
        : "فشل عملية حساسة");

    void createSystemAlert({
      alert_type:  input.source,
      severity,
      title,
      description: input.message,
      target_type: input.metadata?.["target_type"] as string | undefined ?? null,
      target_id:   input.metadata?.["target_id"]   as string | undefined ?? null,
      metadata:    { request_id: requestId, ...input.metadata },
    });
  }

  return requestId;
}

type ServerLogLevel = "info" | "warn" | "error";

type SafeMetadataValue = string | number | boolean | null;

export interface ServerLogInput {
  event: string;
  route?: string | null;
  requestId?: string | null;
  durationMs?: number | null;
  status?: string | null;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_LOG_KEY = /(authorization|bearer|token|secret|password|apikey|api_key|service_role|cookie|email|phone)/i;

function toSafeMetadataValue(key: string, value: unknown): SafeMetadataValue {
  if (SENSITIVE_LOG_KEY.test(key)) return "[redacted]";
  if (value === null) return null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.length > 160) return `${value.slice(0, 157)}...`;
    return value;
  }
  return "[omitted]";
}

function sanitizeLogMetadata(metadata?: Record<string, unknown>): Record<string, SafeMetadataValue> | undefined {
  if (!metadata) return undefined;
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, toSafeMetadataValue(key, value)]),
  );
}

export function logServerEvent(level: ServerLogLevel, input: ServerLogInput): void {
  const payload = {
    level,
    event: input.event,
    route: input.route ?? null,
    request_id: input.requestId ?? null,
    duration_ms: input.durationMs ?? null,
    status: input.status ?? null,
    metadata: sanitizeLogMetadata(input.metadata) ?? {},
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}
