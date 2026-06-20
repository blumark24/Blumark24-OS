/**
 * Protected API route for client-side error reporting.
 *
 * Security rules enforced:
 * - Requires authenticated Supabase session (Bearer token); anon blocked.
 * - Accepts only a strict whitelist of fields; ignores anything else.
 * - Stack traces from unauthenticated sources are NOT accepted.
 * - Metadata is size-limited and sanitized.
 * - Never exposes secrets or env vars.
 * - Writes to system_errors via service role (RLS bypassed server-side only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logSystemError, generateRequestId } from "@/lib/monitoring/server";
import { getClientIp, buildRateLimitKey, checkRateLimit } from "@/lib/security/rateLimit";
import { trackFeatureUsage } from "@/lib/analytics/featureUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES  = new Set(["owner_ui", "owner_security", "owner_billing"]);
const ALLOWED_SEVERITY = new Set(["low", "medium", "high", "critical"]);
const MAX_MESSAGE_LEN  = 500;
const MAX_META_KEYS    = 10;

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function POST(req: NextRequest) {
  // 1. Verify authenticated session
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return json({ success: false, error: "Server misconfigured" }, 500);

  const authClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
  if (authErr || !user) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  // 1b. Rate limit: 20 per user per 10 min + 60 per IP per hour
  const ip = getClientIp(req);
  const [rlUser, rlIp] = await Promise.all([
    checkRateLimit({
      scope:    "monitoring_error_user",
      key:      buildRateLimitKey({ scope: "monitoring_error_user", user_id: user.id, ip }),
      limit:    20,
      windowMs: 10 * 60 * 1000,
      user_id:  user.id,
      ip,
      route:    "/api/monitoring/error",
      metadata: {},
    }),
    checkRateLimit({
      scope:    "monitoring_error_ip",
      key:      buildRateLimitKey({ scope: "monitoring_error_ip", ip }),
      limit:    60,
      windowMs: 60 * 60 * 1000,
      ip,
      route:    "/api/monitoring/error",
      metadata: {},
    }),
  ]);
  if (!rlUser.allowed || !rlIp.allowed) {
    const rl = !rlUser.allowed ? rlUser : rlIp;
    return json({ success: false, error: "Too many requests", request_id: rl.requestId }, 429);
  }

  // 2. Parse and validate body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }

  const source   = typeof body["source"]   === "string" ? body["source"]   : "";
  const message  = typeof body["message"]  === "string" ? body["message"]  : "";
  const severity = typeof body["severity"] === "string" ? body["severity"] : "medium";
  const path     = typeof body["path"]     === "string" ? body["path"]     : null;
  const errorCode = typeof body["error_code"] === "string" ? body["error_code"] : null;

  if (!source || !ALLOWED_SOURCES.has(source)) {
    return json({ success: false, error: "Invalid source" }, 400);
  }
  if (!message.trim()) {
    return json({ success: false, error: "Message required" }, 400);
  }
  if (!ALLOWED_SEVERITY.has(severity)) {
    return json({ success: false, error: "Invalid severity" }, 400);
  }

  // Sanitize: truncate, no stack from client (never trust client stacks)
  const safeMessage = message.slice(0, MAX_MESSAGE_LEN);
  const safePath    = path ? path.slice(0, 300) : null;
  const safeCode    = errorCode ? errorCode.slice(0, 50) : null;

  // Sanitize metadata: only allow plain string/number values, up to MAX_META_KEYS
  const rawMeta = body["metadata"] !== null && typeof body["metadata"] === "object"
    ? body["metadata"] as Record<string, unknown>
    : {};
  const safeMeta: Record<string, unknown> = {};
  let metaCount = 0;
  for (const [k, v] of Object.entries(rawMeta)) {
    if (metaCount >= MAX_META_KEYS) break;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      safeMeta[k.slice(0, 50)] = typeof v === "string" ? v.slice(0, 200) : v;
      metaCount++;
    }
  }
  safeMeta["reported_by_user_id"] = user.id;

  const requestId = generateRequestId();

  trackFeatureUsage({
    feature_key: "monitoring_error_reported",
    event_type:  "completed",
    user_id:     user.id,
    path:        "/api/monitoring/error",
    metadata:    { source, severity },
  });

  await logSystemError({
    source:     source as "low" | "medium" | "high" | "critical",
    severity:   severity as "low" | "medium" | "high" | "critical",
    message:    safeMessage,
    stack:      null, // never accept stack from client
    error_code: safeCode,
    path:       safePath,
    request_id: requestId,
    user_id:    user.id,
    metadata:   safeMeta,
  });

  return json({ success: true, request_id: requestId });
}
