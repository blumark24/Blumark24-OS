-- ============================================================
-- 028 — ORG UNITS PRODUCTION (tenant-scoped hierarchy)
-- Tables: org_units, org_unit_members
-- Backfill from latest ORG_STRUCTURE_JSON per organization (when safe)
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '028 requires public.current_org_id() — apply migration 011 first';
  END IF;
END $$;

-- ── org_units ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES public.org_units(id) ON DELETE CASCADE,
  unit_type       TEXT NOT NULL CHECK (unit_type IN (
    'board', 'agency', 'management', 'department', 'team'
  )),
  name            TEXT NOT NULL,
  description     TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT org_units_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_org_units_organization_id ON public.org_units (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_units_parent_id ON public.org_units (parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_org_type ON public.org_units (organization_id, unit_type);

-- ── org_unit_members ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_unit_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_unit_id     UUID NOT NULL REFERENCES public.org_units(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role_in_unit    TEXT,
  is_manager      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT org_unit_members_has_subject CHECK (
    employee_id IS NOT NULL OR profile_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_unit_members_employee_unit
  ON public.org_unit_members (org_unit_id, employee_id)
  WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_unit_members_org ON public.org_unit_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_org_unit_members_unit ON public.org_unit_members (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_org_unit_members_employee ON public.org_unit_members (employee_id);

-- ── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_units_updated_at ON public.org_units;
CREATE TRIGGER org_units_updated_at
  BEFORE UPDATE ON public.org_units
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS org_unit_members_updated_at ON public.org_unit_members;
CREATE TRIGGER org_unit_members_updated_at
  BEFORE UPDATE ON public.org_unit_members
  FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();

-- ── auto-stamp organization_id ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS set_org_id ON public.org_units;
CREATE TRIGGER set_org_id
  BEFORE INSERT ON public.org_units
  FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

DROP TRIGGER IF EXISTS set_org_id ON public.org_unit_members;
CREATE TRIGGER set_org_id
  BEFORE INSERT ON public.org_unit_members
  FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.org_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_unit_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_units: org select" ON public.org_units;
DROP POLICY IF EXISTS "org_units: org insert" ON public.org_units;
DROP POLICY IF EXISTS "org_units: org update" ON public.org_units;
DROP POLICY IF EXISTS "org_units: org delete" ON public.org_units;

CREATE POLICY "org_units: org select" ON public.org_units FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "org_units: org insert" ON public.org_units FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  );

CREATE POLICY "org_units: org update" ON public.org_units FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR organization_id = public.current_org_id()
  );

CREATE POLICY "org_units: org delete" ON public.org_units FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  );

DROP POLICY IF EXISTS "org_unit_members: org select" ON public.org_unit_members;
DROP POLICY IF EXISTS "org_unit_members: org insert" ON public.org_unit_members;
DROP POLICY IF EXISTS "org_unit_members: org update" ON public.org_unit_members;
DROP POLICY IF EXISTS "org_unit_members: org delete" ON public.org_unit_members;

CREATE POLICY "org_unit_members: org select" ON public.org_unit_members FOR SELECT
  USING (
    organization_id = public.current_org_id()
    OR public.is_owner()
    OR public.get_my_role() = 'super_admin'
  );

CREATE POLICY "org_unit_members: org insert" ON public.org_unit_members FOR INSERT
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  );

CREATE POLICY "org_unit_members: org update" ON public.org_unit_members FOR UPDATE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  )
  WITH CHECK (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR organization_id = public.current_org_id()
  );

CREATE POLICY "org_unit_members: org delete" ON public.org_unit_members FOR DELETE
  USING (
    public.is_owner()
    OR public.get_my_role() = 'super_admin'
    OR (
      organization_id = public.current_org_id()
      AND public.get_my_role() IN ('board_member', 'organization_manager')
    )
  );

-- ── Backfill from ORG_STRUCTURE_JSON (per org, skip if units already exist) ─
DO $$
DECLARE
  org_rec RECORD;
  act_desc TEXT;
  units_json JSONB;
  unit_el JSONB;
  old_id TEXT;
  new_id UUID;
  parent_old TEXT;
  parent_new UUID;
  kind TEXT;
  unit_name TEXT;
  parent_map JSONB;
  inserted_count INT;
  skip_reason TEXT;
  max_units INT := 500;
