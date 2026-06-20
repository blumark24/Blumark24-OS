-- ============================================================
-- C5 — RATE LIMITS TABLE
-- Persistent, DB-backed sliding-window rate limit tracking.
-- Used by owner-sensitive API routes (change-plan, provision-tenant,
-- monitoring error reporter).
--
-- SAFETY RULES (all applied):
--   • CREATE TABLE IF NOT EXISTS — fully idempotent
--   • No existing table drops, no data deletes, no schema changes
--   • No RLS weakening on existing tables
--   • No broad PUBLIC or anon access
--   • All RLS uses existing helpers: is_owner(), get_my_role()
--   • All indexes IF NOT EXISTS
-- ============================================================

-- ── A. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text         NOT NULL,
  scope         text         NOT NULL,
  user_id       uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  ip            text,
  route         text,
  target_type   text,
  target_id     text,
  hits          integer      NOT NULL DEFAULT 1,
  window_start  timestamptz  NOT NULL DEFAULT now(),
  window_end    timestamptz  NOT NULL,
  blocked_count integer      NOT NULL DEFAULT 0,
  metadata      jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- ── B. Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ── C. RLS Policies ───────────────────────────────────────────────────────────
-- Owner-only read. Service role (used by the rate limit utility) bypasses RLS.

DROP POLICY IF EXISTS "rate_limits: owner select" ON public.rate_limits;
DROP POLICY IF EXISTS "rate_limits: owner write"  ON public.rate_limits;

CREATE POLICY "rate_limits: owner select"
  ON public.rate_limits FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

-- Insert/update handled server-side via service role — no RLS policy needed
-- for writes from the utility. We add a write policy so owner can insert
-- manually from Supabase dashboard if needed for testing.
CREATE POLICY "rate_limits: owner write"
  ON public.rate_limits FOR INSERT
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

-- ── E. RPC: upsert_rate_limit ─────────────────────────────────────────────────
--
-- Atomically inserts or increments hits for a rate limit window.
-- Returns the NEW hits count after the operation.
-- Called by the server-side rate limit utility via service role.

CREATE OR REPLACE FUNCTION public.upsert_rate_limit(
  p_key         text,
  p_scope       text,
  p_user_id     uuid,
  p_ip          text,
  p_route       text,
  p_target_type text,
  p_target_id   text,
  p_window_start timestamptz,
  p_window_end  timestamptz,
  p_metadata    jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hits integer;
BEGIN
  INSERT INTO public.rate_limits (
    key, scope, user_id, ip, route, target_type, target_id,
    hits, window_start, window_end, blocked_count, metadata
  )
  VALUES (
    p_key, p_scope, p_user_id, p_ip, p_route, p_target_type, p_target_id,
    1, p_window_start, p_window_end, 0, COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (key, window_start, window_end)
  DO UPDATE SET
    hits       = rate_limits.hits + 1,
    updated_at = now()
  RETURNING hits INTO v_hits;

  RETURN v_hits;
END;
$$;

-- Restrict: revoke broad access, grant only to service_role (used by the utility)
-- and postgres (superuser, for maintenance). anon and PUBLIC are NOT granted.
REVOKE ALL ON FUNCTION public.upsert_rate_limit(text,text,uuid,text,text,text,text,timestamptz,timestamptz,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_rate_limit(text,text,uuid,text,text,text,text,timestamptz,timestamptz,jsonb) FROM anon;
GRANT  EXECUTE ON FUNCTION public.upsert_rate_limit(text,text,uuid,text,text,text,text,timestamptz,timestamptz,jsonb) TO service_role;
GRANT  EXECUTE ON FUNCTION public.upsert_rate_limit(text,text,uuid,text,text,text,text,timestamptz,timestamptz,jsonb) TO postgres;

-- Helper: increment blocked_count for a key's current active window
CREATE OR REPLACE FUNCTION public.increment_rate_limit_blocked(p_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.rate_limits
     SET blocked_count = blocked_count + 1,
         updated_at    = now()
   WHERE key        = p_key
     AND window_end  > now()
     AND window_start <= now();
$$;

REVOKE ALL ON FUNCTION public.increment_rate_limit_blocked(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_rate_limit_blocked(text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.increment_rate_limit_blocked(text) TO service_role;
GRANT  EXECUTE ON FUNCTION public.increment_rate_limit_blocked(text) TO postgres;

-- ── F. Indexes ────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key_window
  ON public.rate_limits (key, window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_window_end
  ON public.rate_limits (scope, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id_window_end
  ON public.rate_limits (user_id, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_window_end
  ON public.rate_limits (ip, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_route_window_end
  ON public.rate_limits (route, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end
  ON public.rate_limits (window_end);

-- ── G. Verification notes ─────────────────────────────────────────────────────
--
-- E1. Table exists:
--   SELECT tablename FROM pg_tables
--   WHERE schemaname = 'public' AND tablename = 'rate_limits';
--
-- E2. RLS enabled:
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname = 'rate_limits';
--   -- Expected: relrowsecurity = true
--
-- E3. Policies created:
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'rate_limits';
--
-- E4. Indexes:
--   SELECT indexname FROM pg_indexes WHERE tablename = 'rate_limits' ORDER BY indexname;
--
-- E5. RPC grants — verify service_role can execute, anon/PUBLIC cannot:
--
--   -- Should return rows for service_role and postgres only:
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name IN ('upsert_rate_limit', 'increment_rate_limit_blocked')
--     AND routine_schema = 'public'
--   ORDER BY routine_name, grantee;
--
--   -- Expected output (two functions × two grantees):
--   --  grantee       | privilege_type
--   --  --------------|----------------
--   --  postgres      | EXECUTE
--   --  service_role  | EXECUTE
--   --  (no row for anon, authenticated, or PUBLIC)
--
-- E6. Smoke-test via service role (run in Supabase SQL editor as service_role):
--   SELECT public.upsert_rate_limit(
--     'test_key', 'test_scope', NULL, '1.2.3.4', '/test',
--     NULL, NULL, now(), now() + interval '10 minutes', '{}'::jsonb
--   );
--   -- Expected: returns 1 (first hit)
--
-- ── End of C5 migration ───────────────────────────────────────────────────────
