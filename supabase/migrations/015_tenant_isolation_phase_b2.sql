-- ============================================================
-- 015 — TENANT ISOLATION · PHASE B.2 (FINALIZE CLIENT ISOLATION)
-- Extends the org-scoped RLS from Phase B.1 (tasks/clients/employees)
-- to EVERY remaining operational table that feeds a customer dashboard,
-- and introduces a first-class tenant-manager role.
-- ============================================================
-- WHY
--   Phase B.1 only isolated tasks/clients/employees. The customer
--   dashboard ALSO reads transactions, projects, activities,
--   notifications, messages, invoices, expenses, automations,
--   automation_logs, strategy_phases and board_members — all of which
--   still carried the legacy "any authenticated session may read every
--   row" policy. As a result a customer tenant could still see the
--   internal Blumark24 org's revenue charts, recent activity, projects,
--   notifications, etc. This migration closes that gap so a customer
--   tenant sees ONLY its own organization-scoped rows and a brand-new
--   tenant sees zero data / empty states.
--
-- WHAT THIS DOES
--   1. SELECT on every in-scope table becomes organization-scoped:
--          organization_id = public.current_org_id()
--      (+ full bypass for platform owner / internal super_admin).
--   2. INSERT / UPDATE / DELETE stay tenant-scoped AND keep the existing
--      per-table role gates (reconstructed from 002 / 004), with the new
--      organization_manager treated as a board_member-equivalent that is
--      confined to a single organization (never cross-tenant).
--   3. A BEFORE INSERT trigger auto-stamps organization_id with the
--      caller's org so app inserts that omit it never fail the WITH CHECK.
--   4. Safety backfill: any in-scope row still missing organization_id is
--      assigned to the internal Blumark24 org so enforcement never makes
--      pre-existing data vanish.
--   5. Introduces the organization_manager role (Arabic label
--      "مدير المنشأة"), allows it in profiles_role_check, seeds its
--      default permissions, and promotes existing customer-tenant logins
--      from 'employee' to 'organization_manager'.
--   6. Refreshes the Phase B.1 write policies on tasks/clients so the
--      tenant manager can manage its own organization's data.
--
-- WHAT THIS DOES **NOT** DO
--   • Does NOT grant cross-tenant access to anyone but owner/super_admin.
--   • Does NOT touch auth, owner login routing, or the UI.
--   • Does NOT delete or move any customer data.
--
-- DEPENDENCIES (all from earlier migrations)
--   • public.current_org_id()  (011)  • organization_id columns (011)
--   • public.is_owner()        (009)  • organizations.is_internal (013)
--   • public.get_my_role()     (008)  • organizations.owner_email (009)
--
-- Idempotent & resilient: re-running drops + recreates the policies and
-- triggers cleanly, and skips any table that does not exist.
-- ============================================================

-- ── 0. Hard dependency check (fail fast with a clear message) ──────────
DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '015 requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION '015 requires public.is_owner() — apply migration 009 first';
  END IF;
  IF to_regprocedure('public.get_my_role()') IS NULL THEN
    RAISE EXCEPTION '015 requires public.get_my_role() — apply migration 008 first';
  END IF;
END $$;

-- ── 1. Auto-stamp trigger function (reused from Phase B.1; idempotent) ──
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

-- ── 2. organization_manager role: allow it in the role check constraint ─
-- Abort-safe: we DROP the old check first (so the section-4 promotion to
-- organization_manager can never be blocked by a stale constraint), then
-- re-add the widened check ONLY if every existing role already fits it.
-- If some legacy role is outside the set we leave the check dropped with a
-- NOTICE rather than aborting the whole isolation migration — RLS, not this
-- CHECK, is the security boundary.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE '015: public.profiles not found — role constraint update skipped';
    RETURN;
  END IF;

  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE role IS NOT NULL AND role NOT IN (
      'super_admin','board_member','defense_manager','attack_manager',
      'finance_manager','employee','organization_manager'
    )
  ) THEN
    RAISE NOTICE '015: profiles contains roles outside the allowed set — leaving role check dropped to avoid aborting the migration';
  ELSE
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN (
        'super_admin','board_member','defense_manager','attack_manager',
        'finance_manager','employee','organization_manager'
      ));
  END IF;
END $$;

-- ── 3. Seed default permissions for organization_manager ───────────────
-- Mirrors src/contexts/PermissionsContext.tsx DEFAULT_ROLE_PERMISSIONS.
-- ON CONFLICT DO NOTHING so a hand-tuned row is never overwritten.
-- Guarded: the role_permissions table is optional in a minimal schema.
DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NULL THEN
    RAISE NOTICE '015: public.role_permissions not found — organization_manager seed skipped';
  ELSE
    INSERT INTO public.role_permissions (role, permissions) VALUES
      ('organization_manager',
       ARRAY['view_dashboard','manage_tasks','manage_clients','manage_finance','manage_reports'])
    ON CONFLICT (role) DO NOTHING;
  END IF;
