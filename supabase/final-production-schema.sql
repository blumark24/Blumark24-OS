-- ============================================================
-- Blumark24 OS – Final Production Schema
-- Run this in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HELPER: read own role without RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL DEFAULT '',
  name        TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'employee',
  department  TEXT NOT NULL DEFAULT '',
  avatar      TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns if upgrading from older schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department  TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Enforce role values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin','board_member','defense_manager','attack_manager','finance_manager','employee'));

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: read own or admin"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin all"     ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin write"   ON public.profiles;

CREATE POLICY "profiles: read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles: super_admin all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- ── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT := 'employee';
BEGIN
  -- Known admin emails always get super_admin role
  IF NEW.email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com') THEN
    v_role := 'super_admin';
  END IF;
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role  = CASE
          WHEN profiles.email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
          THEN 'super_admin'
          ELSE profiles.role
        END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Upsert the super_admin account ──────────────────────────
-- User must already exist in auth.users (created via Dashboard or API)
INSERT INTO public.profiles (id, email, name, role, department, is_active)
VALUES (
  'b2e970a2-1ece-454d-8bc7-0f907dc83f7e',
  'blumark24@gmail.com',
  'Blumark24',
  'super_admin',
  'الإدارة العليا',
  true
)
ON CONFLICT (id) DO UPDATE
  SET
    email      = EXCLUDED.email,
    name       = EXCLUDED.name,
    role       = 'super_admin',
    department = EXCLUDED.department,
    is_active  = true,
    updated_at = now();

-- ============================================================
-- 2. EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  email            TEXT UNIQUE,
  role             TEXT NOT NULL DEFAULT 'موظف',
  department       TEXT NOT NULL DEFAULT 'الإدارة',
  status           TEXT NOT NULL DEFAULT 'نشط' CHECK (status IN ('نشط','غير_نشط')),
  join_date        TEXT NOT NULL DEFAULT '',
  performance      INTEGER NOT NULL DEFAULT 3 CHECK (performance BETWEEN 0 AND 5),
  phone            TEXT,
  tasks            INTEGER NOT NULL DEFAULT 0,
  completed_tasks  INTEGER NOT NULL DEFAULT 0,
  avatar           TEXT,
  salary           NUMERIC(12,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees: authenticated read"  ON public.employees;
DROP POLICY IF EXISTS "employees: super_admin write"   ON public.employees;

CREATE POLICY "employees: read"
  ON public.employees FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "employees: write"
  ON public.employees FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- ============================================================
-- 3. CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  phone                 TEXT NOT NULL DEFAULT '',
  business_type         TEXT NOT NULL DEFAULT '',
  city                  TEXT NOT NULL DEFAULT '',
  package_type          TEXT NOT NULL DEFAULT 'صغيرة' CHECK (package_type IN ('صغيرة','متوسطة','كبيرة')),
  contract_value        NUMERIC(14,2) NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'محتمل' CHECK (status IN ('محتمل','متعاقد','نشط','متوقف')),
  account_manager_id    TEXT NOT NULL DEFAULT '',
  account_manager_name  TEXT NOT NULL DEFAULT '',
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients: authenticated read" ON public.clients;
DROP POLICY IF EXISTS "clients: manager write"      ON public.clients;

CREATE POLICY "clients: read"
  ON public.clients FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients: write"
  ON public.clients FOR ALL
  USING (public.get_my_role() IN ('super_admin','attack_manager','defense_manager','finance_manager'));

-- ============================================================
-- 4. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'جديدة' CHECK (status IN ('جديدة','قيد_التنفيذ','بانتظار_المراجعة','مكتملة','متأخرة')),
  priority         TEXT NOT NULL DEFAULT 'متوسطة' CHECK (priority IN ('عاجلة','عالية','متوسطة','منخفضة')),
  assignee_id      TEXT NOT NULL DEFAULT '',
  assignee_name    TEXT NOT NULL DEFAULT '',
  assignee_avatar  TEXT,
  client_id        TEXT,
  client_name      TEXT,
  due_date         TEXT NOT NULL DEFAULT '',
  tags             TEXT[],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks: authenticated read"  ON public.tasks;
DROP POLICY IF EXISTS "tasks: authenticated write" ON public.tasks;

CREATE POLICY "tasks: read"  ON public.tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "tasks: write" ON public.tasks FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         TEXT NOT NULL CHECK (type IN ('دخل','مصروف')),
  amount       NUMERIC(14,2) NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT '',
  date         TEXT NOT NULL DEFAULT '',
  funds        JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions: authenticated read" ON public.transactions;
DROP POLICY IF EXISTS "transactions: finance write"      ON public.transactions;

CREATE POLICY "transactions: read"
  ON public.transactions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transactions: write"
  ON public.transactions FOR ALL
  USING (public.get_my_role() IN ('super_admin','finance_manager'));

-- ============================================================
-- 6. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  TEXT NOT NULL,
  client_name           TEXT NOT NULL DEFAULT '',
  progress              INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  budget                NUMERIC(14,2) NOT NULL DEFAULT 0,
  deadline              TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'قيد_التنفيذ' CHECK (status IN ('قيد_التنفيذ','مكتمل','متوقف')),
  account_manager_name  TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects: authenticated read" ON public.projects;
DROP POLICY IF EXISTS "projects: super_admin write"  ON public.projects;

CREATE POLICY "projects: read"  ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "projects: write" ON public.projects FOR ALL    USING (public.get_my_role() = 'super_admin');

-- ============================================================
-- 7. ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('employee','task','client','finance','project')),
  description  TEXT NOT NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT now(),
  icon         TEXT
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities: authenticated read"   ON public.activities;
DROP POLICY IF EXISTS "activities: authenticated insert" ON public.activities;

