-- ============================================================
-- 009 — OWNER COMMAND CENTER TABLES
-- Additive only. No existing tables, columns, or data touched.
-- Safe to run on a live database.
-- ============================================================
-- Creates: plans, plan_limits, organizations, subscriptions,
--          owner_audit_logs
-- Seeds:   3 plans + plan_limits + 1 internal Blumark24 org + 1 internal subscription
-- RLS:     owner-only (blumark24@gmail.com + blumark.sa@gmail.com)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- is_owner() — mirrors get_my_role() pattern.
-- SECURITY DEFINER so it reads the JWT claim without recursion.
-- Owner allowlist is kept in sync with src/lib/owner.ts.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT (auth.jwt() ->> 'email') = ANY(
    ARRAY['blumark24@gmail.com', 'blumark.sa@gmail.com']
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- TABLE: plans
-- Defines subscription tiers (Basic / Growth / Advanced).
-- plan_limits and organizations both reference this table,
-- so it must be created first.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  slug          TEXT        UNIQUE NOT NULL,
  price_monthly NUMERIC,
  price_annual  NUMERIC,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans: owner select"  ON public.plans;
DROP POLICY IF EXISTS "plans: owner insert"  ON public.plans;
DROP POLICY IF EXISTS "plans: owner update"  ON public.plans;
DROP POLICY IF EXISTS "plans: owner delete"  ON public.plans;

CREATE POLICY "plans: owner select"
  ON public.plans FOR SELECT
  USING (public.is_owner());

CREATE POLICY "plans: owner insert"
  ON public.plans FOR INSERT
  WITH CHECK (public.is_owner());

CREATE POLICY "plans: owner update"
  ON public.plans FOR UPDATE
  USING (public.is_owner());

CREATE POLICY "plans: owner delete"
  ON public.plans FOR DELETE
  USING (public.is_owner());

-- ─────────────────────────────────────────────────────────────
-- TABLE: plan_limits
-- Per-plan resource limits stored as typed key-value pairs.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID        NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  limit_key   TEXT        NOT NULL,
  limit_value INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, limit_key)
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_limits: owner select"  ON public.plan_limits;
DROP POLICY IF EXISTS "plan_limits: owner insert"  ON public.plan_limits;
DROP POLICY IF EXISTS "plan_limits: owner update"  ON public.plan_limits;
DROP POLICY IF EXISTS "plan_limits: owner delete"  ON public.plan_limits;

CREATE POLICY "plan_limits: owner select"
  ON public.plan_limits FOR SELECT
  USING (public.is_owner());

CREATE POLICY "plan_limits: owner insert"
  ON public.plan_limits FOR INSERT
  WITH CHECK (public.is_owner());

CREATE POLICY "plan_limits: owner update"
  ON public.plan_limits FOR UPDATE
  USING (public.is_owner());

CREATE POLICY "plan_limits: owner delete"
  ON public.plan_limits FOR DELETE
  USING (public.is_owner());

-- ─────────────────────────────────────────────────────────────
-- TABLE: organizations
-- A customer/tenant organization managed by the owner.
-- plan_id is nullable so an org can exist before a plan is set.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE,
  owner_email TEXT,
  plan_id     UUID        REFERENCES public.plans(id),
  status      TEXT        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations: owner select"  ON public.organizations;
DROP POLICY IF EXISTS "organizations: owner insert"  ON public.organizations;
DROP POLICY IF EXISTS "organizations: owner update"  ON public.organizations;
DROP POLICY IF EXISTS "organizations: owner delete"  ON public.organizations;

CREATE POLICY "organizations: owner select"
  ON public.organizations FOR SELECT
  USING (public.is_owner());

CREATE POLICY "organizations: owner insert"
  ON public.organizations FOR INSERT
  WITH CHECK (public.is_owner());

CREATE POLICY "organizations: owner update"
  ON public.organizations FOR UPDATE
  USING (public.is_owner());

CREATE POLICY "organizations: owner delete"
  ON public.organizations FOR DELETE
  USING (public.is_owner());

