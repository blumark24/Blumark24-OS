-- ============================================================
-- 021 — TENANT ORG + CRM (consolidated for production / PR #149)
-- Combines 019_tenant_org_structure + 020_tenant_crm_system.
-- Requires: migration 011 (current_org_id). Safe to re-run (IF NOT EXISTS).
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '021 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PART A — ORGANIZATION STRUCTURE (departments, teams, positions, relations)
-- ═══════════════════════════════════════════════════════════════════════════

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

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments: org select" ON public.departments;
CREATE POLICY "departments: org select" ON public.departments FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "departments: org insert" ON public.departments;
CREATE POLICY "departments: org insert" ON public.departments FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

DROP POLICY IF EXISTS "departments: org update" ON public.departments;
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

DROP POLICY IF EXISTS "departments: org delete" ON public.departments;
CREATE POLICY "departments: org delete" ON public.departments FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

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

DROP POLICY IF EXISTS "teams: org update" ON public.teams;
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

DROP POLICY IF EXISTS "teams: org delete" ON public.teams;
CREATE POLICY "teams: org delete" ON public.teams FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

DROP POLICY IF EXISTS "positions: org select" ON public.positions;
CREATE POLICY "positions: org select" ON public.positions FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "positions: org insert" ON public.positions;
CREATE POLICY "positions: org insert" ON public.positions FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

DROP POLICY IF EXISTS "positions: org update" ON public.positions;
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

DROP POLICY IF EXISTS "positions: org delete" ON public.positions;
CREATE POLICY "positions: org delete" ON public.positions FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

DROP POLICY IF EXISTS "employee_relations: org select" ON public.employee_relations;
CREATE POLICY "employee_relations: org select" ON public.employee_relations FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "employee_relations: org insert" ON public.employee_relations;
CREATE POLICY "employee_relations: org insert" ON public.employee_relations FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

DROP POLICY IF EXISTS "employee_relations: org update" ON public.employee_relations;
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

DROP POLICY IF EXISTS "employee_relations: org delete" ON public.employee_relations;
CREATE POLICY "employee_relations: org delete" ON public.employee_relations FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (organization_id = public.current_org_id() AND public.can_manage_tenant_org())
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- PART B — CRM (pipeline, deals, notes, reminders, contracts, activities, revenue)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.can_manage_crm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_owner()
    OR public.get_my_role() IN (
      'super_admin',
      'organization_manager',
      'attack_manager',
      'board_member',
      'defense_manager'
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_crm() TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#22d3ee',
  is_closed_won boolean NOT NULL DEFAULT false,
  is_closed_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_org ON public.crm_pipeline_stages (organization_id);

CREATE TABLE IF NOT EXISTS public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE RESTRICT,
  title text NOT NULL,
  value numeric(14,2) NOT NULL DEFAULT 0,
  expected_close_date date,
  assigned_name text NOT NULL DEFAULT '',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON public.crm_deals (organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_client ON public.crm_deals (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals (stage_id);

CREATE TABLE IF NOT EXISTS public.crm_client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  body text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_client ON public.crm_client_notes (client_id);

CREATE TABLE IF NOT EXISTS public.crm_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_reminders_due ON public.crm_reminders (organization_id, due_at);

CREATE TABLE IF NOT EXISTS public.crm_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  package_type text NOT NULL DEFAULT 'صغيرة',
  contract_value numeric(14,2) NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'مسودة'
    CHECK (status IN ('مسودة', 'نشط', 'منتهي', 'ملغي')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contracts_client ON public.crm_contracts (client_id);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'note'
    CHECK (activity_type IN (
      'note','call','meeting','email','deal','task','reminder','contract','revenue','status','package'
    )),
  title text NOT NULL,
  body text,
  meta jsonb NOT NULL DEFAULT '{}',
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_client ON public.crm_activities (client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.crm_revenue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.crm_contracts(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL,
  event_type text NOT NULL DEFAULT 'payment'
    CHECK (event_type IN ('deal_won','contract','payment','adjustment')),
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_org ON public.crm_revenue_events (organization_id, recorded_at DESC);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_deals','crm_contracts'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%s_updated_at ON public.%I', t, t);
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'crm_pipeline_stages','crm_deals','crm_client_notes','crm_reminders',
    'crm_contracts','crm_activities','crm_revenue_events'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;
END $$;

DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'crm_pipeline_stages','crm_deals','crm_client_notes','crm_reminders',
    'crm_contracts','crm_activities','crm_revenue_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    pol := t || ': org select';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING ('
      || 'organization_id = public.current_org_id() '
      || 'OR public.is_owner() OR public.get_my_role() = ''super_admin'')',
      pol, t
    );

    pol := t || ': org insert';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );

    pol := t || ': org update';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm())) '
      || 'WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );

    pol := t || ': org delete';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_crm()))',
      pol, t
    );
  END LOOP;
END $$;
