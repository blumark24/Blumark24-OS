-- ============================================================
-- SEC-1A — PRODUCTION RLS LEGACY POLICY CLEANUP
-- Date: 2026-07-10
-- Scope: Security / Tenant Isolation
-- Target tables: projects, invoices, expenses, activities, strategy_phases
--
-- WHY:
--   The tenant isolation audit (SEC-1) found that these five tables received
--   org-scoped RLS policies in migrations 015 and A1, but earlier legacy
--   policies were never confirmed fully dropped on them:
--
--     • projects       — 002 created snake_case is_manager_or_admin() policies;
--                        004 created "projects: read" with auth.role()='authenticated'.
--                        030 drops the colon-format names but NOT the snake_case ones.
--
--     • invoices       — 002 created snake_case is_manager_or_admin() policies;
--                        004 may have added colon-format broad policies.
--                        Neither 030 nor A1 include invoices in their drop lists.
--
--     • expenses       — same gap as invoices.
--
--     • activities     — 002 created snake_case policies; A1 dropped colon-format
--                        named broad policies, but NOT the snake_case variant
--                        (activities_select_policy etc.).
--
--     • strategy_phases — same gap as activities (A1 dropped authenticated_read
--                        variants but NOT strategy_phases_select_policy etc.).
--
--   In PostgreSQL RLS, multiple PERMISSIVE policies are OR-ed together.
--   A surviving legacy policy such as `is_manager_or_admin()` — which has no
--   organization_id check — silently defeats the org-scoped policy on the same
--   table, allowing any manager-role user in any org to read data from all orgs.
--
-- WHAT THIS DOES:
--   1. Dynamically drops ALL existing policies on each target table.
--      (Same safe pattern as migration 012 used for tasks/clients/employees.)
--   2. Recreates org-scoped replacement policies copied verbatim from the final
--      clean state established in migrations 015 and A1.
--   3. Adds a verification DO block that aborts the migration with a clear
--      error if any known-legacy policy name remains after cleanup.
--
-- WHAT THIS DOES NOT DO:
--   • Does NOT change any table schema, columns, or data.
--   • Does NOT create indexes (deferred to a separate migration).
--   • Does NOT drop or revoke legacy helper functions is_admin(),
--     is_manager_or_admin(), has_role() — deferred to SEC-1B after
--     confirming zero remaining policy references (see footer TODO).
--   • Does NOT touch any UI, TypeScript, or application code.
--
-- DEPENDENCIES:
--   • public.current_org_id()  (migration 011)
--   • public.is_owner()        (migration 009)
--   • public.get_my_role()     (migration 008)
--
-- Idempotent: re-running drops + recreates all policies cleanly.
-- ============================================================

-- ── 0. Dependency check ─────────────────────────────────────
DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION 'SEC-1A requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION 'SEC-1A requires public.is_owner() — apply migration 009 first';
  END IF;
  IF to_regprocedure('public.get_my_role()') IS NULL THEN
    RAISE EXCEPTION 'SEC-1A requires public.get_my_role() — apply migration 008 first';
  END IF;
END $$;

-- ── 1. Ensure RLS is enabled on all target tables ───────────
DO $$
DECLARE
  t TEXT;
  v_tables TEXT[] := ARRAY['projects', 'invoices', 'expenses', 'activities', 'strategy_phases'];
BEGIN
  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ── 2. Drop ALL existing policies on target tables ──────────
-- Uses the same dynamic DROP ALL approach as migration 012 (tasks/clients/employees).
-- This guarantees zero surviving legacy policies regardless of their name, even if
-- environment-specific deployments have different policy histories.
DO $$
DECLARE
  t   TEXT;
  pol RECORD;
  v_tables TEXT[] := ARRAY['projects', 'invoices', 'expenses', 'activities', 'strategy_phases'];
BEGIN
  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'SEC-1A: table public.% not found — skipped', t;
      CONTINUE;
    END IF;

    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    RAISE NOTICE 'SEC-1A: dropped all existing policies on public.%', t;
  END LOOP;
END $$;

-- ── 3. Recreate org-scoped policies ─────────────────────────
-- Policies are copied verbatim from the final clean state in migrations 015 and A1.
-- Each block is guarded: skipped if the table or organization_id column is missing.

