-- ============================================================
-- Blumark24 OS – Supabase Schema
-- Run this once in the Supabase SQL Editor.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- HELPER: security-definer function to read own role safely
-- (avoids infinite recursion in RLS policies on profiles)
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- 1. PROFILES  (mirrors auth.users, holds role/name/dept)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        text not null default 'employee'
                check (role in (
                  'super_admin','board_member','defense_manager',
                  'attack_manager','finance_manager','employee'
                )),
  department  text not null default '',
  avatar      text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Use security-definer helper to avoid infinite recursion
create policy "profiles: read own or admin"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.get_my_role() = 'super_admin'
  );

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: super_admin all"
  on public.profiles for all
  using (public.get_my_role() = 'super_admin');

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. EMPLOYEES
-- ============================================================
create table if not exists public.employees (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  email            text unique,
  role             text not null default 'موظف',
  department       text not null default 'الإدارة',
  status           text not null default 'نشط'
                     check (status in ('نشط','غير_نشط')),
  join_date        text not null default '',
  performance      integer not null default 3 check (performance between 0 and 5),
  phone            text,
  tasks            integer not null default 0,
  completed_tasks  integer not null default 0,
  avatar           text,
  salary           numeric(12,2),
  created_at       timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "employees: authenticated read"
  on public.employees for select
  using (auth.role() = 'authenticated');

create policy "employees: super_admin write"
  on public.employees for all
  using (public.get_my_role() = 'super_admin');

-- ============================================================
-- 3. CLIENTS
-- ============================================================
create table if not exists public.clients (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  phone                 text not null default '',
  business_type         text not null default '',
  city                  text not null default '',
  package_type          text not null default 'صغيرة'
                          check (package_type in ('صغيرة','متوسطة','كبيرة')),
  contract_value        numeric(14,2) not null default 0,
  status                text not null default 'محتمل'
                          check (status in ('محتمل','متعاقد','نشط','متوقف')),
  account_manager_id    text not null default '',
  account_manager_name  text not null default '',
  notes                 text,
  created_at            timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients: authenticated read"
  on public.clients for select
  using (auth.role() = 'authenticated');

create policy "clients: manager write"
  on public.clients for all
  using (
    public.get_my_role() in ('super_admin','attack_manager','defense_manager','finance_manager')
  );

-- ============================================================
-- 4. TASKS
-- ============================================================
create table if not exists public.tasks (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  description      text,
  status           text not null default 'جديدة'
                     check (status in ('جديدة','قيد_التنفيذ','بانتظار_المراجعة','مكتملة','متأخرة')),
  priority         text not null default 'متوسطة'
                     check (priority in ('عاجلة','عالية','متوسطة','منخفضة')),
  assignee_id      text not null default '',
  assignee_name    text not null default '',
  assignee_avatar  text,
  client_id        text,
  client_name      text,
  due_date         text not null default '',
  tags             text[],
  created_at       timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks: authenticated read"
  on public.tasks for select
  using (auth.role() = 'authenticated');

create policy "tasks: authenticated write"
  on public.tasks for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- 5. TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null check (type in ('دخل','مصروف')),
  amount       numeric(14,2) not null,
  description  text not null default '',
  category     text not null default '',
  date         text not null default '',
  funds        jsonb,
  created_at   timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: authenticated read"
  on public.transactions for select
  using (auth.role() = 'authenticated');

create policy "transactions: finance write"
  on public.transactions for all
  using (
    public.get_my_role() in ('super_admin','finance_manager')
  );

-- ============================================================
-- 6. PROJECTS
-- ============================================================
create table if not exists public.projects (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  client_name           text not null default '',
  progress              integer not null default 0 check (progress between 0 and 100),
  budget                numeric(14,2) not null default 0,
  deadline              text not null default '',
  status                text not null default 'قيد_التنفيذ'
                          check (status in ('قيد_التنفيذ','مكتمل','متوقف')),
  account_manager_name  text not null default '',
  created_at            timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: authenticated read"
  on public.projects for select
  using (auth.role() = 'authenticated');

create policy "projects: super_admin write"
  on public.projects for all
  using (public.get_my_role() = 'super_admin');

-- ============================================================
-- 7. ACTIVITIES  (audit/activity feed)
-- ============================================================
create table if not exists public.activities (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null default 'task'
                 check (type in ('employee','task','client','finance','project')),
  description  text not null,
  timestamp    timestamptz not null default now(),
  icon         text
);

alter table public.activities enable row level security;

create policy "activities: authenticated read"
  on public.activities for select
  using (auth.role() = 'authenticated');

create policy "activities: authenticated insert"
  on public.activities for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 8. BOARD MEMBERS
-- ============================================================
create table if not exists public.board_members (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text not null default 'عضو مجلس الإدارة',
  email       text,
  phone       text,
  status      text not null default 'نشط' check (status in ('نشط','غير نشط')),
  created_at  timestamptz not null default now()
);

alter table public.board_members enable row level security;

create policy "board_members: authenticated read"
  on public.board_members for select
  using (auth.role() = 'authenticated');

create policy "board_members: admin write"
  on public.board_members for all
  using (
    public.get_my_role() in ('super_admin','board_member')
  );

-- ============================================================
-- 9. MESSAGES
-- ============================================================
create table if not exists public.messages (
  id             uuid primary key default uuid_generate_v4(),
  sender_name    text not null,
  sender_avatar  text not null default '',
  subject        text not null,
  content        text not null,
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: authenticated read"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "messages: authenticated write"
  on public.messages for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  type        text not null default 'task_due'
                check (type in ('task_due','task_late','client_followup','invoice_due')),
  title       text not null,
  body        text not null,
  href        text not null default '/',
  read        boolean not null default false,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: read own or broadcast"
  on public.notifications for select
  using (user_id = auth.uid() or user_id is null);

create policy "notifications: update own or broadcast"
  on public.notifications for update
  using (user_id = auth.uid() or user_id is null);

create policy "notifications: insert authenticated"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- SETUP: Create the admin user AFTER running this schema.
--
-- Step 1 – In Supabase Dashboard → Authentication → Users:
--   Create user: admin@blumark24.com  with your chosen password
--   (or use the API/CLI)
--
-- Step 2 – Run this SQL to promote to super_admin:
-- ============================================================
/*
  UPDATE public.profiles
  SET
    role       = 'super_admin',
    name       = 'أحمد محمد',
    department = 'الإدارة العليا',
    is_active  = true
  WHERE email = 'admin@blumark24.com';
*/

-- ============================================================
-- Verify setup:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;
-- ============================================================