END $$;

-- ── 4. Promote existing customer-tenant logins → organization_manager ──
-- A customer-tenant login is the profile linked (organization_id) to a
-- non-internal organization via that org's owner_email. Internal staff and
-- platform owners are never touched (they live on the internal org).
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL
     OR to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE '015: organizations/profiles missing — tenant-login promotion skipped';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='is_internal'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='owner_email'
  ) THEN
    UPDATE public.profiles p
    SET role = 'organization_manager'
    FROM public.organizations o
    WHERE p.organization_id = o.id
      AND o.is_internal = false
      AND p.role = 'employee'
      AND lower(p.email) = lower(o.owner_email);
  ELSE
    RAISE NOTICE '015: organizations.is_internal/owner_email missing — promotion skipped';
  END IF;
END $$;

-- ── 5. Per-table: backfill NULLs, enable RLS, drop legacy policies,
--       attach the auto-stamp trigger (resilient: skip missing tables) ──
DO $$
DECLARE
  v_internal UUID;
  t          TEXT;
  pol        RECORD;
  v_tables   TEXT[] := ARRAY[
    'transactions', 'projects', 'activities', 'strategy_phases',
    'board_members', 'automations', 'automation_logs', 'notifications',
    'messages', 'invoices', 'expenses'
  ];
BEGIN
  SELECT id INTO v_internal
  FROM public.organizations
  WHERE is_internal = true
  ORDER BY created_at
  LIMIT 1;

  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE '015: table public.% not found — skipped', t;
      CONTINUE;
    END IF;

    -- 5a. Guard: the column must exist (added in Phase A / 011).
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='organization_id'
    ) THEN
      RAISE NOTICE '015: %.organization_id missing — skipped (re-run migration 011)', t;
      CONTINUE;
    END IF;

    -- 5b. Safety backfill so enforcement never hides existing rows.
    IF v_internal IS NOT NULL THEN
      EXECUTE format(
        'UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', t
      ) USING v_internal;
    END IF;

    -- 5c. RLS on (idempotent).
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- 5d. Drop EVERY existing policy. Critical: a leftover permissive policy
    --     (e.g. legacy "authenticated can read all") is OR-ed with the new
    --     ones and would silently defeat isolation.
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- 5e. (Re)attach the auto-stamp trigger.
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

-- ── 6. Policies (static for reviewability) ─────────────────────────────
-- Bypass branch (every command): owner OR internal super_admin.
-- Tenant branch: organization_id = current_org_id() [AND a write-role gate].
-- organization_manager == board_member confined to a single org.

-- ---- TRANSACTIONS ---------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.transactions') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='transactions' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "transactions: org select" ON public.transactions FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "transactions: org insert" ON public.transactions FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "transactions: org update" ON public.transactions FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "transactions: org delete" ON public.transactions FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ---- PROJECTS -------------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.projects') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='projects' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "projects: org select" ON public.projects FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "projects: org insert" ON public.projects FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager')));
  CREATE POLICY "projects: org update" ON public.projects FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager')));
  CREATE POLICY "projects: org delete" ON public.projects FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','defense_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ---- ACTIVITIES (SELECT org-scoped; INSERT for any same-org member) -------
DO $$ BEGIN IF to_regclass('public.activities') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "activities: org select" ON public.activities FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "activities: org insert" ON public.activities FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  $p$;
END IF; END $$;

-- ---- STRATEGY PHASES ------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.strategy_phases') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='strategy_phases' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "strategy_phases: org select" ON public.strategy_phases FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "strategy_phases: org insert" ON public.strategy_phases FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager')));
  CREATE POLICY "strategy_phases: org update" ON public.strategy_phases FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager')));
  CREATE POLICY "strategy_phases: org delete" ON public.strategy_phases FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ---- BOARD MEMBERS --------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.board_members') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='board_members' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "board_members: org select" ON public.board_members FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "board_members: org insert" ON public.board_members FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')));
  CREATE POLICY "board_members: org update" ON public.board_members FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')));
  CREATE POLICY "board_members: org delete" ON public.board_members FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')));
  $p$;
END IF; END $$;

-- ---- AUTOMATIONS ----------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.automations') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automations' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "automations: org select" ON public.automations FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "automations: org insert" ON public.automations FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','organization_manager')));
  CREATE POLICY "automations: org update" ON public.automations FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','organization_manager')));
  CREATE POLICY "automations: org delete" ON public.automations FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ---- AUTOMATION LOGS ------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.automation_logs') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_logs' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "automation_logs: org select" ON public.automation_logs FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "automation_logs: org insert" ON public.automation_logs FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','organization_manager')));
  CREATE POLICY "automation_logs: org delete" ON public.automation_logs FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')));
  $p$;
END IF; END $$;