-- ---- PROJECTS -------------------------------------------------------
-- Included because: 002 created projects_select_policy using is_manager_or_admin()
-- (no org scope); 004 created "projects: read" using auth.role()='authenticated'
-- (no org scope); 030 drops the colon-format names but NOT the snake_case ones.
-- Final policy source: migration 015 section 6 "PROJECTS".
DO $$ BEGIN
  IF to_regclass('public.projects') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'organization_id'
     ) THEN

    CREATE POLICY "projects: org select" ON public.projects FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "projects: org insert" ON public.projects FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager'))
      );

    CREATE POLICY "projects: org update" ON public.projects FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager'))
      );

    CREATE POLICY "projects: org delete" ON public.projects FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager'))
      );

  ELSE
    RAISE NOTICE 'SEC-1A: projects table or organization_id column missing — policies skipped';
  END IF;
END $$;

-- ---- INVOICES -------------------------------------------------------
-- Included because: 002 created invoices_select_policy using is_manager_or_admin()
-- (no org scope); 004 may have added "invoices: read" (auth.role()='authenticated').
-- Neither 030 nor A1 include invoices in their explicit drop lists, meaning
-- legacy snake_case and colon-format policies were never confirmed cleaned up.
-- Final policy source: migration 015 section 6 "INVOICES".
DO $$ BEGIN
  IF to_regclass('public.invoices') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'organization_id'
     ) THEN

    CREATE POLICY "invoices: org select" ON public.invoices FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "invoices: org insert" ON public.invoices FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

    CREATE POLICY "invoices: org update" ON public.invoices FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

    CREATE POLICY "invoices: org delete" ON public.invoices FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

  ELSE
    RAISE NOTICE 'SEC-1A: invoices table or organization_id column missing — policies skipped';
  END IF;
END $$;

-- ---- EXPENSES -------------------------------------------------------
-- Included because: same gap as invoices — 002 snake_case policies using
-- is_manager_or_admin() were never confirmed dropped; neither 030 nor A1
-- include expenses in their explicit drop lists.
-- Final policy source: migration 015 section 6 "EXPENSES".
DO $$ BEGIN
  IF to_regclass('public.expenses') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'organization_id'
     ) THEN

    CREATE POLICY "expenses: org select" ON public.expenses FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "expenses: org insert" ON public.expenses FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

    CREATE POLICY "expenses: org update" ON public.expenses FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

    CREATE POLICY "expenses: org delete" ON public.expenses FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','finance_manager','organization_manager'))
      );

  ELSE
    RAISE NOTICE 'SEC-1A: expenses table or organization_id column missing — policies skipped';
  END IF;
END $$;

-- ---- ACTIVITIES -----------------------------------------------------
-- Included because: 002 created snake_case activities_select_policy using
-- is_manager_or_admin() (no org scope). A1 dropped the colon-format named
-- broad policies but NOT the snake_case activities_*_policy variants.
-- Final policy source: migration A1 section 3 "ACTIVITIES" — superset of
-- migration 015, adds org-scoped UPDATE and DELETE which 015 omitted.
DO $$ BEGIN
  IF to_regclass('public.activities') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'organization_id'
     ) THEN

    CREATE POLICY "activities: org select" ON public.activities FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "activities: org insert" ON public.activities FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR organization_id = public.current_org_id()
      );

    CREATE POLICY "activities: org update" ON public.activities FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR organization_id = public.current_org_id()
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR organization_id = public.current_org_id()
      );

    CREATE POLICY "activities: org delete" ON public.activities FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR organization_id = public.current_org_id()
      );

  ELSE
    RAISE NOTICE 'SEC-1A: activities table or organization_id column missing — policies skipped';
  END IF;
END $$;

-- ---- STRATEGY PHASES ------------------------------------------------
-- Included because: 002 created snake_case strategy_phases_select_policy using
-- is_manager_or_admin() (no org scope). A1 dropped authenticated_read variants
-- but NOT the snake_case strategy_phases_*_policy variants.
-- Final policy source: migration A1 section 3 "STRATEGY PHASES".
DO $$ BEGIN
  IF to_regclass('public.strategy_phases') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'strategy_phases' AND column_name = 'organization_id'
     ) THEN

    CREATE POLICY "strategy_phases: org select" ON public.strategy_phases FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "strategy_phases: org insert" ON public.strategy_phases FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );

    CREATE POLICY "strategy_phases: org update" ON public.strategy_phases FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );

    CREATE POLICY "strategy_phases: org delete" ON public.strategy_phases FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id()
            AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );

  ELSE
    RAISE NOTICE 'SEC-1A: strategy_phases table or organization_id column missing — policies skipped';
  END IF;
