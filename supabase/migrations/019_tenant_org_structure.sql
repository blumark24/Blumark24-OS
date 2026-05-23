-- ============================================================
-- 019 — TENANT ORGANIZATION STRUCTURE (departments, teams, positions, relations)
-- Additive. Tenant-isolated via organization_id + RLS.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '019 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

-- ── Helper: who may manage tenant org structure ─────────────────────────────
CREATE OR REPLACE FUNCTION public.can_manage_tenant_org()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR public.get_my_role() = 'organization_manager'
    OR public.get_my_role() = 'board_member';
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_tenant_org() TO authenticated;

-- ── departments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT '#22d3ee',
  icon text NOT NULL DEFAULT 'Building2',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments (organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.departments (parent_id);

-- ── teams ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  color text NOT NULL DEFAULT '#1e6fd9',
  icon text NOT NULL DEFAULT 'Users',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_org ON public.teams (organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_dept ON public.teams (department_id);

-- ── positions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  title text NOT NULL,
  title_ar text,
  level integer NOT NULL DEFAULT 0,
  permissions text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_positions_org ON public.positions (organization_id);
CREATE INDEX IF NOT EXISTS idx_positions_parent ON public.positions (parent_id);

-- ── employee_relations ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_relations_employee_org_unique UNIQUE (organization_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_relations_org ON public.employee_relations (organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_relations_emp ON public.employee_relations (employee_id);

-- ── updated_at triggers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments', 'teams', 'positions', 'employee_relations'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t
    );
  END LOOP;
END $$;

-- ── org_id auto-stamp on insert ─────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['departments', 'teams', 'positions', 'employee_relations'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_relations ENABLE ROW LEVEL SECURITY;

-- departments
DROP POLICY IF EXISTS "departments: org select" ON public.departments;
CREATE POLICY "departments: org select" ON public.departments FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "departments: org write" ON public.departments;
CREATE POLICY "departments: org insert" ON public.departments FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
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
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "departments: org delete" ON public.departments FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

-- teams
DROP POLICY IF EXISTS "teams: org select" ON public.teams;
CREATE POLICY "teams: org select" ON public.teams FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "teams: org insert" ON public.teams;
CREATE POLICY "teams: org insert" ON public.teams FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "teams: org update" ON public.teams FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "teams: org delete" ON public.teams FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

-- positions
DROP POLICY IF EXISTS "positions: org select" ON public.positions;
CREATE POLICY "positions: org select" ON public.positions FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "positions: org insert" ON public.positions FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "positions: org update" ON public.positions FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "positions: org delete" ON public.positions FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

-- employee_relations
DROP POLICY IF EXISTS "employee_relations: org select" ON public.employee_relations;
CREATE POLICY "employee_relations: org select" ON public.employee_relations FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "employee_relations: org insert" ON public.employee_relations FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "employee_relations: org update" ON public.employee_relations FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

CREATE POLICY "employee_relations: org delete" ON public.employee_relations FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );
