/**
 * C6 — Protected client-side feature usage reporting endpoint.
 *
 * Security:
 * - Requires authenticated Bearer token; anon blocked (401).
 * - Rate limited via C5 utility (20/user/10min + 60/IP/hr).
 * - Strict field whitelist; ignores all other fields.
 * - Metadata sanitized via C6 utility.
 * - Never stores secrets, tokens, or auth data.
 * - Writes via service role (server-side only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { trackFeatureUsage, normalizeFeatureKey, sanitizeUsageMetadata } from "@/lib/analytics/featureUsage";
import { getClientIp, buildRateLimitKey, checkRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENT_TYPES = new Set([
  "viewed", "started", "completed", "failed", "clicked",
  "exported", "searched", "filtered", "toggled", "submitted",
]);

function json(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function POST(req: NextRequest) {
  // 1. Require authenticated session
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
  if (authErr || !user) return json({ success: false, error: "Unauthorized" }, 401);

  // 2. Rate limit: 20/user/10min + 60/IP/hr
  const ip = getClientIp(req);
  const [rlUser, rlIp] = await Promise.all([
    checkRateLimit({
      scope: "analytics_usage_user",
      key:   buildRateLimitKey({ scope: "analytics_usage_user", user_id: user.id, ip }),
      limit: 20, windowMs: 10 * 60 * 1000,
      user_id: user.id, ip, route: "/api/analytics/feature-usage", metadata: {},
    }),
    checkRateLimit({
      scope: "analytics_usage_ip",
      key:   buildRateLimitKey({ scope: "analytics_usage_ip", ip }),
      limit: 60, windowMs: 60 * 60 * 1000,
      ip, route: "/api/analytics/feature-usage", metadata: {},
    }),
  ]);
  if (!rlUser.allowed || !rlIp.allowed) {
    const rl = !rlUser.allowed ? rlUser : rlIp;
    return json({ success: false, error: "Too many requests", request_id: rl.requestId }, 429);
  }

  // 3. Parse and validate body
  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; }
  catch { return json({ success: false, error: "Invalid JSON" }, 400); }

  const featureKey = typeof body["feature_key"] === "string" ? body["feature_key"].trim() : "";
  const eventType  = typeof body["event_type"]  === "string" ? body["event_type"].trim()  : "";
  const path       = typeof body["path"]         === "string" ? body["path"].slice(0, 300)  : null;
  const rawMeta    = body["metadata"] !== null && typeof body["metadata"] === "object"
    ? body["metadata"] as Record<string, unknown> : {};

  if (!featureKey) return json({ success: false, error: "feature_key required" }, 400);
  if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
    return json({ success: false, error: "Invalid event_type" }, 400);
  }

  const normalizedKey = normalizeFeatureKey(featureKey);
  const meta = sanitizeUsageMetadata({ ...rawMeta, reported_by_user_id: user.id });

  // 4. Track (non-blocking — but we await here to confirm receipt)
  trackFeatureUsage({
    feature_key: normalizedKey,
    event_type:  eventType,
    user_id:     user.id,
    path,
    metadata:    meta,
  });

  return json({ success: true });
}
