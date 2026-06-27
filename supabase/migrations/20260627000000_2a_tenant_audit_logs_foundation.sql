-- 2A — Tenant Audit Logs Foundation
-- Adds public.tenant_audit_logs with strict per-tenant RLS so future
-- org-structure and virtual-office mutations can be logged per
-- organization without misusing the owner-only owner_audit_logs table.
--
-- Scope:
-- - New table + indexes + RLS only.
-- - No UI, API, middleware, or unrelated-table changes.
-- - owner_audit_logs is NOT modified.
-- - Existing tenant-isolation helpers (current_org_id, can_manage_tenant_org,
--   is_owner) are referenced but not redefined.
-- - Idempotent: safe to re-run.

DO $$
BEGIN
  IF to_regclass('public.organizations') IS NULL THEN
    RAISE EXCEPTION '2A requires public.organizations';
  END IF;

  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION '2A requires public.profiles';
  END IF;

  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '2A requires public.current_org_id()';
  END IF;

  IF to_regprocedure('public.can_manage_tenant_org()') IS NULL THEN
    RAISE EXCEPTION '2A requires public.can_manage_tenant_org()';
  END IF;

  IF to_regprocedure('public.is_owner()') IS NULL THEN
    RAISE EXCEPTION '2A requires public.is_owner()';
  END IF;
END $$;

-- ── 1. Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email     text,
  action          text        NOT NULL,
  target_type     text        NOT NULL,
  target_id       uuid,
  metadata        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenant_audit_logs_action_length_check
    CHECK (char_length(action) BETWEEN 1 AND 80),
  CONSTRAINT tenant_audit_logs_target_type_length_check
    CHECK (char_length(target_type) BETWEEN 1 AND 80),
  CONSTRAINT tenant_audit_logs_actor_email_length_check
    CHECK (actor_email IS NULL OR char_length(actor_email) <= 320),
  CONSTRAINT tenant_audit_logs_metadata_is_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS tenant_audit_logs_org_created_at_idx
  ON public.tenant_audit_logs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS tenant_audit_logs_org_action_idx
  ON public.tenant_audit_logs (organization_id, action);

CREATE INDEX IF NOT EXISTS tenant_audit_logs_org_target_idx
  ON public.tenant_audit_logs (organization_id, target_type, target_id);

-- ── 3. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: tenant managers/admins for their own org; platform owner can read all.
DROP POLICY IF EXISTS "tenant_audit_logs: org select"
  ON public.tenant_audit_logs;
CREATE POLICY "tenant_audit_logs: org select"
  ON public.tenant_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (
      organization_id = public.current_org_id()
      AND public.can_manage_tenant_org()
    )
  );

-- INSERT: only tenant managers/admins inserting for their own org.
-- The actor_user_id check prevents impersonation: a caller cannot write a
-- log row claiming another user performed the action.
DROP POLICY IF EXISTS "tenant_audit_logs: org insert"
  ON public.tenant_audit_logs;
CREATE POLICY "tenant_audit_logs: org insert"
  ON public.tenant_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_org_id()
    AND public.can_manage_tenant_org()
    AND (actor_user_id IS NULL OR actor_user_id = auth.uid())
  );

-- No UPDATE policy. No DELETE policy. Rows are immutable.

-- ── 4. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT ON public.tenant_audit_logs TO authenticated;
REVOKE UPDATE, DELETE ON public.tenant_audit_logs FROM authenticated;
