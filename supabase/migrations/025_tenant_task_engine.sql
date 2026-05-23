-- ============================================================
-- 025 — TENANT TASK OPERATING ENGINE
-- Extends tasks + comments, attachments, automation triggers. Tenant RLS.
-- ============================================================

DO $$
BEGIN
  IF to_regprocedure('public.current_org_id()') IS NULL THEN
    RAISE EXCEPTION '021 requires public.current_org_id() — apply migration 011 first';
  END IF;
  IF to_regclass('public.departments') IS NULL THEN
    RAISE EXCEPTION '021 requires migration 019 (departments)';
  END IF;
END $$;

-- ── Permission helper ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_manage_tasks()
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
      'board_member',
      'defense_manager',
      'attack_manager',
      'finance_manager'
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_tasks() TO authenticated;

-- ── Extend tasks ──────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_by_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recurrence_rule jsonb,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kanban_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notify_assignee boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks (department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON public.tasks (team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks (organization_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON public.tasks (recurrence_parent_id);

-- Backfill due_at from due_date where missing
UPDATE public.tasks
SET due_at = (due_date::timestamptz AT TIME ZONE 'Asia/Riyadh')
WHERE due_at IS NULL AND due_date IS NOT NULL;

-- ── Task comments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments (task_id);

-- ── Task attachments (metadata; files in storage bucket task-attachments) ───
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_by_id text NOT NULL DEFAULT '',
  uploaded_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON public.task_attachments (task_id);

-- ── Per-tenant task automation triggers ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_automation_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  event_type text NOT NULL DEFAULT 'task_created'
    CHECK (event_type IN (
      'task_created', 'task_completed', 'task_overdue',
      'task_assigned', 'status_changed', 'comment_added'
    )),
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_triggers_org ON public.task_automation_triggers (organization_id);

-- ── Triggers: org stamp + updated_at ──────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['task_comments', 'task_attachments', 'task_automation_triggers'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER set_org_id BEFORE INSERT ON public.%I '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_current_org_id()', t
    );
  END LOOP;

  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS set_task_triggers_updated_at ON public.task_automation_triggers';
    EXECUTE
      'CREATE TRIGGER set_task_triggers_updated_at BEFORE UPDATE ON public.task_automation_triggers '
      || 'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;
END $$;

-- ── RLS on satellite tables ───────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY['task_comments', 'task_attachments', 'task_automation_triggers'] LOOP
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
      || 'OR (organization_id = public.current_org_id() AND ('
      || 'public.can_manage_tasks() OR public.get_my_role() = ''employee''))',
      pol, t
    );

    pol := t || ': org update';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_tasks())) '
      || 'WITH CHECK ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_tasks()))',
      pol, t
    );

    pol := t || ': org delete';
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING ('
      || 'public.is_owner() OR public.get_my_role() = ''super_admin'' '
      || 'OR (organization_id = public.current_org_id() AND public.can_manage_tasks()))',
      pol, t
    );
  END LOOP;
END $$;

-- Employees may insert comments on tasks they can see (assignee or org member)
DO $$
BEGIN
  IF to_regclass('public.task_comments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "task_comments: employee insert" ON public.task_comments;
    CREATE POLICY "task_comments: employee insert" ON public.task_comments
      FOR INSERT WITH CHECK (
        organization_id = public.current_org_id()
        AND EXISTS (
          SELECT 1 FROM public.tasks tk
          WHERE tk.id = task_id
            AND tk.organization_id = public.current_org_id()
            AND (
              public.can_manage_tasks()
              OR tk.assignee_id = auth.uid()::text
            )
        )
      );
  END IF;
END $$;
