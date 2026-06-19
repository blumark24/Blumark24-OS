-- ============================================================
-- A1 — PRODUCTION RLS LEGACY POLICY CLEANUP
-- Date: 2026-06-19
-- Scope: Security / Tenant Isolation
--
-- IMPORTANT:
--   This migration is intentionally separated from UI, billing, and feature work.
--   It must be reviewed before applying to production.
--
-- WHY:
--   A live production RLS audit found legacy broad policies such as:
--     - authenticated_read
--     - authenticated_read_automations
--     - authenticated_read_automation_logs
--     - authenticated_read_strategy_phases
--     - authenticated_read_system_settings
--     - authenticated_read_role_permissions
--     - messages: write
--     - activities: insert
--
--   In PostgreSQL RLS, multiple PERMISSIVE policies are OR-ed together.
--   A legacy policy like `auth.role() = 'authenticated'` can silently bypass
--   newer organization-scoped policies that depend on `organization_id`.
--
-- WHAT THIS DOES:
--   1. Drops known legacy broad policies discovered in production.
--   2. Recreates missing org-scoped policies for operational tables where needed.
--   3. Preserves platform-owner and super_admin bypasses.
--   4. Does not delete or mutate business data.
--   5. Does not change UI or customer experience.
--
-- WHAT THIS DOES NOT DO:
--   - Does not touch /ai.
--   - Does not change visual identity.
--   - Does not change billing or plan definitions.
--   - Does not hard-delete any data.
-- ============================================================

-- ── 0. Required security functions ───────────────────────────
DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION 'A1 cleanup requires public.current_org_id()';
  END IF;

  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION 'A1 cleanup requires public.is_owner()';
  END IF;

  IF to_regprocedure('public.get_my_role()') IS NULL THEN
    RAISE EXCEPTION 'A1 cleanup requires public.get_my_role()';
  END IF;
END $$;

