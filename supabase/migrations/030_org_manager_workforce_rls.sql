-- ============================================================
-- 030 — ORG MANAGER WORKFORCE RLS (required for production /org)
--
-- WHY: Migration 020 allows employees SELECT by org but INSERT/UPDATE only
-- for super_admin/owner. organization_manager could not assign workforce or
-- add employees. profiles SELECT was own-row-only, so tenant team was invisible.
--
-- SCOPE: employees + profiles read within current_org_id() only.
-- Does NOT change CRM, tasks, automation, or other tables.
-- ============================================================

DO $$
BEGIN
  IF to_regclass('public.employees') IS NULL THEN
    RAISE NOTICE '030 skipped: employees missing';
    RETURN;
  END IF;
END $$;

CREATE POLICY "employees: org manager insert" ON public.employees FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'organization_manager'
    AND organization_id = public.current_org_id()
  );

CREATE POLICY "employees: org manager update" ON public.employees FOR UPDATE
  USING (
    public.get_my_role() = 'organization_manager'
    AND organization_id = public.current_org_id()
  )
  WITH CHECK (
    public.get_my_role() = 'organization_manager'
    AND organization_id = public.current_org_id()
  );

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE '030 profiles skipped';
    RETURN;
  END IF;
END $$;

CREATE POLICY "profiles: org manager team select" ON public.profiles FOR SELECT
  USING (
    public.get_my_role() = 'organization_manager'
    AND organization_id = public.current_org_id()
  );
