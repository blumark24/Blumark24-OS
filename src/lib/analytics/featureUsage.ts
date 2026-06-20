/**
 * C6 — Feature usage tracking utility (server-side only).
 *
 * Writes to `feature_usage_events` (created in C3 migration).
 * All calls are non-blocking. Failures are swallowed with console.warn.
 * No secrets, tokens, auth headers, or sensitive payloads are stored.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Admin client ──────────────────────────────────────────────────────────────

function getAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── normalizeFeatureKey ───────────────────────────────────────────────────────

const FEATURE_KEY_RE = /[^a-z0-9_]/g;

/** Stable snake_case feature key, max 64 chars. */
export function normalizeFeatureKey(key: string): string {
  return key.toLowerCase().replace(FEATURE_KEY_RE, "_").slice(0, 64);
}

// ── sanitizeUsageMetadata ─────────────────────────────────────────────────────

const MAX_META_KEYS   = 10;
const MAX_STR_LEN     = 200;
const BLOCKED_KEYS    = new Set(["token", "password", "secret", "key", "authorization", "cookie"]);

/** Strip secrets and enforce size limits on usage event metadata. */
export function sanitizeUsageMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (count >= MAX_META_KEYS) break;
    const safeKey = k.toLowerCase().slice(0, 50);
    if (BLOCKED_KEYS.has(safeKey)) continue;
    if (typeof v === "string")  { out[safeKey] = v.slice(0, MAX_STR_LEN); count++; }
    else if (typeof v === "number" || typeof v === "boolean" || v === null) { out[safeKey] = v; count++; }
  }
  return out;
}

// ── trackFeatureUsage ─────────────────────────────────────────────────────────

export interface TrackFeatureUsageInput {
  feature_key:      string;
  event_type:       string;
  organization_id?: string | null;
  user_id?:         string | null;
  path?:            string | null;
  metadata?:        Record<string, unknown>;
}

/**
 * Non-blocking: fire-and-forget write to feature_usage_events.
 * Returns immediately. The write happens asynchronously.
 */
export function trackFeatureUsage(input: TrackFeatureUsageInput): void {
  void (async () => {
    try {
      const admin = getAdmin();
      if (!admin) {
        console.warn("[analytics] trackFeatureUsage: no admin client — check env vars");
        return;
      }
      const { error } = await admin.from("feature_usage_events").insert({
        feature_key:     normalizeFeatureKey(input.feature_key),
        event_type:      input.event_type.slice(0, 50),
        organization_id: input.organization_id ?? null,
        user_id:         input.user_id         ?? null,
        path:            input.path ? input.path.slice(0, 300) : null,
        metadata:        sanitizeUsageMetadata(input.metadata ?? {}),
      });
      if (error) {
        console.warn("[analytics] trackFeatureUsage insert failed:", error.message);
      }
    } catch (err) {
      console.warn("[analytics] trackFeatureUsage threw:", err);
    }
  })();
}
