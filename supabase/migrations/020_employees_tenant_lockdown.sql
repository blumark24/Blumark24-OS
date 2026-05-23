-- ============================================================
-- 019 — EMPLOYEES TENANT LOCKDOWN (PR #163 blocker)
-- Ensures no legacy permissive policy (e.g. "employees: read"
-- from migration 008) can OR with org-scoped policies and leak
-- cross-tenant rows. Repairs profile/employee org mismatches.
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.employees') IS NULL THEN
    RAISE NOTICE '019: public.employees not found — skipped';
    RETURN;
  END IF;

  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '019 requires public.current_org_id() — apply migration 011 first';
  END IF;

  ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

  -- Drop every policy on employees (legacy "authenticated read all" must not survive).
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'employees'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees', pol.policyname);
  END LOOP;
END $$;

-- Explicit drops for known legacy names (idempotent if loop already removed them).
DROP POLICY IF EXISTS "employees: read"               ON public.employees;
DROP POLICY IF EXISTS "employees: write"              ON public.employees;
DROP POLICY IF EXISTS "employees: authenticated read" ON public.employees;
DROP POLICY IF EXISTS "employees: super_admin write"  ON public.employees;
DROP POLICY IF EXISTS employees_select_policy         ON public.employees;
DROP POLICY IF EXISTS employees_insert_policy         ON public.employees;
DROP POLICY IF EXISTS employees_update_policy         ON public.employees;
DROP POLICY IF EXISTS employees_delete_policy         ON public.employees;

-- Org-scoped policies (same semantics as 012; recreated after full drop).
CREATE POLICY "employees: org select" ON public.employees FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org insert" ON public.employees FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org update" ON public.employees FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employees: org delete" ON public.employees FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

-- Align employee.organization_id with the caller's profile when they share the same id.
UPDATE public.employees e
SET organization_id = p.organization_id
FROM public.profiles p
WHERE e.id = p.id
  AND p.organization_id IS NOT NULL
  AND (e.organization_id IS DISTINCT FROM p.organization_id);