-- ── 1. Drop broad legacy policies found in production ─────────
DO $$
BEGIN
  -- activities
  IF to_regclass('public.activities') IS NOT NULL THEN
    DROP POLICY IF EXISTS "activities: insert" ON public.activities;
    DROP POLICY IF EXISTS "authenticated_read" ON public.activities;
    DROP POLICY IF EXISTS "authenticated_read_activities" ON public.activities;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.activities;
    DROP POLICY IF EXISTS "super_admin_all_activities" ON public.activities;
  END IF;

  -- automation_logs
  IF to_regclass('public.automation_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.automation_logs;
    DROP POLICY IF EXISTS "authenticated_read_automation_logs" ON public.automation_logs;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.automation_logs;
    DROP POLICY IF EXISTS "super_admin_all_automation_logs" ON public.automation_logs;
  END IF;

  -- automations
  IF to_regclass('public.automations') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.automations;
    DROP POLICY IF EXISTS "authenticated_read_automations" ON public.automations;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.automations;
    DROP POLICY IF EXISTS "super_admin_all_automations" ON public.automations;
  END IF;

  -- board_members
  IF to_regclass('public.board_members') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.board_members;
    DROP POLICY IF EXISTS "authenticated_read_board_members" ON public.board_members;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.board_members;
    DROP POLICY IF EXISTS "super_admin_all_board_members" ON public.board_members;
  END IF;

  -- messages
  IF to_regclass('public.messages') IS NOT NULL THEN
    DROP POLICY IF EXISTS "messages: write" ON public.messages;
    DROP POLICY IF EXISTS "authenticated_read" ON public.messages;
    DROP POLICY IF EXISTS "authenticated_read_messages" ON public.messages;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.messages;
    DROP POLICY IF EXISTS "super_admin_all_messages" ON public.messages;
  END IF;

  -- profiles — drop all known legacy names AND current names so Step 3 recreates cleanly
  IF to_regclass('public.profiles') IS NOT NULL THEN
    -- legacy camelCase / snake_case variants
    DROP POLICY IF EXISTS "authenticated_read"           ON public.profiles;
    DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
    DROP POLICY IF EXISTS "profiles_insert_own"          ON public.profiles;
    DROP POLICY IF EXISTS "profiles_delete_admin"        ON public.profiles;
    DROP POLICY IF EXISTS "service_role_full_access"     ON public.profiles;
    DROP POLICY IF EXISTS profiles_select                ON public.profiles;
    DROP POLICY IF EXISTS profiles_update                ON public.profiles;
    DROP POLICY IF EXISTS profiles_insert                ON public.profiles;
    DROP POLICY IF EXISTS profiles_delete                ON public.profiles;
    -- current colon-style names (recreated in Step 3)
    DROP POLICY IF EXISTS "profiles: read"               ON public.profiles;
    DROP POLICY IF EXISTS "profiles: select"             ON public.profiles;
    DROP POLICY IF EXISTS "profiles: insert own"         ON public.profiles;
    DROP POLICY IF EXISTS "profiles: insert"             ON public.profiles;
    DROP POLICY IF EXISTS "profiles: update"             ON public.profiles;
    DROP POLICY IF EXISTS "profiles: update own"         ON public.profiles;
    DROP POLICY IF EXISTS "profiles: update own no-escalate" ON public.profiles;
    DROP POLICY IF EXISTS "profiles: delete"             ON public.profiles;
    DROP POLICY IF EXISTS "profiles: owner select"       ON public.profiles;
    DROP POLICY IF EXISTS "profiles: org select"         ON public.profiles;
  END IF;

  -- role_permissions
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.role_permissions;
    DROP POLICY IF EXISTS "authenticated_read_role_permissions" ON public.role_permissions;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.role_permissions;
    DROP POLICY IF EXISTS "super_admin_all_role_permissions" ON public.role_permissions;
  END IF;

  -- strategy_phases
  IF to_regclass('public.strategy_phases') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.strategy_phases;
    DROP POLICY IF EXISTS "authenticated_read_strategy_phases" ON public.strategy_phases;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.strategy_phases;
    DROP POLICY IF EXISTS "super_admin_all_strategy_phases" ON public.strategy_phases;
  END IF;

  -- system_settings
  IF to_regclass('public.system_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "authenticated_read" ON public.system_settings;
    DROP POLICY IF EXISTS "authenticated_read_system_settings" ON public.system_settings;
    DROP POLICY IF EXISTS "service_role_full_access" ON public.system_settings;
    DROP POLICY IF EXISTS "super_admin_all_system_settings" ON public.system_settings;
  END IF;
END $$;

-- ── 2. Ensure RLS stays enabled ───────────────────────────────
DO $$
DECLARE
  t TEXT;
  v_tables TEXT[] := ARRAY[
    'activities',
    'automation_logs',
    'automations',
    'board_members',
    'messages',
    'profiles',
    'role_permissions',
    'strategy_phases',
    'system_settings'
  ];
BEGIN
  FOREACH t IN ARRAY v_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- ── 3. Recreate org-scoped policies where production was missing them ───

-- ACTIVITIES
DO $$
BEGIN
  IF to_regclass('public.activities') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='activities' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "activities: org select" ON public.activities;
    DROP POLICY IF EXISTS "activities: org insert" ON public.activities;
    DROP POLICY IF EXISTS "activities: org update" ON public.activities;
    DROP POLICY IF EXISTS "activities: org delete" ON public.activities;

    CREATE POLICY "activities: org select" ON public.activities FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "activities: org insert" ON public.activities FOR INSERT
      WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id());

    CREATE POLICY "activities: org update" ON public.activities FOR UPDATE
      USING (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id())
      WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id());

    CREATE POLICY "activities: org delete" ON public.activities FOR DELETE
      USING (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id());
  END IF;
END $$;

