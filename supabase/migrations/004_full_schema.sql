-- ============================================================
-- MIGRATION 004: FULL SAFE SCHEMA
-- Creates ALL required tables (IF NOT EXISTS) and re-applies
-- all RLS policies.  Safe to run on a fresh Supabase project
-- OR on top of an existing one.  Every DROP/CREATE is guarded.
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. HELPER FUNCTION: get_my_role()
--    Returns the caller's role from the profiles table.
--    Used in every USING(...) policy expression.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (mirrors auth.users — created by trigger)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL DEFAULT '',
  name        TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'employee',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  department  TEXT        NOT NULL DEFAULT '',
  avatar      TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: read"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles: update" ON public.profiles;

CREATE POLICY "profiles: read"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "profiles: insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'department', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. EMPLOYEES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  email           TEXT        NOT NULL UNIQUE,
  role            TEXT        NOT NULL DEFAULT 'employee',
  department      TEXT        NOT NULL DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'نشط',
  join_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  performance     INTEGER     NOT NULL DEFAULT 3 CHECK (performance BETWEEN 1 AND 5),
  phone           TEXT,
  tasks           INTEGER     NOT NULL DEFAULT 0,
  completed_tasks INTEGER     NOT NULL DEFAULT 0,
  avatar          TEXT,
  salary          NUMERIC(12,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees: read"  ON public.employees;
DROP POLICY IF EXISTS "employees: write" ON public.employees;

CREATE POLICY "employees: read"
  ON public.employees FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "employees: write"
  ON public.employees FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager','attack_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 3. CLIENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  phone                TEXT        NOT NULL DEFAULT '',
  business_type        TEXT        NOT NULL DEFAULT '',
  city                 TEXT        NOT NULL DEFAULT '',
  package_type         TEXT        NOT NULL DEFAULT 'صغيرة',
  contract_value       NUMERIC(14,2) NOT NULL DEFAULT 0,
  status               TEXT        NOT NULL DEFAULT 'محتمل',
  account_manager_id   TEXT        NOT NULL DEFAULT '',
  account_manager_name TEXT        NOT NULL DEFAULT '',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients: read"  ON public.clients;
DROP POLICY IF EXISTS "clients: write" ON public.clients;

CREATE POLICY "clients: read"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clients: write"
  ON public.clients FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','attack_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 4. TASKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  status          TEXT        NOT NULL DEFAULT 'جديدة',
  priority        TEXT        NOT NULL DEFAULT 'متوسطة',
  assignee_id     TEXT        NOT NULL DEFAULT '',
  assignee_name   TEXT        NOT NULL DEFAULT '',
  assignee_avatar TEXT,
  client_id       TEXT,
  client_name     TEXT,
  due_date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: read"              ON public.tasks;
DROP POLICY IF EXISTS "tasks: write"             ON public.tasks;
DROP POLICY IF EXISTS "tasks: authenticated write" ON public.tasks;
DROP POLICY IF EXISTS "tasks: admin write"       ON public.tasks;
DROP POLICY IF EXISTS "tasks: employee write"    ON public.tasks;
DROP POLICY IF EXISTS "tasks: employee update own" ON public.tasks;

CREATE POLICY "tasks: read"
  ON public.tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tasks: admin write"
  ON public.tasks FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager','attack_manager','finance_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

CREATE POLICY "tasks: employee write"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'employee'
    AND assignee_id = auth.uid()::text
  );