END $$;

-- ── 4. Verification — abort if legacy policies remain ───────
-- Runs AFTER cleanup and recreate. Aborts with a clear error if any
-- known-legacy policy name still exists on any of the five target tables.
-- Expected outcome: zero matching rows, NOTICE "SEC-1A verification passed".
DO $$
DECLARE
  legacy_count  INTEGER;
  legacy_detail TEXT;
BEGIN
  SELECT
    COUNT(*),
    string_agg(tablename || '.' || policyname, ', ' ORDER BY tablename, policyname)
  INTO legacy_count, legacy_detail
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('projects', 'invoices', 'expenses', 'activities', 'strategy_phases')
    AND (
      -- Snake_case names from migration 002 (is_manager_or_admin / is_admin, no org scope)
      policyname IN (
        'projects_select_policy',      'projects_insert_policy',
        'projects_update_policy',      'projects_delete_policy',
        'activities_select_policy',    'activities_insert_policy',
        'activities_update_policy',    'activities_delete_policy',
        'invoices_select_policy',      'invoices_insert_policy',
        'invoices_update_policy',      'invoices_delete_policy',
        'expenses_select_policy',      'expenses_insert_policy',
        'expenses_update_policy',      'expenses_delete_policy',
        'strategy_phases_select_policy', 'strategy_phases_insert_policy',
        'strategy_phases_update_policy', 'strategy_phases_delete_policy'
      )
      -- Colon-format names from migration 004 (auth.role()='authenticated', no org scope)
      OR policyname IN (
        'projects: read',         'projects: write',
        'activities: read',       'activities: write',
        'invoices: read',         'invoices: write',
        'expenses: read',         'expenses: write',
        'strategy_phases: read',  'strategy_phases: write'
      )
      -- Generic broad names present across multiple legacy migration eras
      OR policyname IN ('authenticated_read', 'service_role_full_access')
      OR policyname LIKE 'super_admin_all_%'
      OR policyname ILIKE '%authenticated read%'
      OR policyname ILIKE '%authenticated_read%'
    );

  IF legacy_count > 0 THEN
    RAISE EXCEPTION
      'SEC-1A verification failed: % legacy policy/policies remain on target tables: [%]. '
      'Investigate pg_policies before re-running.',
      legacy_count, legacy_detail;
  END IF;

  RAISE NOTICE
    'SEC-1A verification passed: zero legacy policies remain on target tables '
    '(projects, invoices, expenses, activities, strategy_phases)';
END $$;

-- ============================================================
-- ROLLBACK (run manually to fully revert SEC-1A)
-- For each table: drop the "table: org *" policies, then re-run
-- migration 015 to restore the previous policy state.
-- Tables affected: projects, invoices, expenses, activities, strategy_phases.
-- No customer data is moved or deleted by this migration.
--
-- SEC-1B TODO — legacy helper function deprecation (separate migration):
--   Before dropping, verify zero remaining policy references:
--
--   SELECT tablename, policyname
--   FROM pg_policies
--   WHERE schemaname = 'public'
--     AND (
--       qual::text ILIKE '%is_manager_or_admin%'
--       OR qual::text ILIKE '%is_admin()%'
--       OR qual::text ILIKE '%has_role%'
--     )
--   ORDER BY tablename, policyname;
--
--   If zero rows, it is safe to run:
--   REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, anon;
--   REVOKE EXECUTE ON FUNCTION public.is_manager_or_admin() FROM authenticated, anon;
--   REVOKE EXECUTE ON FUNCTION public.has_role(text) FROM authenticated, anon;
--   DROP FUNCTION IF EXISTS public.is_admin();
--   DROP FUNCTION IF EXISTS public.is_manager_or_admin();
--   DROP FUNCTION IF EXISTS public.has_role(text);
-- ============================================================