-- BOARD MEMBERS
DO $$
BEGIN
  IF to_regclass('public.board_members') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='board_members' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "board_members: org select" ON public.board_members;
    DROP POLICY IF EXISTS "board_members: org insert" ON public.board_members;
    DROP POLICY IF EXISTS "board_members: org update" ON public.board_members;
    DROP POLICY IF EXISTS "board_members: org delete" ON public.board_members;

    CREATE POLICY "board_members: org select" ON public.board_members FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "board_members: org insert" ON public.board_members FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      );

    CREATE POLICY "board_members: org update" ON public.board_members FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      );

    CREATE POLICY "board_members: org delete" ON public.board_members FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      );
  END IF;
END $$;

-- AUTOMATIONS
DO $$
BEGIN
  IF to_regclass('public.automations') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='automations' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "automations: org select" ON public.automations;
    DROP POLICY IF EXISTS "automations: org insert" ON public.automations;
    DROP POLICY IF EXISTS "automations: org update" ON public.automations;
    DROP POLICY IF EXISTS "automations: org delete" ON public.automations;

    CREATE POLICY "automations: org select" ON public.automations FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "automations: org insert" ON public.automations FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','organization_manager'))
      );

    CREATE POLICY "automations: org update" ON public.automations FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','organization_manager'))
      );

    CREATE POLICY "automations: org delete" ON public.automations FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','organization_manager'))
      );
  END IF;
END $$;

-- AUTOMATION LOGS
DO $$
BEGIN
  IF to_regclass('public.automation_logs') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='automation_logs' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "automation_logs: org select" ON public.automation_logs;
    DROP POLICY IF EXISTS "automation_logs: org insert" ON public.automation_logs;
    DROP POLICY IF EXISTS "automation_logs: org delete" ON public.automation_logs;

    CREATE POLICY "automation_logs: org select" ON public.automation_logs FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "automation_logs: org insert" ON public.automation_logs FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','organization_manager'))
      );

    CREATE POLICY "automation_logs: org delete" ON public.automation_logs FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      );
  END IF;
END $$;

-- STRATEGY PHASES
DO $$
BEGIN
  IF to_regclass('public.strategy_phases') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='strategy_phases' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "strategy_phases: org select" ON public.strategy_phases;
    DROP POLICY IF EXISTS "strategy_phases: org insert" ON public.strategy_phases;
    DROP POLICY IF EXISTS "strategy_phases: org update" ON public.strategy_phases;
    DROP POLICY IF EXISTS "strategy_phases: org delete" ON public.strategy_phases;

    CREATE POLICY "strategy_phases: org select" ON public.strategy_phases FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "strategy_phases: org insert" ON public.strategy_phases FOR INSERT
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );

    CREATE POLICY "strategy_phases: org update" ON public.strategy_phases FOR UPDATE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      )
      WITH CHECK (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );

    CREATE POLICY "strategy_phases: org delete" ON public.strategy_phases FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','defense_manager','attack_manager','organization_manager'))
      );
  END IF;
END $$;

-- MESSAGES
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name='messages' AND column_name='organization_id'
     ) THEN
    DROP POLICY IF EXISTS "messages: org select" ON public.messages;
    DROP POLICY IF EXISTS "messages: org insert" ON public.messages;
    DROP POLICY IF EXISTS "messages: org update" ON public.messages;
    DROP POLICY IF EXISTS "messages: org delete" ON public.messages;

    CREATE POLICY "messages: org select" ON public.messages FOR SELECT
      USING (organization_id = public.current_org_id() OR public.is_owner() OR public.get_my_role() = 'super_admin');

    CREATE POLICY "messages: org insert" ON public.messages FOR INSERT
      WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id());

    CREATE POLICY "messages: org update" ON public.messages FOR UPDATE
      USING (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id())
      WITH CHECK (public.is_owner() OR public.get_my_role() = 'super_admin' OR organization_id = public.current_org_id());

    CREATE POLICY "messages: org delete" ON public.messages FOR DELETE
      USING (
        public.is_owner()
        OR public.get_my_role() = 'super_admin'
        OR (organization_id = public.current_org_id() AND public.get_my_role() IN ('board_member','organization_manager'))
      );
  END IF;
END $$;