CREATE POLICY "activities: read"   ON public.activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "activities: insert" ON public.activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 8. BOARD MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.board_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'عضو مجلس الإدارة',
  email       TEXT,
  phone       TEXT,
  status      TEXT NOT NULL DEFAULT 'نشط' CHECK (status IN ('نشط','غير نشط')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_members: authenticated read" ON public.board_members;
DROP POLICY IF EXISTS "board_members: admin write"        ON public.board_members;

CREATE POLICY "board_members: read"  ON public.board_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "board_members: write" ON public.board_members FOR ALL
  USING (public.get_my_role() IN ('super_admin','board_member'));

-- ============================================================
-- 9. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_name    TEXT NOT NULL,
  sender_avatar  TEXT NOT NULL DEFAULT '',
  subject        TEXT NOT NULL,
  content        TEXT NOT NULL,
  read           BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: authenticated read"  ON public.messages;
DROP POLICY IF EXISTS "messages: authenticated write" ON public.messages;

CREATE POLICY "messages: read"  ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "messages: write" ON public.messages FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT NOT NULL DEFAULT 'task_due' CHECK (type IN ('task_due','task_late','client_followup','invoice_due')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  href        TEXT NOT NULL DEFAULT '/',
  read        BOOLEAN NOT NULL DEFAULT false,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: read own or broadcast"   ON public.notifications;
DROP POLICY IF EXISTS "notifications: update own or broadcast" ON public.notifications;
DROP POLICY IF EXISTS "notifications: insert authenticated"    ON public.notifications;

CREATE POLICY "notifications: read"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "notifications: update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "notifications: insert"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 11. SYSTEM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings: read authenticated" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: write admin"        ON public.system_settings;

CREATE POLICY "system_settings: read"
  ON public.system_settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "system_settings: write"
  ON public.system_settings FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- ============================================================
-- ENSURE SUPER_ADMIN FOR KNOWN ADMIN EMAILS
-- Run this after auth.users accounts exist
-- ============================================================
UPDATE public.profiles
SET role       = 'super_admin',
    is_active  = true,
    updated_at = now()
WHERE email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com');

-- ============================================================
-- VERIFY
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- SELECT id, email, role, is_active FROM public.profiles
-- WHERE email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com');
-- ============================================================
