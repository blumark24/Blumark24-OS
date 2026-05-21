-- ============================================================
-- 011 — TENANT ISOLATION · PHASE A (PREPARATION ONLY)
-- Additive only. ZERO behavior change. Safe to run on a live DB.
-- Resilient to partially-built schemas: every step skips tables that
-- do not exist yet (e.g. an MVP without invoices/expenses/automations).
-- ============================================================
-- WHAT THIS DOES
--   1. Adds a nullable organization_id (FK → organizations) to every
--      operational table that exists and lacks it.
--   2. Indexes each new organization_id column.
--   3. Backfills existing rows (and existing internal staff profiles)
--      to the Blumark24 internal organization (slug = 'blumark24-internal').
--   4. Adds the helper public.current_org_id() for use by Phase B policies.
--
-- WHAT THIS DOES **NOT** DO  (deliberately)
--   • Does NOT create any missing business table.
--   • Does NOT create, drop, or alter ANY RLS policy / enforce scoping.
--   • Does NOT change application queries or UI.
--
-- RESILIENCE STRATEGY
--   A single PL/pgSQL DO block iterates over the operational-table list and
--   uses to_regclass('public.<t>') to detect existence, running ALTER /
--   CREATE INDEX / UPDATE via dynamic EXECUTE only for tables that exist.
--   Missing tables are skipped with a NOTICE — no error. If the schema later
--   gains those tables, re-running this migration labels them too.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS +
-- IS NULL backfill conditions, so re-running is safe and a no-op for
-- already-labelled rows.
-- ============================================================

DO $$
DECLARE
  v_internal UUID;
  t TEXT;
  -- Operational tables that feed the client dashboard. Any that are absent in
  -- the current schema are skipped safely.
  v_tables TEXT[] := ARRAY[
    'clients', 'tasks', 'employees', 'transactions', 'invoices', 'expenses',
    'activities', 'projects', 'strategy_phases', 'board_members',
    'automations', 'automation_logs', 'messages', 'notifications'
  ];
BEGIN
  -- organizations is the FK target; without it Phase A cannot label anything.
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE NOTICE '011 skipped entirely: public.organizations not found (apply migration 009 first)';
    RETURN;
  END IF;

  -- ── 1 + 2. Add nullable organization_id + index to each EXISTING table ──
  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE '011: table public.% not found — skipped', t;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID '
      || 'REFERENCES public.organizations(id) ON DELETE SET NULL',
      t
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (organization_id)',
      'idx_' || t || '_organization_id', t
    );
  END LOOP;

  -- ── 3. Backfill existing data → Blumark24 internal organization ────────
  SELECT id INTO v_internal
  FROM public.organizations
  WHERE slug = 'blumark24-internal'
  LIMIT 1;

  IF v_internal IS NULL THEN
    RAISE NOTICE '011 backfill skipped: organization slug=blumark24-internal not found';
  ELSE
    -- Only EXISTING tables, only rows whose organization_id IS NULL (so client
    -- logins that already have an org are never overwritten; idempotent).
    FOREACH t IN ARRAY v_tables LOOP
      IF to_regclass('public.' || t) IS NULL THEN
        CONTINUE;
      END IF;
      EXECUTE format(
        'UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', t
      ) USING v_internal;
    END LOOP;

    -- Existing internal staff/owner profiles only. Guarded so a schema that
    -- has not yet applied migration 010 (no profiles.organization_id column)
    -- is skipped instead of erroring.
    IF to_regclass('public.profiles') IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'profiles'
           AND column_name = 'organization_id'
       )
    THEN
      UPDATE public.profiles SET organization_id = v_internal WHERE organization_id IS NULL;
    ELSE
      RAISE NOTICE '011: profiles.organization_id missing (apply migration 010 first) — profile backfill skipped';
    END IF;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Helper: current_org_id()
--    Returns the caller's organization from profiles. SECURITY DEFINER so it
--    can be used inside Phase B RLS policies without recursion. Not referenced
--    by any policy yet — defined now so Phase B is a pure policy swap.
--    (Depends on profiles.organization_id from migration 010.)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;