-- SYSTEM SETTINGS
-- Keep read/write restricted to platform owner or super_admin/board_member only.
DO $$
BEGIN
  IF to_regclass('public.system_settings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "system_settings: read" ON public.system_settings;
    DROP POLICY IF EXISTS "system_settings: write" ON public.system_settings;

    CREATE POLICY "system_settings: owner read" ON public.system_settings FOR SELECT
      USING (public.is_owner() OR public.get_my_role() IN ('super_admin','board_member'));

    CREATE POLICY "system_settings: owner write" ON public.system_settings FOR ALL
      USING (public.is_owner() OR public.get_my_role() IN ('super_admin','board_member'))
      WITH CHECK (public.is_owner() OR public.get_my_role() IN ('super_admin','board_member'));
  END IF;
END $$;

-- ROLE PERMISSIONS
-- This table is not tenant data, but broad duplicate policies are removed.
-- Keep read access for authenticated users so customer RBAC can still load permissions.
DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "role_permissions: read" ON public.role_permissions;
    DROP POLICY IF EXISTS "role_permissions: write" ON public.role_permissions;

    CREATE POLICY "role_permissions: read" ON public.role_permissions FOR SELECT
      USING (auth.role() = 'authenticated');

    CREATE POLICY "role_permissions: owner write" ON public.role_permissions FOR ALL
      USING (public.is_owner() OR public.get_my_role() IN ('super_admin','board_member'))
      WITH CHECK (public.is_owner() OR public.get_my_role() IN ('super_admin','board_member'));
  END IF;
END $$;

-- PROFILES
-- SELECT: own row, or same-org coworker (needed for employee lists), or owner/super_admin.
-- INSERT: only own uid (Supabase creates the row on sign-up via trigger; direct insert must match uid).
-- UPDATE: own row or super_admin; both USING and WITH CHECK prevent self-escalation at the SQL layer.
--         A trigger (profiles_block_protected_updates) enforces column-level guards independently.
-- DELETE: super_admin or owner only.
-- No broad `auth.role() = 'authenticated'` clause anywhere.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
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

    CREATE POLICY "profiles: insert own"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    CREATE POLICY "profiles: update"
      ON public.profiles FOR UPDATE
      USING      (auth.uid() = id OR public.get_my_role() IN ('super_admin') OR public.is_owner())
      WITH CHECK (auth.uid() = id OR public.get_my_role() IN ('super_admin') OR public.is_owner());

    CREATE POLICY "profiles: delete"
      ON public.profiles FOR DELETE
      USING (public.get_my_role() = 'super_admin' OR public.is_owner());

    CREATE POLICY "profiles: owner select"
      ON public.profiles FOR SELECT
      USING (public.is_owner());
  END IF;
END $$;

-- ── 4. Verification helper output ─────────────────────────────
-- Run these two read-only queries after applying:
--
-- QUERY A — legacy policies must be gone (expect zero rows):
--
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname='public'
--   AND (
--     policyname IN (
--       'authenticated_read',
--       'authenticated_read_automations',
--       'authenticated_read_automation_logs',
--       'authenticated_read_strategy_phases',
--       'authenticated_read_system_settings',
--       'authenticated_read_role_permissions',
--       'messages: write',
--       'activities: insert',
--       'profiles_select_own_or_admin',
--       'profiles_update_own_or_admin',
--       'profiles_insert_own',
--       'profiles_delete_admin'
--     )
--     OR policyname LIKE 'super_admin_all_%'
--     OR policyname = 'service_role_full_access'
--   )
-- ORDER BY tablename, policyname;
--
-- Expected: zero rows.
--
-- QUERY B — profiles replacement policies must exist (expect 5 rows):
--
-- SELECT policyname, cmd
-- FROM pg_policies
-- WHERE schemaname='public' AND tablename='profiles'
-- ORDER BY policyname;
--
-- Expected rows:
--   policyname              | cmd
--   ------------------------+--------
--   profiles: delete        | DELETE
--   profiles: insert own    | INSERT
--   profiles: owner select  | SELECT
--   profiles: select        | SELECT
--   profiles: update        | UPDATE
-- ============================================================
