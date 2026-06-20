-- ============================================================
-- C3 — OPERATIONS & MONITORING FOUNDATION
-- Adds production-grade tables for error monitoring, system alerts,
-- support ticketing, and feature usage tracking.
--
-- SAFETY RULES (all applied):
--   • CREATE TABLE IF NOT EXISTS — fully idempotent
--   • No existing table drops, no data deletes, no schema changes
--   • No RLS weakening on existing tables
--   • No broad PUBLIC or anon access
--   • All RLS uses existing helpers: is_owner(), current_org_id(), get_my_role()
--   • All indexes IF NOT EXISTS
-- ============================================================

-- ── A. Tables ─────────────────────────────────────────────────────────────────

-- A1. system_errors — runtime and backend error tracking
CREATE TABLE IF NOT EXISTS public.system_errors (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id       uuid         REFERENCES auth.users(id)            ON DELETE SET NULL,
  source        text         NOT NULL,
  severity      text         NOT NULL DEFAULT 'medium',
  error_code    text,
  message       text         NOT NULL,
  stack         text,
  path          text,
  request_id    text,
  metadata      jsonb        NOT NULL DEFAULT '{}'::jsonb,
  resolved_at   timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- A2. system_alerts — operational alerts visible to the owner
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type      text         NOT NULL,
  severity        text         NOT NULL DEFAULT 'medium',
  title           text         NOT NULL,
  description     text,
  target_type     text,
  target_id       uuid,
  status          text         NOT NULL DEFAULT 'open',
  metadata        jsonb        NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at timestamptz,
  resolved_at     timestamptz,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

-- A3. support_tickets — customer support issues
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid         REFERENCES public.organizations(id) ON DELETE SET NULL,
  customer_email   text,
  subject          text         NOT NULL,
  category         text         NOT NULL DEFAULT 'general',
  priority         text         NOT NULL DEFAULT 'medium',
  status           text         NOT NULL DEFAULT 'open',
  source           text         NOT NULL DEFAULT 'owner_panel',
  assigned_to      uuid         REFERENCES auth.users(id)           ON DELETE SET NULL,
  metadata         jsonb        NOT NULL DEFAULT '{}'::jsonb,
  closed_at        timestamptz,
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

-- A4. support_messages — messages within support tickets
CREATE TABLE IF NOT EXISTS public.support_messages (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid         NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type  text         NOT NULL,
  sender_id    uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  message      text         NOT NULL,
  metadata     jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz  NOT NULL DEFAULT now()
);

-- A5. feature_usage_events — feature usage at scale
CREATE TABLE IF NOT EXISTS public.feature_usage_events (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid         REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id         uuid         REFERENCES auth.users(id)            ON DELETE SET NULL,
  feature_key     text         NOT NULL,
  event_type      text         NOT NULL,
  path            text,
  metadata        jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz  NOT NULL DEFAULT now()
);

-- ── B. Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.system_errors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_events  ENABLE ROW LEVEL SECURITY;

-- ── C. RLS Policies ───────────────────────────────────────────────────────────
--
-- Pattern for all tables:
--   • Owner: full SELECT (and INSERT/UPDATE for operational records)
--   • super_admin: full SELECT
--   • Tenant authenticated: SELECT own org rows only
--   • anon: no access (no policy = denied)
--   • No PUBLIC access

-- C1. system_errors

DROP POLICY IF EXISTS "system_errors: owner select"  ON public.system_errors;
DROP POLICY IF EXISTS "system_errors: tenant select" ON public.system_errors;
DROP POLICY IF EXISTS "system_errors: owner write"   ON public.system_errors;

CREATE POLICY "system_errors: owner select"
  ON public.system_errors FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "system_errors: tenant select"
  ON public.system_errors FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_org_id()
  );

CREATE POLICY "system_errors: owner write"
  ON public.system_errors FOR INSERT
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

-- C2. system_alerts (owner-only table — no tenant column)

DROP POLICY IF EXISTS "system_alerts: owner select" ON public.system_alerts;
DROP POLICY IF EXISTS "system_alerts: owner write"  ON public.system_alerts;
DROP POLICY IF EXISTS "system_alerts: owner update" ON public.system_alerts;

CREATE POLICY "system_alerts: owner select"
  ON public.system_alerts FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "system_alerts: owner write"
  ON public.system_alerts FOR INSERT
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "system_alerts: owner update"
  ON public.system_alerts FOR UPDATE
  USING  (public.is_owner() OR public.get_my_role() = 'super_admin')
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

-- C3. support_tickets