BEGIN
  IF to_regclass('public.activities') IS NULL THEN
    RAISE NOTICE '028 backfill skipped: activities table missing';
    RETURN;
  END IF;

  FOR org_rec IN
    SELECT DISTINCT organization_id AS oid
    FROM public.activities
    WHERE organization_id IS NOT NULL
      AND description LIKE 'ORG_STRUCTURE_JSON:%'
  LOOP
    IF EXISTS (SELECT 1 FROM public.org_units u WHERE u.organization_id = org_rec.oid LIMIT 1) THEN
      RAISE NOTICE '028 backfill skip org %: org_units already populated', org_rec.oid;
      CONTINUE;
    END IF;

    SELECT a.description INTO act_desc
    FROM public.activities a
    WHERE a.organization_id = org_rec.oid
      AND a.description LIKE 'ORG_STRUCTURE_JSON:%'
    ORDER BY a.timestamp DESC NULLS LAST
    LIMIT 1;

    IF act_desc IS NULL THEN
      CONTINUE;
    END IF;

    BEGIN
      units_json := (substring(act_desc from 20))::jsonb -> 'units';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '028 backfill skip org %: invalid JSON', org_rec.oid;
      CONTINUE;
    END;

    IF units_json IS NULL OR jsonb_typeof(units_json) <> 'array' THEN
      RAISE NOTICE '028 backfill skip org %: units not an array', org_rec.oid;
      CONTINUE;
    END IF;

    IF jsonb_array_length(units_json) > max_units THEN
      RAISE NOTICE '028 backfill skip org %: too many units (%)', org_rec.oid, jsonb_array_length(units_json);
      CONTINUE;
    END IF;

    parent_map := '{}'::jsonb;
    inserted_count := 0;

    -- Pass 1: insert nodes without parent (agencies) and register ids
    FOR unit_el IN SELECT * FROM jsonb_array_elements(units_json)
    LOOP
      kind := unit_el->>'kind';
      IF kind IS NULL OR kind NOT IN ('agency', 'management', 'department', 'team') THEN
        CONTINUE;
      END IF;
      parent_old := unit_el->>'parentId';
      IF parent_old IS NOT NULL AND parent_old <> 'null' THEN
        CONTINUE;
      END IF;
      unit_name := trim(coalesce(unit_el->>'name', ''));
      IF unit_name = '' THEN
        CONTINUE;
      END IF;
      old_id := unit_el->>'id';
      new_id := gen_random_uuid();
      INSERT INTO public.org_units (id, organization_id, parent_id, unit_type, name, metadata)
      VALUES (
        new_id,
        org_rec.oid,
        NULL,
        kind,
        unit_name,
        jsonb_build_object('migrated_from', 'ORG_STRUCTURE_JSON', 'legacy_id', old_id)
      );
      IF old_id IS NOT NULL THEN
        parent_map := parent_map || jsonb_build_object(old_id, new_id::text);
      END IF;
      inserted_count := inserted_count + 1;
    END LOOP;

    -- Pass 2–4: managements, departments, teams (multiple passes for depth)
    FOR pass_i IN 1..5 LOOP
      FOR unit_el IN SELECT * FROM jsonb_array_elements(units_json)
      LOOP
        kind := unit_el->>'kind';
        IF kind IS NULL OR kind NOT IN ('agency', 'management', 'department', 'team') THEN
          CONTINUE;
        END IF;
        old_id := unit_el->>'id';
        IF old_id IS NOT NULL AND parent_map ? old_id THEN
          CONTINUE;
        END IF;
        parent_old := unit_el->>'parentId';
        parent_new := NULL;
        IF parent_old IS NOT NULL AND parent_old <> 'null' AND parent_map ? parent_old THEN
          parent_new := (parent_map->>parent_old)::uuid;
        ELSIF parent_old IS NOT NULL AND parent_old <> 'null' THEN
          CONTINUE;
        END IF;
        unit_name := trim(coalesce(unit_el->>'name', ''));
        IF unit_name = '' THEN
          CONTINUE;
        END IF;
        new_id := gen_random_uuid();
        INSERT INTO public.org_units (id, organization_id, parent_id, unit_type, name, metadata)
        VALUES (
          new_id,
          org_rec.oid,
          parent_new,
          kind,
          unit_name,
          jsonb_build_object('migrated_from', 'ORG_STRUCTURE_JSON', 'legacy_id', old_id)
        );
        IF old_id IS NOT NULL THEN
          parent_map := parent_map || jsonb_build_object(old_id, new_id::text);
        END IF;
        inserted_count := inserted_count + 1;
      END LOOP;
    END LOOP;

  -- Link employees.department text to department units (same org)
    INSERT INTO public.org_unit_members (organization_id, org_unit_id, employee_id, role_in_unit)
    SELECT DISTINCT
      e.organization_id,
      u.id,
      e.id,
      'member'
    FROM public.employees e
    INNER JOIN public.org_units u
      ON u.organization_id = e.organization_id
     AND u.unit_type = 'department'
     AND trim(u.name) = trim(e.department)
    WHERE e.organization_id = org_rec.oid
      AND trim(coalesce(e.department, '')) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM public.org_unit_members m
        WHERE m.employee_id = e.id AND m.org_unit_id = u.id
      );

    RAISE NOTICE '028 backfill org %: inserted % units', org_rec.oid, inserted_count;
  END LOOP;
END $$;
