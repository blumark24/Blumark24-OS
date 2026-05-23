-- ============================================================
-- 020 — SaaS package engine + org-scoped departments
-- Adds plan_features, departments table, backfill, strategy fix
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '020 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

-- ── plan_features (runtime module toggles per plan) ─────────────────────
CREATE TABLE IF NOT EXISTS public.plan_features (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_features: owner select" ON public.plan_features;
DROP POLICY IF EXISTS "plan_features: owner insert" ON public.plan_features;
DROP POLICY IF EXISTS "plan_features: owner update" ON public.plan_features;
DROP POLICY IF EXISTS "plan_features: owner delete" ON public.plan_features;

CREATE POLICY "plan_features: owner select"
  ON public.plan_features FOR SELECT USING (public.is_owner());
CREATE POLICY "plan_features: owner insert"
  ON public.plan_features FOR INSERT WITH CHECK (public.is_owner());
CREATE POLICY "plan_features: owner update"
  ON public.plan_features FOR UPDATE USING (public.is_owner());
CREATE POLICY "plan_features: owner delete"
  ON public.plan_features FOR DELETE USING (public.is_owner());

-- Tenant sessions may read features for their org's plan (for workspace-context API uses service role;
-- authenticated read allows client-side checks if needed later)
DROP POLICY IF EXISTS "plan_features: tenant read own plan" ON public.plan_features;
CREATE POLICY "plan_features: tenant read own plan"
  ON public.plan_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid()
        AND o.plan_id = plan_features.plan_id
        AND o.deleted_at IS NULL
    )
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

-- Seed plan_features (mirrors PLAN_FEATURES in packageFeatures.ts)
INSERT INTO public.plan_features (plan_id, feature_key)
SELECT p.id, v.feature_key
FROM public.plans p
JOIN (VALUES
  ('basic',    'dashboard'),
  ('basic',    'tasks'),
  ('basic',    'clients'),
  ('basic',    'org'),
  ('basic',    'ai'),
  ('basic',    'reports'),
  ('growth',   'dashboard'),
  ('growth',   'tasks'),
  ('growth',   'clients'),
  ('growth',   'org'),
  ('growth',   'ai'),
  ('growth',   'reports'),
  ('growth',   'employees'),
  ('growth',   'strategy'),
  ('advanced', 'dashboard'),
  ('advanced', 'tasks'),
  ('advanced', 'clients'),
  ('advanced', 'org'),
  ('advanced', 'ai'),
  ('advanced', 'reports'),
  ('advanced', 'employees'),
  ('advanced', 'strategy'),
  ('advanced', 'finance'),
  ('advanced', 'automation')
) AS v(slug, feature_key) ON p.slug = v.slug
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ── departments (org-scoped taxonomy) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  icon            TEXT NOT NULL DEFAULT '',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_org_name_unique
  ON public.departments (organization_id, lower(trim(name)));

CREATE INDEX IF NOT EXISTS departments_organization_id_idx
  ON public.departments (organization_id);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_org_id ON public.departments;
CREATE TRIGGER set_org_id
  BEFORE INSERT ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- Max departments per plan
CREATE OR REPLACE FUNCTION public.org_department_count(p_org_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.departments d
  WHERE d.organization_id = p_org_id AND d.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.max_departments_for_org(p_org_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT pl.limit_value
     FROM public.organizations o
     JOIN public.plan_limits pl ON pl.plan_id = o.plan_id AND pl.limit_key = 'max_departments'
     WHERE o.id = p_org_id
     LIMIT 1),
    1
  );
$$;

CREATE OR REPLACE FUNCTION public.can_insert_department(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.org_department_count(p_org_id) < public.max_departments_for_org(p_org_id);
$$;

GRANT EXECUTE ON FUNCTION public.org_department_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.max_departments_for_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_insert_department(UUID) TO authenticated;

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
      AND public.get_my_role() IN ('organization_manager', 'board_member', 'super_admin')
      AND public.can_insert_department(organization_id)
    )
  );

CREATE POLICY "departments: org update" ON public.departments FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('organization_manager', 'board_member')
    )
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
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('organization_manager', 'board_member')
    )
  );

-- ── Backfill departments from employees.department ──────────────────────
INSERT INTO public.departments (organization_id, name, sort_order)
SELECT DISTINCT e.organization_id, trim(e.department), 0
FROM public.employees e
WHERE e.organization_id IS NOT NULL
  AND trim(COALESCE(e.department, '')) <> ''
ON CONFLICT DO NOTHING;

-- One-time seed for blumark24-internal org from legacy static lists
DO $$
DECLARE
  v_org UUID;
  v_names TEXT[] := ARRAY[
    'الإدارة', 'العمليات', 'المالي', 'الإبداع', 'التصميم', 'الحملات',
    'العملاء CRM', 'المبيعات', 'الشراكات', 'خدمة العملاء', 'المتابعة', 'العلاقات التجارية'
  ];
  v_name TEXT;
  v_ord INTEGER := 0;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = 'blumark24-internal' LIMIT 1;
  IF v_org IS NULL THEN RETURN; END IF;
  FOREACH v_name IN ARRAY v_names LOOP
    v_ord := v_ord + 1;
    INSERT INTO public.departments (organization_id, name, sort_order)
    VALUES (v_org, v_name, v_ord)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ── strategy_phases: scope NULL rows to internal org ────────────────────
DO $$
DECLARE
  v_internal UUID;
BEGIN
  SELECT id INTO v_internal FROM public.organizations WHERE slug = 'blumark24-internal' LIMIT 1;
  IF v_internal IS NULL THEN RETURN; END IF;

  IF to_regclass('public.strategy_phases') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'strategy_phases' AND column_name = 'organization_id'
     ) THEN
    UPDATE public.strategy_phases SET organization_id = v_internal WHERE organization_id IS NULL;
  END IF;
END $$;
