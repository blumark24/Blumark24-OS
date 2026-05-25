-- ============================================================
-- 028 — AI USAGE LOGS (additive observability)
-- Tracks tenant AI chat requests for owner usage dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  model            TEXT        NOT NULL DEFAULT '',
  input_tokens     INTEGER     NOT NULL DEFAULT 0,
  output_tokens    INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org ON public.ai_usage_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON public.ai_usage_logs (created_at DESC);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_logs: owner select" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs: tenant insert own org" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs: tenant select own org" ON public.ai_usage_logs;

CREATE POLICY "ai_usage_logs: owner select"
  ON public.ai_usage_logs FOR SELECT
  USING (public.is_owner());

CREATE POLICY "ai_usage_logs: tenant select own org"
  ON public.ai_usage_logs FOR SELECT
  USING (organization_id = public.current_org_id());

CREATE POLICY "ai_usage_logs: tenant insert own org"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (organization_id = public.current_org_id());

-- Service role API route bypasses RLS for cross-tenant logging when needed.
