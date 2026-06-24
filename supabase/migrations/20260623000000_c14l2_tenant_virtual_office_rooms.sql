-- C14-L2: 9 Tenant Virtual Office Rooms
-- Creates tenant_virtual_office_rooms table: persistent 9-office state per org.
-- Extends executive_office_room_mappings to accept "board" and "meetings" keys.
-- RLS: tenants see only their own rows; only manager/admin can write.

-- ── 1. Extend room key constraint on executive_office_room_mappings ──────────

DO $$
BEGIN
  -- Drop the old 8-key constraint and replace with 9-key version.
  -- The new keys are "board" (replaces meetings at center) and "meetings" (9th).
  ALTER TABLE public.executive_office_room_mappings
    DROP CONSTRAINT IF EXISTS executive_office_room_mappings_fixed_room_key_check;

  ALTER TABLE public.executive_office_room_mappings
    ADD CONSTRAINT executive_office_room_mappings_fixed_room_key_check
    CHECK (fixed_room_key IN (
      'executive', 'sales', 'support', 'marketing',
      'board',
      'finance', 'execution', 'ai',
      'meetings'
    ));
END $$;

-- ── 2. Create tenant_virtual_office_rooms ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_virtual_office_rooms (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  room_key        text        NOT NULL,
  room_number     int         NOT NULL,
  display_name    text        NOT NULL,
  is_board        boolean     NOT NULL DEFAULT false,
  is_reserved     boolean     NOT NULL DEFAULT false,
  is_open         boolean     NOT NULL DEFAULT true,
  created_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenant_virtual_office_rooms_room_key_check
    CHECK (room_key IN (
      'executive', 'sales', 'support', 'marketing',
      'board',
      'finance', 'execution', 'ai',
      'meetings'
    )),
  CONSTRAINT tenant_virtual_office_rooms_room_number_check
    CHECK (room_number BETWEEN 1 AND 9),
  CONSTRAINT tenant_virtual_office_rooms_display_name_length
    CHECK (char_length(display_name) BETWEEN 1 AND 120)
);

-- One row per (org, key) and one row per (org, number)
CREATE UNIQUE INDEX IF NOT EXISTS tenant_virtual_office_rooms_org_key_unique
  ON public.tenant_virtual_office_rooms (organization_id, room_key);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_virtual_office_rooms_org_number_unique
  ON public.tenant_virtual_office_rooms (organization_id, room_number);

CREATE INDEX IF NOT EXISTS tenant_virtual_office_rooms_org_idx
  ON public.tenant_virtual_office_rooms (organization_id);

-- updated_at trigger
DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS set_tenant_virtual_office_rooms_updated_at
      ON public.tenant_virtual_office_rooms;
    CREATE TRIGGER set_tenant_virtual_office_rooms_updated_at
      BEFORE UPDATE ON public.tenant_virtual_office_rooms
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenant_virtual_office_rooms ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own org's rooms
DROP POLICY IF EXISTS "virtual_office_rooms: org select"
  ON public.tenant_virtual_office_rooms;
CREATE POLICY "virtual_office_rooms: org select"
  ON public.tenant_virtual_office_rooms
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );

-- Only managers/admins can insert
DROP POLICY IF EXISTS "virtual_office_rooms: manager insert"
  ON public.tenant_virtual_office_rooms;
CREATE POLICY "virtual_office_rooms: manager insert"
  ON public.tenant_virtual_office_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    AND (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ) IN ('organization_manager', 'super_admin')
  );

-- Only managers/admins can update
DROP POLICY IF EXISTS "virtual_office_rooms: manager update"
  ON public.tenant_virtual_office_rooms;
CREATE POLICY "virtual_office_rooms: manager update"
  ON public.tenant_virtual_office_rooms
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    AND (
      SELECT p.role
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ) IN ('organization_manager', 'super_admin')
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
  );

-- No delete policy: rooms are permanent per org (soft-delete via is_open)