DROP POLICY IF EXISTS "support_tickets: owner select"  ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: tenant select" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: owner write"   ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets: owner update"  ON public.support_tickets;

CREATE POLICY "support_tickets: owner select"
  ON public.support_tickets FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "support_tickets: tenant select"
  ON public.support_tickets FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_org_id()
  );

CREATE POLICY "support_tickets: owner write"
  ON public.support_tickets FOR INSERT
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "support_tickets: owner update"
  ON public.support_tickets FOR UPDATE
  USING  (public.is_owner() OR public.get_my_role() = 'super_admin')
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

-- C4. support_messages — visibility follows the ticket's organization

DROP POLICY IF EXISTS "support_messages: owner select"  ON public.support_messages;
DROP POLICY IF EXISTS "support_messages: tenant select" ON public.support_messages;
DROP POLICY IF EXISTS "support_messages: owner write"   ON public.support_messages;

CREATE POLICY "support_messages: owner select"
  ON public.support_messages FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "support_messages: tenant select"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND t.organization_id IS NOT NULL
        AND t.organization_id = public.current_org_id()
    )
  );

CREATE POLICY "support_messages: owner write"
  ON public.support_messages FOR INSERT
  WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin');

-- C5. feature_usage_events

DROP POLICY IF EXISTS "feature_usage_events: owner select"  ON public.feature_usage_events;
DROP POLICY IF EXISTS "feature_usage_events: tenant select" ON public.feature_usage_events;
DROP POLICY IF EXISTS "feature_usage_events: write"         ON public.feature_usage_events;

CREATE POLICY "feature_usage_events: owner select"
  ON public.feature_usage_events FOR SELECT
  USING (public.is_owner() OR public.get_my_role() = 'super_admin');

CREATE POLICY "feature_usage_events: tenant select"
  ON public.feature_usage_events FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_org_id()
  );

CREATE POLICY "feature_usage_events: write"
  ON public.feature_usage_events FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id IS NOT NULL
      AND organization_id = public.current_org_id()
    )
  );

-- ── D. Indexes ────────────────────────────────────────────────────────────────

-- system_errors
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at
  ON public.system_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_severity_created_at
  ON public.system_errors (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_org_created_at
  ON public.system_errors (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_resolved_at
  ON public.system_errors (resolved_at);

-- system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_status_created_at
  ON public.system_alerts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created_at
  ON public.system_alerts (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_alert_type_created_at
  ON public.system_alerts (alert_type, created_at DESC);

-- support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
  ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_created_at
  ON public.support_tickets (priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_org_created_at
  ON public.support_tickets (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to_created_at
  ON public.support_tickets (assigned_to, created_at DESC);

-- support_messages
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created_at
  ON public.support_messages (ticket_id, created_at ASC);

-- feature_usage_events
CREATE INDEX IF NOT EXISTS idx_feature_usage_org_created_at
  ON public.feature_usage_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_key_created_at
  ON public.feature_usage_events (feature_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_event_type_created_at
  ON public.feature_usage_events (event_type, created_at DESC);

-- ── E. Verification notes ─────────────────────────────────────────────────────
--
-- E1. Tables exist:
--   SELECT tablename FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN ('system_errors','system_alerts','support_tickets','support_messages','feature_usage_events');
--
-- E2. RLS enabled:
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('system_errors','system_alerts','support_tickets','support_messages','feature_usage_events');
--   -- Expected: relrowsecurity = true for all
--
-- E3. Policies created:
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public'
--     AND tablename IN ('system_errors','system_alerts','support_tickets','support_messages','feature_usage_events')
--   ORDER BY tablename, policyname;
--
-- E4. Owner can select (run as owner):
--   SELECT count(*) FROM public.system_errors;
--   SELECT count(*) FROM public.system_alerts;
--   SELECT count(*) FROM public.support_tickets;
--   SELECT count(*) FROM public.feature_usage_events;
--
-- E5. Tenant can only see own org rows:
--   (run as authenticated non-owner user)
--   SELECT count(*) FROM public.system_errors;    -- should return own-org rows only
--   SELECT count(*) FROM public.system_alerts;    -- should return 0 (no org_id on alerts)
--
-- E6. Anon cannot read (no policy grants anon):
--   (run as anon)
--   SELECT * FROM public.system_errors;          -- should return 0 rows or permission denied
--
-- E7. Indexes:
--   SELECT indexname FROM pg_indexes
--   WHERE tablename IN ('system_errors','system_alerts','support_tickets','support_messages','feature_usage_events')
--   ORDER BY indexname;
--
-- ── End of C3 migration ───────────────────────────────────────────────────────
