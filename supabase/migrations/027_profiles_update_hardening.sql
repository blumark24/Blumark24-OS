-- ============================================================
-- 019 — public.profiles UPDATE hardening (C-1 blocker fix)
--
-- PROBLEM
--   Migration 008 created:
--
--     CREATE POLICY "profiles: update"
--       ON public.profiles FOR UPDATE
--       USING (auth.uid() = id OR public.get_my_role() = 'super_admin');
--
--   It has no WITH CHECK clause, and even with one a Postgres RLS
--   WITH CHECK expression cannot compare OLD vs NEW values.  Any
--   authenticated tenant user could therefore update their OWN
--   profiles row and freely set:
--
--     • role                  → self-promotion to 'super_admin'
--     • organization_id       → cross-tenant move / takeover
--     • is_active             → re-activate a disabled account
--     • force_password_change → bypass forced password rotation
--
-- FIX (this migration, idempotent and re-runnable)
--   1. Drop every historical "profiles UPDATE" policy variant.
--   2. Recreate a single "profiles: update" policy with both
--      USING and WITH CHECK that pin the row identity (own row OR
--      super_admin) — matches the existing SELECT semantics.
--   3. Install a BEFORE UPDATE trigger
--      `public.profiles_block_protected_updates` that rejects any
--      change to the four protected columns above unless the caller
--      is either:
--        • the Supabase service_role  (server admin paths), or
--        • a super_admin             (admin user, e.g. /admin panel).
--      Column comparison uses to_jsonb so the trigger is tolerant of
--      environments that have not yet applied 005/010 (force_password_change /
--      organization_id columns missing on legacy envs).
--
-- SCOPE
--   This migration touches ONLY public.profiles.  It does not modify
--   employees, clients, tasks, transactions, projects, automations,
--   messages, notifications, organizations, role_permissions, or any
--   other table.  No other policies are dropped or altered.
--
-- SERVER PATHS THAT MUST KEEP WORKING (all use SUPABASE_SERVICE_ROLE_KEY,
-- which bypasses RLS and is also whitelisted by the trigger):
--   • /api/admin/create-user
--   • /api/admin/update-user
--   • /api/admin/delete-user
--   • /api/auth/clear-force-pw
--   • /api/owner/create-client-login
-- ============================================================

-- ── 0. Guard: table must exist ──────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '019 requires public.profiles (run earlier migrations first)';
  END IF;
END
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── 1. Drop every known historical UPDATE policy variant ────
-- Listed exhaustively so this migration is safe regardless of which
-- previous migrations were applied.  None of these are recreated below
-- except "profiles: update".
DROP POLICY IF EXISTS "profiles: update"                 ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"             ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own no-escalate" ON public.profiles;
DROP POLICY IF EXISTS profiles_update                    ON public.profiles;