-- ---- NOTIFICATIONS (org-scoped AND per-user; writes for any org member) ---
DO $$ BEGIN IF to_regclass('public.notifications') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "notifications: org select" ON public.notifications FOR SELECT
    USING (
      public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND (user_id IS NULL OR user_id = auth.uid()))
    );
  CREATE POLICY "notifications: org insert" ON public.notifications FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  CREATE POLICY "notifications: org update" ON public.notifications FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id())
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  CREATE POLICY "notifications: org delete" ON public.notifications FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  $p$;
END IF; END $$;

-- ---- MESSAGES (SELECT/INSERT/UPDATE for any org member; DELETE bypass) ----
DO $$ BEGIN IF to_regclass('public.messages') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "messages: org select" ON public.messages FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "messages: org insert" ON public.messages FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  CREATE POLICY "messages: org update" ON public.messages FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id())
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR organization_id = public.current_org_id());
  CREATE POLICY "messages: org delete" ON public.messages FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','organization_manager')));
  $p$;
END IF; END $$;

-- ---- INVOICES -------------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.invoices') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "invoices: org select" ON public.invoices FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "invoices: org insert" ON public.invoices FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "invoices: org update" ON public.invoices FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "invoices: org delete" ON public.invoices FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ---- EXPENSES -------------------------------------------------------------
DO $$ BEGIN IF to_regclass('public.expenses') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='expenses' AND column_name='organization_id') THEN
  EXECUTE $p$
  CREATE POLICY "expenses: org select" ON public.expenses FOR SELECT
    USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role()='super_admin');
  CREATE POLICY "expenses: org insert" ON public.expenses FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "expenses: org update" ON public.expenses FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  CREATE POLICY "expenses: org delete" ON public.expenses FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','finance_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ── 7. Refresh Phase B.1 WRITE policies so organization_manager can
--       manage its own org's tasks & clients. SELECT policies from 012
--       already cover org members and are intentionally left untouched. ──
DO $$ BEGIN IF to_regclass('public.tasks') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='organization_id') THEN
  DROP POLICY IF EXISTS "tasks: org insert" ON public.tasks;
  DROP POLICY IF EXISTS "tasks: org update" ON public.tasks;
  DROP POLICY IF EXISTS "tasks: org delete" ON public.tasks;
  EXECUTE $p$
  CREATE POLICY "tasks: org insert" ON public.tasks FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND (public.get_my_role() IN ('board_member','defense_manager','attack_manager','finance_manager','organization_manager')
               OR (public.get_my_role()='employee' AND assignee_id = auth.uid()::text))));
  CREATE POLICY "tasks: org update" ON public.tasks FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND (public.get_my_role() IN ('board_member','defense_manager','attack_manager','finance_manager','organization_manager')
               OR (public.get_my_role()='employee' AND assignee_id = auth.uid()::text))))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND (public.get_my_role() IN ('board_member','defense_manager','attack_manager','finance_manager','organization_manager')
               OR (public.get_my_role()='employee' AND assignee_id = auth.uid()::text))));
  CREATE POLICY "tasks: org delete" ON public.tasks FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','finance_manager','organization_manager')));
  $p$;
END IF; END $$;

DO $$ BEGIN IF to_regclass('public.clients') IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='organization_id') THEN
  DROP POLICY IF EXISTS "clients: org insert" ON public.clients;
  DROP POLICY IF EXISTS "clients: org update" ON public.clients;
  DROP POLICY IF EXISTS "clients: org delete" ON public.clients;
  EXECUTE $p$
  CREATE POLICY "clients: org insert" ON public.clients FOR INSERT
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','organization_manager')));
  CREATE POLICY "clients: org update" ON public.clients FOR UPDATE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','organization_manager')))
    WITH CHECK (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','organization_manager')));
  CREATE POLICY "clients: org delete" ON public.clients FOR DELETE
    USING (public.is_owner() OR public.get_my_role()='super_admin'
      OR (organization_id = public.current_org_id()
          AND public.get_my_role() IN ('board_member','attack_manager','organization_manager')));
  $p$;
END IF; END $$;

-- ============================================================
-- ROLLBACK (run manually to fully revert Phase B.2)
-- ------------------------------------------------------------
-- For each table below, drop its "<t>: org *" policies and the set_org_id
-- trigger, then re-run 002_rls_and_functions.sql + 004_full_schema.sql to
-- restore the previous global policies:
--   transactions, projects, activities, strategy_phases, board_members,
--   automations, automation_logs, notifications, messages, invoices, expenses
-- Also restore the Phase B.1 write policies on tasks/clients by re-running
-- migration 012, and (optionally) revert the role:
--   UPDATE public.profiles SET role='employee' WHERE role='organization_manager';
--   DELETE FROM public.role_permissions WHERE role='organization_manager';
--   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
--   ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--     CHECK (role IN ('super_admin','board_member','defense_manager',
--                     'attack_manager','finance_manager','employee'));
-- No customer data is moved or deleted by this migration.
-- ============================================================
