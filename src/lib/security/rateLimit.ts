/**
 * C5 — Persistent rate limit utility (server-side only).
 *
 * Uses the `rate_limits` table via service role for durability across
 * serverless function restarts. Falls back gracefully if the table is
 * missing (e.g. migration not yet applied) — in that case it allows the
 * request and logs a warning.
 *
 * All functions are non-blocking where safe. Failures are swallowed with
 * console.warn and never crash the caller.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateRequestId, logSystemError, createSystemAlert } from "@/lib/monitoring/server";

// ── Admin client ──────────────────────────────────────────────────────────────

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── getClientIp ───────────────────────────────────────────────────────────────

/** Safely extract a normalized client IP from request headers. */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim() ?? "";
    if (first && /^[\d.:a-fA-F]+$/.test(first)) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim() ?? "";
  if (real && /^[\d.:a-fA-F]+$/.test(real)) return real;
  return "unknown";
}

// ── buildRateLimitKey ─────────────────────────────────────────────────────────

export interface RateLimitKeyInput {
  scope:      string;
  user_id?:   string | null;
  ip?:        string | null;
  route?:     string | null;
  target?:    string | null;
}

/** Build a stable, safe string key for a rate limit bucket. */
export function buildRateLimitKey(input: RateLimitKeyInput): string {
  const parts = [
    input.scope,
    input.user_id  ? `u:${input.user_id}`  : null,
    input.ip       ? `ip:${input.ip}`       : null,
    input.route    ? `r:${input.route}`     : null,
    input.target   ? `t:${input.target}`    : null,
  ].filter(Boolean);
  return parts.join("|");
}

// ── checkRateLimit ────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  scope:       string;
  key:         string;
  limit:       number;
  windowMs:    number;
  user_id?:    string | null;
  ip?:         string | null;
  route?:      string | null;
  target_type?: string | null;
  target_id?:  string | null;
  metadata?:   Record<string, unknown>;
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   string;
  reason?:   string;
  requestId: string;
}

/**
 * Check and record a rate limit hit atomically.
 * Returns allowed=true (permissive) on any DB/infra failure.
 */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const requestId = generateRequestId();
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / config.windowMs) * config.windowMs);
  const windowEnd   = new Date(windowStart.getTime() + config.windowMs);

  const ALLOW_ON_ERROR: RateLimitResult = {
    allowed: true, remaining: config.limit, resetAt: windowEnd.toISOString(), requestId,
  };

  try {
    const admin = getAdmin();
    if (!admin) {
      console.warn("[rateLimit] no admin client — check env vars, allowing request");
      return ALLOW_ON_ERROR;
    }

    // Upsert: increment hits for this key+window, or insert a new row
    const { data, error } = await admin.rpc("upsert_rate_limit", {
      p_key:         config.key,
      p_scope:       config.scope,
      p_user_id:     config.user_id    ?? null,
      p_ip:          config.ip         ?? null,
      p_route:       config.route      ?? null,
      p_target_type: config.target_type ?? null,
      p_target_id:   config.target_id  ?? null,
      p_window_start: windowStart.toISOString(),
      p_window_end:   windowEnd.toISOString(),
      p_metadata:    config.metadata   ?? {},
    }) as { data: number | null; error: { message: string } | null };

    if (error) {
      // Table or RPC missing → allow and warn (migration not yet applied)
      if (
        error.message.includes("does not exist") ||
        error.message.includes("could not find")
      ) {
        console.warn("[rateLimit] rate_limits table/RPC not found — allowing (migration pending)");
        return ALLOW_ON_ERROR;
      }
      console.warn("[rateLimit] upsert failed:", error.message);
      return ALLOW_ON_ERROR;
    }

    const hits = typeof data === "number" ? data : 1;
    const remaining = Math.max(0, config.limit - hits);
    const allowed   = hits <= config.limit;

    if (!allowed) {
      // Record blocked attempt
      void recordAbuse(admin, config, hits, requestId);
    }

    return { allowed, remaining, resetAt: windowEnd.toISOString(), requestId };
  } catch (err) {
    console.warn("[rateLimit] checkRateLimit threw:", err);
    return ALLOW_ON_ERROR;
  }
}

// ── recordAbuse (internal) ────────────────────────────────────────────────────

async function recordAbuse(
  admin: SupabaseClient,
  config: RateLimitConfig,
  hits: number,
  requestId: string,
): Promise<void> {
  try {
    // Increment blocked_count using the upsert RPC (hits already incremented, just update blocked)
    await admin.rpc("increment_rate_limit_blocked", { p_key: config.key });
  } catch {
    // Non-critical — blocked_count is informational only
  }

  // Log to system_errors (severity based on source)
  const isSensitive = config.scope.startsWith("owner_");
  const severity = hits > config.limit * 3 ? "high" : "low";

  void logSystemError({
    source:     "rate_limit",
    severity,
    message:    `Rate limit exceeded: ${config.scope} — ${hits} hits (limit ${config.limit})`,
    request_id: requestId,
    path:       config.route ?? null,
    user_id:    config.user_id ?? null,
    metadata: {
      scope:       config.scope,
      key:         config.key,
      hits,
      limit:       config.limit,
      ip:          config.ip ?? null,
      target_type: config.target_type ?? null,
      target_id:   config.target_id   ?? null,
    },
  });

  // Alert only on sensitive routes with repeated abuse (hits 2x+ over limit)
  if (isSensitive && hits > config.limit * 2) {
    void createSystemAlert({
      alert_type:  "rate_limit_abuse",
      severity:    "medium",
      title:       "تكرار تجاوز حدود الطلبات في عملية حساسة",
      description: `تجاوز حد الطلبات بشكل متكرر: ${config.scope} — ${hits} طلب (الحد ${config.limit})`,
      target_type: "rate_limit",
      target_id:   null,
      metadata: {
        scope:      config.scope,
        route:      config.route ?? null,
        hits,
        request_id: requestId,
      },
    });
  }
}

// ── json429 helper ────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success:    false,
      error:      "تجاوزت الحد المسموح به — يرجى الانتظار قبل المحاولة مجدداً",
      request_id: result.requestId,
      reset_at:   result.resetAt,
    },
    {
      status: 429,
      headers: {
        "Retry-After":       String(Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000)),
        "X-RateLimit-Reset": result.resetAt,
        "Cache-Control":     "no-store",
      },
    },
  );
}