-- ── 2. Recreate hardened UPDATE policy (USING + WITH CHECK) ──
-- Identity pin only.  Per-column protection lives in the trigger
-- below because RLS cannot compare OLD vs NEW.
CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING      (auth.uid() = id OR public.get_my_role() = 'super_admin')
  WITH CHECK (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- ── 3. Column-level guard trigger ───────────────────────────
-- SECURITY INVOKER on purpose: we only need auth.role() / auth.uid()
-- as the calling user.  public.get_my_role() is already SECURITY
-- DEFINER (see migration 008) and bypasses RLS internally.
CREATE OR REPLACE FUNCTION public.profiles_block_protected_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_service  boolean := COALESCE(
                             (SELECT auth.role()) = 'service_role',
                             false
                           )
                           OR current_user = 'service_role';
  v_is_super    boolean := COALESCE(public.get_my_role() = 'super_admin', false);
  v_old         jsonb   := to_jsonb(OLD);
  v_new         jsonb   := to_jsonb(NEW);
  v_protected   text[]  := ARRAY['role','organization_id','is_active','force_password_change'];
  v_col         text;
BEGIN
  -- Privileged callers (service_role / super_admin) bypass the column guard.
  IF v_is_service OR v_is_super THEN
    RETURN NEW;
  END IF;

  -- Tenant / non-privileged callers: reject any attempt to mutate a
  -- protected column.  IS DISTINCT FROM treats nulls correctly.  We
  -- skip columns that are missing in either row (legacy schema where
  -- 005/010 has not been applied) to avoid false positives.
  FOREACH v_col IN ARRAY v_protected LOOP
    IF (v_old ? v_col) AND (v_new ? v_col)
       AND (v_old -> v_col) IS DISTINCT FROM (v_new -> v_col) THEN
      RAISE EXCEPTION
        'profiles.% can only be updated by super_admin or service_role', v_col
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_protected_updates ON public.profiles;
CREATE TRIGGER profiles_block_protected_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_block_protected_updates();

-- ============================================================
-- VALIDATION SQL (commented — run manually in Supabase SQL Editor
-- against a non-production project, substituting real UUIDs).
-- Each block rolls back so no data is mutated.
--
-- Inspect installed policies + trigger:
--
--   SELECT polname, polcmd,
--          pg_get_expr(polqual,      polrelid) AS using_expr,
--          pg_get_expr(polwithcheck, polrelid) AS check_expr
--   FROM   pg_policy
--   WHERE  polrelid = 'public.profiles'::regclass
--   ORDER  BY polname;
--
--   SELECT tgname, pg_get_triggerdef(oid)
--   FROM   pg_trigger
--   WHERE  tgrelid = 'public.profiles'::regclass
--     AND  NOT tgisinternal;
--
-- (1) Tenant user CANNOT self-promote to super_admin:
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" =
--     '{"sub":"<tenant_user_uuid>","role":"authenticated"}';
--   DO $$ BEGIN
--     UPDATE public.profiles SET role = 'super_admin'
--      WHERE id = '<tenant_user_uuid>';
--     RAISE EXCEPTION 'TEST FAILED: role escalation was allowed';
--   EXCEPTION WHEN insufficient_privilege THEN
--     RAISE NOTICE 'ok: role escalation blocked';
--   END $$;
--   ROLLBACK;
--
-- (2) Tenant user CANNOT change organization_id:
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" =
--     '{"sub":"<tenant_user_uuid>","role":"authenticated"}';
--   DO $$ BEGIN
--     UPDATE public.profiles SET organization_id = '<other_org_uuid>'
--      WHERE id = '<tenant_user_uuid>';
--     RAISE EXCEPTION 'TEST FAILED: organization_id change was allowed';
--   EXCEPTION WHEN insufficient_privilege THEN
--     RAISE NOTICE 'ok: organization_id change blocked';
--   END $$;
--   ROLLBACK;
--
-- (3) Tenant user CANNOT flip is_active / force_password_change:
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" =
--     '{"sub":"<tenant_user_uuid>","role":"authenticated"}';
--   DO $$ BEGIN
--     UPDATE public.profiles
--        SET is_active = true, force_password_change = false
--      WHERE id = '<tenant_user_uuid>';
--     RAISE EXCEPTION 'TEST FAILED: protected flags were updated';
--   EXCEPTION WHEN insufficient_privilege THEN
--     RAISE NOTICE 'ok: protected flag changes blocked';
--   END $$;
--   ROLLBACK;
--
-- (4) Tenant user CAN update safe fields (name, avatar):
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" =
--     '{"sub":"<tenant_user_uuid>","role":"authenticated"}';
--   UPDATE public.profiles
--      SET name = 'Updated Name', avatar = 'https://example/a.png'
--    WHERE id = '<tenant_user_uuid>';
--   -- Expect: 1 row updated, no exception.
--   ROLLBACK;
--
-- (5) service_role path remains fully functional:
--
--   BEGIN;
--   SET LOCAL ROLE service_role;
--   UPDATE public.profiles SET role = 'super_admin'
--    WHERE id = '<any_uuid>';
--   UPDATE public.profiles SET organization_id = '<any_org_uuid>'
--    WHERE id = '<any_uuid>';
--   UPDATE public.profiles SET is_active = false,
--                                force_password_change = true
--    WHERE id = '<any_uuid>';
--   ROLLBACK;
--
-- (6) super_admin user-side updates remain functional (admin panel
--     calling updateProfileRole / toggleProfileStatus via the
--     supabase-js anon client):
--
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL "request.jwt.claims" =
--     '{"sub":"<super_admin_uuid>","role":"authenticated"}';
--   UPDATE public.profiles SET role = 'employee'
--    WHERE id = '<some_other_uuid>';
--   ROLLBACK;
-- ============================================================
