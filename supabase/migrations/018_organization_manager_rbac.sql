-- ============================================================
-- 018 — P1 RBAC: organization_manager role + tenant owner promotion
-- Additive only. Does NOT change RLS policies on clients/tasks/etc.
-- Safe to re-run (idempotent).
-- ============================================================
-- WHAT THIS DOES
--   1. Widens profiles_role_check to include organization_manager.
--   2. Seeds role_permissions for organization_manager (if table exists).
--   3. Promotes مطعم البيك tenant owner to organization_manager (one email).
--
-- WHAT THIS DOES NOT DO
--   • No DROP of data, no unrelated constraints, no owner-table RLS changes.
-- ============================================================

-- ── 1. profiles_role_check — allow organization_manager ───────────────────

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '018 requires public.profiles';
  END IF;

  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE role IS NOT NULL AND role NOT IN (
      'super_admin', 'board_member', 'defense_manager', 'attack_manager',
      'finance_manager', 'employee', 'organization_manager'
    )
  ) THEN
    RAISE EXCEPTION
      '018 aborted: profiles contain roles outside allowed set — fix data before re-run';
  END IF;

  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
      'super_admin', 'board_member', 'defense_manager', 'attack_manager',
      'finance_manager', 'employee', 'organization_manager'
    ));
END $$;

-- ── 2. Default permissions for organization_manager (UI matrix) ───────────

DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NULL THEN
    RAISE NOTICE '018: role_permissions table missing — seed skipped';
    RETURN;
  END IF;

  INSERT INTO public.role_permissions (role, permissions) VALUES
    (
      'organization_manager',
      ARRAY[
        'view_dashboard',
        'view_employees',
        'manage_tasks',
        'manage_clients',
        'manage_finance',
        'manage_reports',
        'manage_board'
      ]
    )
  ON CONFLICT (role) DO UPDATE
    SET permissions = EXCLUDED.permissions;
END $$;

-- ── 3. Tenant owner promotion (مطعم البيك) ──────────────────────────────────

UPDATE public.profiles
SET role = 'organization_manager'
WHERE lower(trim(email)) = lower(trim('blumark.x@gmail.com'))
  AND role IS DISTINCT FROM 'organization_manager';

-- ============================================================
-- VALIDATION (run after apply)
-- ------------------------------------------------------------
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_role_check';
--
-- SELECT email, role, organization_id FROM public.profiles
-- WHERE lower(email) = 'blumark.x@gmail.com';
--
-- SELECT role, permissions FROM public.role_permissions
-- WHERE role = 'organization_manager';
-- ============================================================
-- ROLLBACK (manual)
-- ------------------------------------------------------------
-- UPDATE public.profiles SET role = 'employee'
-- WHERE lower(trim(email)) = lower(trim('blumark.x@gmail.com'));
--
-- DELETE FROM public.role_permissions WHERE role = 'organization_manager';
--
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN (
--     'super_admin','board_member','defense_manager','attack_manager',
--     'finance_manager','employee'
--   ));
-- ============================================================
