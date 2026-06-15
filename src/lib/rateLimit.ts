/**
 * In-memory sliding-window rate limiter.
 *
 * TEMPORARY — suitable for single-instance launch (Vercel Serverless/Edge
 * restarts reset state, so limits are approximate). For production at scale,
 * replace with Redis/Upstash KV and the `@upstash/ratelimit` package.
 * See: https://upstash.com/docs/redis/sdks/ratelimit/overview
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();

/** Remove entries older than 2x the longest window to keep memory bounded. */
function pruneStore(maxAgeMs: number) {
  const cutoff = Date.now() - maxAgeMs * 2;
  store.forEach((entry, key) => {
    if (entry.windowStart < cutoff) store.delete(key);
  });
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * @param key      Unique bucket key (e.g. `ip:${ip}` or `user:${userId}`)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneStore(windowMs);

  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: limit - 1, resetInMs: windowMs };
  }

  entry.count += 1;
  const resetInMs = windowMs - (now - entry.windowStart);

  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetInMs };
  }

  return { ok: true, remaining: limit - entry.count, resetInMs };
}

/** Extract the best available IP from a NextRequest. */
export function resolveIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
