-- ============================================================
-- 012 — TENANT ISOLATION · PHASE B.1 (FIRST ENFORCEMENT)
-- Scope (deliberately narrow): tasks, clients, employees ONLY.
-- Everything else (finance, invoices, expenses, activities,
-- notifications, messages, automations, projects, strategy_phases,
-- board_members, transactions, …) is intentionally left untouched
-- and keeps its existing policies until a later phase.
-- ============================================================
-- WHAT THIS DOES
--   1. Replaces the legacy "any authenticated session can read/write
--      everything" policies on tasks / clients / employees with
--      organization-scoped policies:
--          organization_id = public.current_org_id()
--      while preserving full platform-owner + super_admin bypass:
--          public.is_owner() OR public.get_my_role() = 'super_admin'
--   2. Adds a BEFORE INSERT trigger that auto-stamps organization_id
--      with the caller's org (public.current_org_id()) when the app
--      omits it, so authenticated inserts (tasks/clients) never fail
--      the WITH CHECK and are always tenant-tagged correctly.
--   3. Safety backfill: any row still missing organization_id is
--      assigned to the internal Blumark24 org so enforcement never
--      makes pre-existing data vanish.
--
-- WHAT THIS DOES **NOT** DO
--   • Does NOT touch any table outside the three in scope.
--   • Does NOT change auth, owner login routing, or the UI.
--   • Does NOT grant cross-tenant access to anyone but owner/super_admin.
--
-- DEPENDENCIES (all from Phase A / earlier migrations)
--   • public.current_org_id()  (011)  — caller's profiles.organization_id
--   • public.is_owner()        (009)  — platform-owner JWT allowlist
--   • public.get_my_role()     (008)  — caller's profiles.role
--   • organization_id columns  (011)  — present on all three tables
--
-- Idempotent & resilient: re-running drops + recreates the policies and
-- trigger cleanly, and skips any table that does not exist.
-- ============================================================

-- ── 0. Hard dependency check (fail fast with a clear message) ──────────
DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '012 requires public.current_org_id() — apply migration 011 (Phase A) first';
  END IF;
  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION '012 requires public.is_owner() — apply migration 009 first';
  END IF;
  IF to_regprocedure('public.get_my_role()') IS NULL THEN
    RAISE EXCEPTION '012 requires public.get_my_role() — apply migration 008 first';
  END IF;
END $$;

-- ── 1. Auto-stamp trigger function ─────────────────────────────────────
-- Fills organization_id from the caller's org when the inserting app omits
-- it. Only acts when NULL, so an explicit (allowed) value is never changed.
-- The WITH CHECK policy below is the real guard: it rejects any attempt to
-- stamp a *different* org (non owner/super_admin), so this is convenience,
-- not a security boundary.
CREATE OR REPLACE FUNCTION public.set_current_org_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_org_id();
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2. Per-table: backfill NULLs, drop legacy policies, attach trigger ──
DO $$
DECLARE
  v_internal UUID;
  t          TEXT;
  pol        RECORD;
  v_tables   TEXT[] := ARRAY['tasks', 'clients', 'employees'];
BEGIN
  SELECT id INTO v_internal
  FROM public.organizations
  WHERE slug = 'blumark24-internal'
  LIMIT 1;

  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE '012: table public.% not found — skipped', t;
      CONTINUE;
    END IF;

    -- 2a. Safety backfill so enforcement never hides existing rows.
    IF v_internal IS NOT NULL THEN
      EXECUTE format(
        'UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', t
      ) USING v_internal;
    END IF;

    -- 2b. RLS on (idempotent).
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- 2c. Drop EVERY existing policy on this table. Critical: a leftover
    --     permissive policy (e.g. legacy "authenticated can read all") is
    --     OR-ed with the new ones and would silently defeat isolation.
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- 2d. (Re)attach the auto-stamp trigger.
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

-- ── 3. Org-scoped policies (static for reviewability) ──────────────────
-- Pattern, applied to every command on all three tables:
--   organization_id = public.current_org_id()      -- same tenant
--   OR public.is_owner()                            -- platform owner
--   OR public.get_my_role() = 'super_admin'         -- internal super admin

-- ---- TASKS ----------------------------------------------------------------
CREATE POLICY "tasks: org select" ON public.tasks FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "tasks: org insert" ON public.tasks FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "tasks: org update" ON public.tasks FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "tasks: org delete" ON public.tasks FOR DELETE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

-- ---- CLIENTS --------------------------------------------------------------
CREATE POLICY "clients: org select" ON public.clients FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "clients: org insert" ON public.clients FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "clients: org update" ON public.clients FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "clients: org delete" ON public.clients FOR DELETE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

-- ---- EMPLOYEES ------------------------------------------------------------
CREATE POLICY "employees: org select" ON public.employees FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org insert" ON public.employees FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org update" ON public.employees FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org delete" ON public.employees FOR DELETE
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

-- ============================================================
-- ROLLBACK (run manually to fully revert Phase B.1)
-- ------------------------------------------------------------
-- DROP POLICY IF EXISTS "tasks: org select"     ON public.tasks;
-- DROP POLICY IF EXISTS "tasks: org insert"     ON public.tasks;
-- DROP POLICY IF EXISTS "tasks: org update"     ON public.tasks;
-- DROP POLICY IF EXISTS "tasks: org delete"     ON public.tasks;
-- DROP POLICY IF EXISTS "clients: org select"   ON public.clients;
-- DROP POLICY IF EXISTS "clients: org insert"   ON public.clients;
-- DROP POLICY IF EXISTS "clients: org update"   ON public.clients;
-- DROP POLICY IF EXISTS "clients: org delete"   ON public.clients;
-- DROP POLICY IF EXISTS "employees: org select" ON public.employees;
-- DROP POLICY IF EXISTS "employees: org insert" ON public.employees;
-- DROP POLICY IF EXISTS "employees: org update" ON public.employees;
-- DROP POLICY IF EXISTS "employees: org delete" ON public.employees;
-- DROP TRIGGER IF EXISTS set_org_id ON public.tasks;
-- DROP TRIGGER IF EXISTS set_org_id ON public.clients;
-- DROP TRIGGER IF EXISTS set_org_id ON public.employees;
-- DROP FUNCTION IF EXISTS public.set_current_org_id();
-- -- then re-run migration 002_rls_and_functions.sql + 004_full_schema.sql
-- -- (and 008 for employees) to restore the previous global policies.
-- ============================================================