CREATE POLICY "tasks: employee update own"
  ON public.tasks FOR UPDATE
  USING (
    public.get_my_role() = 'employee'
    AND assignee_id = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────
-- 5. TRANSACTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL DEFAULT 'دخل',
  amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT '',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  funds       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions: read"         ON public.transactions;
DROP POLICY IF EXISTS "transactions: write"        ON public.transactions;
DROP POLICY IF EXISTS "transactions: finance write" ON public.transactions;

CREATE POLICY "transactions: read"
  ON public.transactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "transactions: write"
  ON public.transactions FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','finance_manager','board_member')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 6. BOARD MEMBERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.board_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  role       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  phone      TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'نشط',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_members: read"  ON public.board_members;
DROP POLICY IF EXISTS "board_members: write" ON public.board_members;

CREATE POLICY "board_members: read"
  ON public.board_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "board_members: write"
  ON public.board_members FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 7. PROJECTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  client_name          TEXT        NOT NULL DEFAULT '',
  progress             INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  budget               NUMERIC(14,2) NOT NULL DEFAULT 0,
  deadline             DATE,
  status               TEXT        NOT NULL DEFAULT 'قيد_التنفيذ',
  account_manager_name TEXT        NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects: read"  ON public.projects;
DROP POLICY IF EXISTS "projects: write" ON public.projects;

CREATE POLICY "projects: read"
  ON public.projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "projects: write"
  ON public.projects FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','attack_manager','defense_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 8. ACTIVITIES (timestamp column — NOT created_at)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL DEFAULT 'task',
  description TEXT        NOT NULL DEFAULT '',
  icon        TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities: read"  ON public.activities;
DROP POLICY IF EXISTS "activities: write" ON public.activities;

CREATE POLICY "activities: read"
  ON public.activities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "activities: write"
  ON public.activities FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 9. STRATEGY PHASES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.strategy_phases (
  id              BIGINT      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title           TEXT        NOT NULL DEFAULT '',
  description     TEXT        NOT NULL DEFAULT '',
  progress        INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  budget          NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  target_clients  INTEGER     NOT NULL DEFAULT 0,
  current_clients INTEGER     NOT NULL DEFAULT 0,
  goals           JSONB       NOT NULL DEFAULT '[]',
  status          TEXT        NOT NULL DEFAULT 'قادمة',
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Also handle case where table already exists but sort_order is missing
ALTER TABLE public.strategy_phases
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE public.strategy_phases SET sort_order = id WHERE sort_order = 0;

ALTER TABLE public.strategy_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_phases: read"  ON public.strategy_phases;
DROP POLICY IF EXISTS "strategy_phases: write" ON public.strategy_phases;

CREATE POLICY "strategy_phases: read"
  ON public.strategy_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "strategy_phases: write"
  ON public.strategy_phases FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager','attack_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 10. AUTOMATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automations (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL DEFAULT '',
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  last_run    TIMESTAMPTZ,
  run_count   INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automations: read"  ON public.automations;
DROP POLICY IF EXISTS "automations: write" ON public.automations;

CREATE POLICY "automations: read"
  ON public.automations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "automations: write"
  ON public.automations FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member','defense_manager')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- Seed default automation rules (safe to re-run)
INSERT INTO public.automations (id, title, enabled) VALUES
  ('fund-dist',     'توزيع الصناديق التلقائي',       TRUE),
  ('task-reminder', 'تنبيه مواعيد المهام',            TRUE),
  ('late-tasks',    'كشف المهام المتأخرة',            TRUE),
  ('client-followup','متابعة العملاء المحتملين',     FALSE),
  ('workload',      'حساب عبء العمل',                 FALSE),
  ('kpi-update',    'تحديث مؤشرات الأداء',           TRUE),
  ('weekly-report', 'التقرير الأسبوعي التلقائي',     TRUE)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 11. AUTOMATION LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id    TEXT        NOT NULL DEFAULT '',
  rule_title TEXT        NOT NULL DEFAULT '',
  result     TEXT        NOT NULL DEFAULT '',
  status     TEXT        NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_logs: read"  ON public.automation_logs;
DROP POLICY IF EXISTS "automation_logs: write" ON public.automation_logs;

CREATE POLICY "automation_logs: read"
  ON public.automation_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "automation_logs: write"
  ON public.automation_logs FOR ALL
  USING (
    public.get_my_role() IN ('super_admin','board_member')
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 12. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL DEFAULT 'task_due',
  title      TEXT        NOT NULL DEFAULT '',
  body       TEXT        NOT NULL DEFAULT '',
  href       TEXT        NOT NULL DEFAULT '/',
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: read"  ON public.notifications;
DROP POLICY IF EXISTS "notifications: write" ON public.notifications;

CREATE POLICY "notifications: read"
  ON public.notifications FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

CREATE POLICY "notifications: write"
  ON public.notifications FOR ALL
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- 13. MESSAGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name   TEXT        NOT NULL DEFAULT '',
  sender_avatar TEXT        NOT NULL DEFAULT '',
  subject       TEXT        NOT NULL DEFAULT '',
  content       TEXT        NOT NULL DEFAULT '',
  read          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: read"   ON public.messages;
DROP POLICY IF EXISTS "messages: insert" ON public.messages;
DROP POLICY IF EXISTS "messages: update" ON public.messages;
DROP POLICY IF EXISTS "messages: delete" ON public.messages;
DROP POLICY IF EXISTS "messages: authenticated read"  ON public.messages;
DROP POLICY IF EXISTS "messages: authenticated write" ON public.messages;
DROP POLICY IF EXISTS "messages: write" ON public.messages;

CREATE POLICY "messages: read"
  ON public.messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "messages: insert"
  ON public.messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "messages: update"
  ON public.messages FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "messages: delete"
  ON public.messages FOR DELETE
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 14. SYSTEM SETTINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT 'null',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings: read"  ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: write" ON public.system_settings;

CREATE POLICY "system_settings: read"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "system_settings: write"
  ON public.system_settings FOR ALL
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- ─────────────────────────────────────────────────────────────
-- 15. ROLE PERMISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role        TEXT        PRIMARY KEY,
  permissions TEXT[]      NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions: read"  ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions: write" ON public.role_permissions;

CREATE POLICY "role_permissions: read"
  ON public.role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions: write"
  ON public.role_permissions FOR ALL
  USING (
    public.get_my_role() = 'super_admin'
    OR (SELECT email FROM auth.users WHERE id = auth.uid())
       IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
  );

-- Seed defaults (safe to re-run)
INSERT INTO public.role_permissions (role, permissions) VALUES
  ('super_admin',     ARRAY['view_dashboard','manage_board','manage_users','manage_roles','manage_tasks','manage_clients','manage_finance','manage_reports','manage_settings','manage_automations']),
  ('board_member',    ARRAY['view_dashboard','manage_board','manage_reports','manage_finance']),
  ('defense_manager', ARRAY['view_dashboard','manage_board','manage_users','manage_tasks','manage_reports','manage_automations']),
  ('attack_manager',  ARRAY['view_dashboard','manage_clients','manage_tasks','manage_reports']),
  ('finance_manager', ARRAY['view_dashboard','manage_finance','manage_reports']),
  ('employee',        ARRAY['view_dashboard','manage_tasks'])
ON CONFLICT (role) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- Done.  All 15 tables created/verified with RLS enabled.
-- ─────────────────────────────────────────────────────────────
