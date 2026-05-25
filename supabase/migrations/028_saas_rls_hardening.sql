-- ============================================================
-- 028 — SaaS RLS hardening (production safety for PR #164)
-- Idempotent. Uses format() for all dynamic DDL.
-- Drops legacy permissive policies; reasserts org-scoped tenant isolation.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '028 requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION '028 requires public.is_owner() — apply migration 009 first';
  END IF;
END $$;

-- ── 1. departments: ensure 019+020 column compatibility ───────────────────
DO $$
BEGIN
  IF to_regclass('public.departments') IS NOT NULL THEN
    ALTER TABLE public.departments
      ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
    ALTER TABLE public.departments
      ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
    ALTER TABLE public.departments
      ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ── 2. Drop legacy permissive / unsafe policies (by known names) ─────────
DO $$
DECLARE
  pol RECORD;
  legacy_names text[] := ARRAY[
    'profiles: read', 'employees: read', 'employees: authenticated read',
    'employees: write', 'clients: read', 'clients: write',
    'tasks: read', 'tasks: authenticated write', 'tasks: admin write',
    'tasks: employee write', 'tasks: employee update own',
    'transactions: read', 'transactions: write',
    'board_members: read', 'board_members: write',
    'board_members: authenticated read', 'board_members: admin write',
    'projects: read', 'projects: write',
    'activities: read', 'activities: write',
    'strategy_phases: read', 'strategy_phases: write',
    'automations: read', 'automations: write',
    'automation_logs: read', 'automation_logs: write',
    'notifications: read', 'notifications: write',
    'messages: read', 'messages: insert', 'messages: update', 'messages: delete',
    'messages: authenticated read', 'messages: authenticated write',
    'departments: org write'
  ];
  t text;
  n text;
BEGIN
  FOREACH n IN ARRAY legacy_names LOOP
    FOR pol IN
      SELECT c.relname AS tablename
      FROM pg_policy p
      JOIN pg_class c ON c.oid = p.polrelid
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      WHERE ns.nspname = 'public' AND p.polname = n
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', n, pol.tablename);
    END LOOP;
  END LOOP;

  -- Drop policies whose names match unsafe patterns
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname ILIKE '%\_all\_authenticated%' ESCAPE '\'
        OR policyname ILIKE '%authenticated\_write%' ESCAPE '\'
        OR policyname ILIKE '%authenticated read%'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      pol.policyname,
      pol.tablename
    );
  END LOOP;
END $$;

-- ── 3. Enable RLS on tenant tables (format()-safe dynamic DDL) ────────────
DO $$
DECLARE
  t text;
  v_tables text[] := ARRAY[
    'profiles', 'employees', 'tasks', 'clients', 'projects', 'transactions',
    'departments', 'teams', 'positions', 'employee_relations',
    'notifications', 'messages', 'automations', 'automation_logs',
    'board_members', 'strategy_phases', 'tenant_workspace_settings',
    'activities', 'invoices', 'expenses'
  ];
BEGIN
  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ── 4. profiles: org-scoped SELECT (+ own row / owner / super_admin) ──────
DROP POLICY IF EXISTS "profiles: select" ON public.profiles;
DROP POLICY IF EXISTS "profiles: org select" ON public.profiles;

CREATE POLICY "profiles: select"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id IS NOT NULL
      AND organization_id = public.current_org_id()
    )
  );

-- ── 5. departments: unify on can_manage_tenant_org() ────────────────────
DO $$
BEGIN
  IF to_regclass('public.departments') IS NULL THEN RETURN; END IF;

  IF to_regprocedure('public.can_manage_tenant_org()') IS NULL THEN
    CREATE OR REPLACE FUNCTION public.can_manage_tenant_org()
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $fn$
      SELECT
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR public.get_my_role() = 'organization_manager'
        OR public.get_my_role() = 'board_member';
    $fn$;
  END IF;

  DROP POLICY IF EXISTS "departments: org select" ON public.departments;
  DROP POLICY IF EXISTS "departments: org insert" ON public.departments;
  DROP POLICY IF EXISTS "departments: org update" ON public.departments;
  DROP POLICY IF EXISTS "departments: org delete" ON public.departments;

  CREATE POLICY "departments: org select" ON public.departments FOR SELECT
    USING (
      organization_id = public.current_org_id()
      OR public.is_owner()
      OR public.get_my_role() = 'super_admin'
    );

  CREATE POLICY "departments: org insert" ON public.departments FOR INSERT
    WITH CHECK (
      public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR (
        organization_id = public.current_org_id()
        AND public.can_manage_tenant_org()
        AND (
          to_regprocedure('public.can_insert_department(uuid)') IS NULL
          OR public.can_insert_department(organization_id)
        )
      )
    );

  CREATE POLICY "departments: org update" ON public.departments FOR UPDATE
    USING (
      public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
    )
    WITH CHECK (
      public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR organization_id = public.current_org_id()
    );

  CREATE POLICY "departments: org delete" ON public.departments FOR DELETE
    USING (
      public.is_owner()
      OR public.get_my_role() = 'super_admin'
      OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
    );
END $$;

-- ── 6. plan_limits: tenant read (mirrors plan_features in 020) ────────────
DO $$
BEGIN
  IF to_regclass('public.plan_limits') IS NULL THEN RETURN; END IF;

  DROP POLICY IF EXISTS "plan_limits: tenant read own plan" ON public.plan_limits;
  CREATE POLICY "plan_limits: tenant read own plan"
    ON public.plan_limits FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.profiles p ON p.organization_id = o.id
        WHERE p.id = auth.uid()
          AND o.plan_id = plan_limits.plan_id
          AND o.deleted_at IS NULL
      )
      OR public.is_owner()
      OR public.get_my_role() = 'super_admin'
    );
END $$;

-- ── 7. Secure SECURITY DEFINER helpers (no anon/public execute) ───────────
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'current_org_id()',
    'set_current_org_id()',
    'is_owner()',
    'get_my_role()',
    'can_manage_tenant_org()',
    'handle_new_user()',
    'org_department_count(uuid)',
    'max_departments_for_org(uuid)',
    'can_insert_department(uuid)',
    'current_org_is_internal()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    IF to_regprocedure('public.' || fn) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
    END IF;
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_tenant_org() TO authenticated;

DO $$
BEGIN
  IF to_regprocedure('public.org_department_count(uuid)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.org_department_count(uuid) TO authenticated;
  END IF;
  IF to_regprocedure('public.max_departments_for_org(uuid)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.max_departments_for_org(uuid) TO authenticated;
  END IF;
  IF to_regprocedure('public.can_insert_department(uuid)') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.can_insert_department(uuid) TO authenticated;
  END IF;
END $$;

-- is_internal bypass removed from tenant UI — do not expose to authenticated
REVOKE ALL ON FUNCTION public.current_org_is_internal() FROM authenticated;

-- ── 8. organizations: ensure every org has plan_id fallback ───────────────
DO $$
DECLARE
  v_basic uuid;
BEGIN
  SELECT id INTO v_basic FROM public.plans WHERE slug = 'basic' LIMIT 1;
  IF v_basic IS NULL THEN RETURN; END IF;

  UPDATE public.organizations
  SET plan_id = v_basic
  WHERE plan_id IS NULL
    AND deleted_at IS NULL;
END $$;
