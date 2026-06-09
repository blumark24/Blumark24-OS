-- 034 - Executive Office room mappings persistence foundation
-- Scope: table, constraints, validation triggers, indexes, and RLS only.
-- No UI/API wiring. Tenant audit logging should be designed separately.

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION '034 requires public.organizations';
  END IF;

  IF to_regclass('public.departments') IS NULL THEN
    RAISE EXCEPTION '034 requires public.departments';
  END IF;

  IF to_regclass('public.teams') IS NULL THEN
    RAISE EXCEPTION '034 requires public.teams';
  END IF;

  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '034 requires public.profiles';
  END IF;

  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '034 requires public.current_org_id()';
  END IF;

  IF to_regprocedure('public.can_manage_tenant_org()') IS NULL THEN
    RAISE EXCEPTION '034 requires public.can_manage_tenant_org()';
  END IF;

  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION '034 requires public.set_updated_at()';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.executive_office_room_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  fixed_room_key text NOT NULL,
  mapped_unit_type text NOT NULL,
  mapped_unit_id uuid NOT NULL,
  display_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT executive_office_room_mappings_fixed_room_key_check
    CHECK (fixed_room_key IN (
      'executive',
      'sales',
      'support',
      'marketing',
      'meetings',
      'finance',
      'execution',
      'ai'
    )),
  CONSTRAINT executive_office_room_mappings_mapped_unit_type_check
    CHECK (mapped_unit_type IN ('agency', 'management', 'department', 'team')),
  CONSTRAINT executive_office_room_mappings_display_name_length_check
    CHECK (display_name IS NULL OR char_length(display_name) <= 120)
);

CREATE UNIQUE INDEX IF NOT EXISTS executive_office_room_mappings_active_room_unique
  ON public.executive_office_room_mappings (organization_id, fixed_room_key)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS executive_office_room_mappings_org_active_idx
  ON public.executive_office_room_mappings (organization_id, is_active);

CREATE INDEX IF NOT EXISTS executive_office_room_mappings_org_room_idx
  ON public.executive_office_room_mappings (organization_id, fixed_room_key);

CREATE INDEX IF NOT EXISTS executive_office_room_mappings_org_unit_idx
  ON public.executive_office_room_mappings (organization_id, mapped_unit_type, mapped_unit_id);

CREATE OR REPLACE FUNCTION public.validate_executive_office_room_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
  v_actor uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'executive office room mappings cannot move between organizations';
  END IF;

  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'executive office room mapping organization_id is required';
  END IF;

  IF NEW.mapped_unit_type IN ('agency', 'management', 'department') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.departments d
      WHERE d.id = NEW.mapped_unit_id
        AND d.organization_id = NEW.organization_id
        AND d.structure_level = NEW.mapped_unit_type
    )
    INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'invalid executive office department mapping: unit must exist in the same organization and match mapped_unit_type';
    END IF;
  ELSIF NEW.mapped_unit_type = 'team' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = NEW.mapped_unit_id
        AND t.organization_id = NEW.organization_id
        AND (
          t.department_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.departments d
            WHERE d.id = t.department_id
              AND d.organization_id = NEW.organization_id
          )
        )
    )
    INTO v_exists;

    IF NOT v_exists THEN
      RAISE EXCEPTION 'invalid executive office team mapping: team must exist in the same organization';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid executive office mapped_unit_type: %', NEW.mapped_unit_type;
  END IF;

  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, v_actor);
    NEW.updated_by := COALESCE(NEW.updated_by, v_actor);
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_by := OLD.created_by;
    NEW.updated_by := COALESCE(v_actor, NEW.updated_by, OLD.updated_by);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_org_id ON public.executive_office_room_mappings;
CREATE TRIGGER set_org_id
  BEFORE INSERT ON public.executive_office_room_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

DROP TRIGGER IF EXISTS set_executive_office_room_mappings_updated_at
  ON public.executive_office_room_mappings;
CREATE TRIGGER set_executive_office_room_mappings_updated_at
  BEFORE UPDATE ON public.executive_office_room_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS validate_executive_office_room_mapping
  ON public.executive_office_room_mappings;
CREATE TRIGGER validate_executive_office_room_mapping
  BEFORE INSERT OR UPDATE ON public.executive_office_room_mappings
  FOR EACH ROW EXECUTE FUNCTION public.validate_executive_office_room_mapping();

CREATE OR REPLACE FUNCTION public.deactivate_executive_office_department_mappings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.executive_office_room_mappings
  SET
    is_active = false,
    updated_at = now()
  WHERE is_active = true
    AND mapped_unit_type IN ('agency', 'management', 'department')
    AND mapped_unit_id = OLD.id
    AND organization_id = OLD.organization_id;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.deactivate_executive_office_team_mappings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.executive_office_room_mappings
  SET
    is_active = false,
    updated_at = now()
  WHERE is_active = true
    AND mapped_unit_type = 'team'
    AND mapped_unit_id = OLD.id
    AND organization_id = OLD.organization_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS deactivate_executive_office_department_mappings
  ON public.departments;
CREATE TRIGGER deactivate_executive_office_department_mappings
  BEFORE DELETE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.deactivate_executive_office_department_mappings();

DROP TRIGGER IF EXISTS deactivate_executive_office_team_mappings
  ON public.teams;
CREATE TRIGGER deactivate_executive_office_team_mappings
  BEFORE DELETE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.deactivate_executive_office_team_mappings();

ALTER TABLE public.executive_office_room_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "executive_office_room_mappings: org select"
  ON public.executive_office_room_mappings;
CREATE POLICY "executive_office_room_mappings: org select"
  ON public.executive_office_room_mappings FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "executive_office_room_mappings: org insert"
  ON public.executive_office_room_mappings;
CREATE POLICY "executive_office_room_mappings: org insert"
  ON public.executive_office_room_mappings FOR INSERT
  WITH CHECK (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
  );

DROP POLICY IF EXISTS "executive_office_room_mappings: org update"
  ON public.executive_office_room_mappings;
CREATE POLICY "executive_office_room_mappings: org update"
  ON public.executive_office_room_mappings FOR UPDATE
  USING (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
  )
  WITH CHECK (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
  );

DROP POLICY IF EXISTS "executive_office_room_mappings: org delete"
  ON public.executive_office_room_mappings;
CREATE POLICY "executive_office_room_mappings: org delete"
  ON public.executive_office_room_mappings FOR DELETE
  USING (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
  );
