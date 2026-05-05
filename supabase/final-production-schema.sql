-- ============================================================
-- Blumark24 OS – Final Production Schema v3
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HELPER: read current user's role (SECURITY DEFINER bypasses RLS)
-- Falls back to email-based check if profile doesn't exist yet
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
  v_email text;
BEGIN
  -- Try profile table first
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF FOUND AND v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  -- Fallback: check email against known admin list
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com') THEN
    RETURN 'super_admin';
  END IF;

  RETURN 'employee';
END;
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

-- Add columns if upgrading from older schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Remove old restrictive constraint before adding new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin','board_member','defense_manager','attack_manager','finance_manager','employee'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL old policies first
DROP POLICY IF EXISTS "profiles: read"              ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own"          ON public.profiles;
DROP POLICY IF EXISTS "profiles: read own or admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles: insert own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles: update own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin all"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin read all" ON public.profiles;
DROP POLICY IF EXISTS "profiles: super_admin write" ON public.profiles;

-- SELECT: own profile OR super_admin sees all
CREATE POLICY "profiles: select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- INSERT: any authenticated user can insert their own profile
CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: own profile OR super_admin
CREATE POLICY "profiles: update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- DELETE: super_admin only
CREATE POLICY "profiles: delete"
  ON public.profiles FOR DELETE
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
  IF NEW.email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com') THEN
    v_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, email, name, role, is_active, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    true,
    CASE WHEN v_role = 'super_admin' THEN 'الإدارة العليا' ELSE '' END
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      name       = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name),
      role       = CASE
                     WHEN profiles.email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
                     THEN 'super_admin'
                     ELSE profiles.role
                   END,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Force super_admin for known admin emails (run after accounts exist) ──
UPDATE public.profiles
SET
  role       = 'super_admin',
  is_active  = true,
  department = COALESCE(NULLIF(department, ''), 'الإدارة العليا'),
  updated_at = now()
WHERE email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com');

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

DROP POLICY IF EXISTS "employees: read"  ON public.employees;
DROP POLICY IF EXISTS "employees: write" ON public.employees;
DROP POLICY IF EXISTS "employees: authenticated read"  ON public.employees;
DROP POLICY IF EXISTS "employees: super_admin write"   ON public.employees;

-- Any authenticated user can read employees
CREATE POLICY "employees: read"
  ON public.employees FOR SELECT
  USING (auth.role() = 'authenticated');

-- super_admin / known admin emails can write
CREATE POLICY "employees: write"
  ON public.employees FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
      OR public.get_my_role() IN ('super_admin', 'defense_manager', 'attack_manager', 'board_member')
    )
  );

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

DROP POLICY IF EXISTS "clients: read"  ON public.clients;
DROP POLICY IF EXISTS "clients: write" ON public.clients;
DROP POLICY IF EXISTS "clients: authenticated read" ON public.clients;
DROP POLICY IF EXISTS "clients: manager write"      ON public.clients;

CREATE POLICY "clients: read"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

-- All managers (and admin emails as fallback) can write clients
CREATE POLICY "clients: write"
  ON public.clients FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
      OR public.get_my_role() IN ('super_admin', 'attack_manager', 'defense_manager', 'finance_manager', 'board_member')
    )
  );

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

DROP POLICY IF EXISTS "tasks: read"  ON public.tasks;
DROP POLICY IF EXISTS "tasks: write" ON public.tasks;
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

DROP POLICY IF EXISTS "transactions: read"  ON public.transactions;
DROP POLICY IF EXISTS "transactions: write" ON public.transactions;
DROP POLICY IF EXISTS "transactions: authenticated read" ON public.transactions;
DROP POLICY IF EXISTS "transactions: finance write"      ON public.transactions;

CREATE POLICY "transactions: read"
  ON public.transactions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "transactions: write"
  ON public.transactions FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
      OR public.get_my_role() IN ('super_admin', 'finance_manager', 'board_member')
    )
  );

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

DROP POLICY IF EXISTS "projects: read"  ON public.projects;
DROP POLICY IF EXISTS "projects: write" ON public.projects;
DROP POLICY IF EXISTS "projects: authenticated read" ON public.projects;
DROP POLICY IF EXISTS "projects: super_admin write"  ON public.projects;

CREATE POLICY "projects: read"  ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "projects: write" ON public.projects FOR ALL
  USING (auth.role() = 'authenticated' AND public.get_my_role() IN ('super_admin', 'defense_manager'));

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

DROP POLICY IF EXISTS "activities: read"   ON public.activities;
DROP POLICY IF EXISTS "activities: insert" ON public.activities;
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

DROP POLICY IF EXISTS "board_members: read"  ON public.board_members;
DROP POLICY IF EXISTS "board_members: write" ON public.board_members;
DROP POLICY IF EXISTS "board_members: authenticated read" ON public.board_members;
DROP POLICY IF EXISTS "board_members: admin write"        ON public.board_members;

CREATE POLICY "board_members: read"  ON public.board_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "board_members: write" ON public.board_members FOR ALL
  USING (
    auth.role() = 'authenticated' AND (
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
      OR public.get_my_role() IN ('super_admin', 'board_member')
    )
  );

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

DROP POLICY IF EXISTS "messages: read"  ON public.messages;
DROP POLICY IF EXISTS "messages: write" ON public.messages;
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

DROP POLICY IF EXISTS "notifications: read"   ON public.notifications;
DROP POLICY IF EXISTS "notifications: update" ON public.notifications;
DROP POLICY IF EXISTS "notifications: insert" ON public.notifications;
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