-- ─────────────────────────────────────────────────────────────
-- TABLE: subscriptions
-- Links an organization to an active plan.
-- ends_at is nullable for open-ended subscriptions.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id         UUID        NOT NULL REFERENCES public.plans(id),
  status          TEXT        NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'suspended')),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at         TIMESTAMPTZ,
  billing_cycle   TEXT        NOT NULL DEFAULT 'monthly'
                  CHECK (billing_cycle IN ('monthly', 'annual', 'internal')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions: owner select"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: owner insert"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: owner update"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions: owner delete"  ON public.subscriptions;

CREATE POLICY "subscriptions: owner select"
  ON public.subscriptions FOR SELECT
  USING (public.is_owner());

CREATE POLICY "subscriptions: owner insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_owner());

CREATE POLICY "subscriptions: owner update"
  ON public.subscriptions FOR UPDATE
  USING (public.is_owner());

CREATE POLICY "subscriptions: owner delete"
  ON public.subscriptions FOR DELETE
  USING (public.is_owner());

-- ─────────────────────────────────────────────────────────────
-- TABLE: owner_audit_logs
-- Immutable append-only log of owner actions.
-- No UPDATE or DELETE policies — rows are permanent records.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.owner_audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_audit_logs: owner select"  ON public.owner_audit_logs;
DROP POLICY IF EXISTS "owner_audit_logs: owner insert"  ON public.owner_audit_logs;

-- Read: owner only
CREATE POLICY "owner_audit_logs: owner select"
  ON public.owner_audit_logs FOR SELECT
  USING (public.is_owner());

-- Write: owner only — no UPDATE/DELETE policies (immutable)
CREATE POLICY "owner_audit_logs: owner insert"
  ON public.owner_audit_logs FOR INSERT
  WITH CHECK (public.is_owner());

-- ─────────────────────────────────────────────────────────────
-- SEED: plans
-- Matches the mock data in src/app/owner/_data.ts
-- ON CONFLICT DO NOTHING makes this safe to re-run.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.plans (name, slug, price_monthly, price_annual, is_active, sort_order)
VALUES
  ('بسيط',   'basic',    NULL, NULL, true, 1),
  ('نمو',    'growth',   NULL, NULL, true, 2),
  ('متقدم',  'advanced', NULL, NULL, true, 3)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED: plan_limits
-- Keys match the labels shown in PlanLimitsPreview.tsx.
-- whatsapp_enabled is stored as 0/1 integer.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT p.id, v.limit_key, v.limit_value
FROM public.plans p
JOIN (VALUES
  ('basic',    'max_employees',   3),
  ('basic',    'max_agencies',    0),
  ('basic',    'max_departments', 1),
  ('basic',    'max_sections',    3),
  ('basic',    'ai_level',        1),
  ('basic',    'whatsapp_enabled',0),

  ('growth',   'max_employees',   25),
  ('growth',   'max_agencies',    1),
  ('growth',   'max_departments', 5),
  ('growth',   'max_sections',    20),
  ('growth',   'ai_level',        2),
  ('growth',   'whatsapp_enabled',1),

  ('advanced', 'max_employees',   100),
  ('advanced', 'max_agencies',    10),
  ('advanced', 'max_departments', 50),
  ('advanced', 'max_sections',    200),
  ('advanced', 'ai_level',        3),
  ('advanced', 'whatsapp_enabled',1)
) AS v(slug, limit_key, limit_value) ON p.slug = v.slug
ON CONFLICT (plan_id, limit_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED: organizations
-- Blumark24 itself as the default internal organization,
-- assigned to the advanced plan from the start.
-- DO UPDATE ensures plan_id is set even on a re-run where the
-- row already exists with a NULL plan_id from an earlier draft.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.organizations (name, slug, owner_email, plan_id, status)
SELECT
  'Blumark24',
  'blumark24-internal',
  'blumark24@gmail.com',
  p.id,
  'active'
FROM public.plans p
WHERE p.slug = 'advanced'
ON CONFLICT (slug) DO UPDATE SET
  plan_id = EXCLUDED.plan_id;

-- ─────────────────────────────────────────────────────────────
-- SEED: subscriptions
-- One internal subscription for Blumark24 on the advanced plan.
-- billing_cycle = 'internal' marks it as a non-billed account.
-- WHERE NOT EXISTS is used because subscriptions has no unique
-- constraint, so ON CONFLICT is not available here.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.subscriptions (organization_id, plan_id, status, billing_cycle)
SELECT o.id, p.id, 'active', 'internal'
FROM public.organizations o
JOIN public.plans p ON p.slug = 'advanced'
WHERE o.slug = 'blumark24-internal'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.organization_id = o.id
      AND s.plan_id = p.id
  );