DROP POLICY IF EXISTS "system_settings: read"  ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: write" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: read authenticated" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings: write admin"        ON public.system_settings;

CREATE POLICY "system_settings: read"
  ON public.system_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "system_settings: write"
  ON public.system_settings FOR ALL
  USING (auth.role() = 'authenticated' AND public.get_my_role() IN ('super_admin', 'board_member'));

-- ============================================================
-- 12. STRATEGY PHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.strategy_phases (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  budget          NUMERIC(15,2) NOT NULL DEFAULT 0,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  target_clients  INTEGER NOT NULL DEFAULT 0,
  current_clients INTEGER NOT NULL DEFAULT 0,
  goals           TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'قادمة' CHECK (status IN ('مكتملة', 'جارية', 'قادمة')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_phases: read"  ON public.strategy_phases;
DROP POLICY IF EXISTS "strategy_phases: write" ON public.strategy_phases;

CREATE POLICY "strategy_phases: read"
  ON public.strategy_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "strategy_phases: write"
  ON public.strategy_phases FOR ALL
  USING (public.get_my_role() IN ('super_admin', 'board_member'));

-- Seed initial phases (only if table is empty)
INSERT INTO public.strategy_phases
  (title, description, progress, budget, start_date, end_date, target_clients, current_clients, goals, status, sort_order)
SELECT * FROM (VALUES
  ('المرحلة الأولى: الانطلاق', '10 عملاء وتطوير المشروع الأساسي', 100, 50000, '2023-01-01', '2023-06-30', 10, 10,
   ARRAY['بناء فريق العمل الأساسي', 'اكتساب أول 10 عملاء', 'تطوير النظام الأساسي', 'إنشاء هوية العلامة التجارية'],
   'مكتملة', 1),
  ('المرحلة الثانية: النمو', '25 عميل + توظيف + تطوير النظام', 72, 150000, '2023-07-01', '2024-06-30', 25, 18,
   ARRAY['الوصول لـ25 عميل', 'توظيف 5 موظفين جدد', 'تطوير نظام Blumark24 OS', 'تطوير خدمات الذكاء الاصطناعي'],
   'جارية', 2),
  ('المرحلة الثالثة: التوسع', 'مكتب مكة + المطاعم والمقاهي والبقالات', 20, 300000, '2024-07-01', '2025-03-31', 60, 12,
   ARRAY['افتتاح مكتب في مكة', 'استهداف قطاع المطاعم والمقاهي', 'تطوير حلول للبقالات', 'شراكات استراتيجية'],
   'قادمة', 3),
  ('المرحلة الرابعة: التميز', 'تنفيذ البراند والتجهيزات الاحترافية', 0, 500000, '2025-04-01', '2025-12-31', 120, 0,
   ARRAY['إطلاق تجهيزات احترافية', 'تطوير منصة SaaS', 'برنامج الشراكة مع الشركاء', 'الاعتراف الوطني بالعلامة'],
   'قادمة', 4),
  ('المرحلة الخامسة: الريادة', 'B2G + منصة فرص + المنافسات الحكومية', 0, 1000000, '2026-01-01', '2026-12-31', 250, 0,
   ARRAY['الدخول في العقود الحكومية (B2G)', 'إطلاق منصة الفرص الرقمية', 'المشاركة في المنافسات الحكومية', 'الانتشار الوطني الكامل'],
   'قادمة', 5)
) AS v(title, description, progress, budget, start_date, end_date, target_clients, current_clients, goals, status, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.strategy_phases LIMIT 1);

-- ============================================================
-- 13. AUTOMATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automations (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  last_run   TIMESTAMPTZ,
  run_count  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
    auth.role() = 'authenticated' AND (
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN ('blumark24@gmail.com', 'blumark.sa@gmail.com')
      OR public.get_my_role() IN ('super_admin', 'board_member')
    )
  );

-- Seed default automation rules
INSERT INTO public.automations (id, title, enabled, run_count)
SELECT id, title, enabled, 0
FROM (VALUES
  ('fund-dist',       'توزيع الصناديق التلقائي',       true),
  ('task-reminder',   'تنبيه مواعيد المهام',            true),
  ('late-tasks',      'كشف المهام المتأخرة',            true),
  ('client-followup', 'متابعة العملاء المحتملين',       true),
  ('workload',        'حساب عبء العمل',                 true),
  ('kpi-update',      'تحديث مؤشرات الأداء',            true),
  ('weekly-report',   'التقرير الأسبوعي التلقائي',      false)
) AS v(id, title, enabled)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. AUTOMATION LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id      TEXT NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  rule_title   TEXT NOT NULL,
  result       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'warning', 'error')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_logs: read"   ON public.automation_logs;
DROP POLICY IF EXISTS "automation_logs: insert" ON public.automation_logs;

CREATE POLICY "automation_logs: read"
  ON public.automation_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "automation_logs: insert"
  ON public.automation_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- ENSURE super_admin FOR KNOWN ADMIN ACCOUNTS
-- (Safe to run even if accounts don't exist yet — no-op in that case)
-- ============================================================
UPDATE public.profiles
SET
  role       = 'super_admin',
  is_active  = true,
  department = COALESCE(NULLIF(department, ''), 'الإدارة العليا'),
  updated_at = now()
WHERE email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com');

-- ============================================================
-- VERIFY (uncomment to check):
-- SELECT id, email, role, is_active, department FROM public.profiles
-- WHERE email IN ('blumark24@gmail.com', 'blumark.sa@gmail.com');
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ============================================================
