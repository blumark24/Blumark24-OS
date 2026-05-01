-- ============================================================
-- Blumark24 OS – Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast Arabic text search

-- ============================================================
-- 1. USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          text not null default 'موظف'
                  check (role in ('مدير_عام','مدير_مالي','مدير_مبيعات','مدير','موظف')),
  avatar_url    text,
  department    text,
  phone         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: admin reads all"
  on public.users for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

create policy "users: admin inserts"
  on public.users for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- ============================================================
-- 2. EMPLOYEES
-- ============================================================
create table if not exists public.employees (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  position      text not null,
  department    text not null,
  email         text unique,
  phone         text,
  salary        numeric(12,2) not null default 0,
  start_date    date not null default current_date,
  status        text not null default 'نشط'
                  check (status in ('نشط','إجازة','موقوف')),
  performance   integer check (performance between 0 and 100),
  city          text,
  avatar_url    text,
  user_id       uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.employees enable row level security;

create policy "employees: authenticated read"
  on public.employees for select
  using (auth.role() = 'authenticated');

create policy "employees: manager write"
  on public.employees for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "employees: manager update"
  on public.employees for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "employees: admin delete"
  on public.employees for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 3. CLIENTS (CRM)
-- ============================================================
create table if not exists public.clients (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  company         text,
  email           text,
  phone           text,
  city            text,
  industry        text,
  status          text not null default 'محتمل'
                    check (status in ('نشط','محتمل','غير نشط')),
  value           numeric(14,2) not null default 0,
  notes           text,
  source          text,
  assigned_to     uuid references public.employees(id) on delete set null,
  last_contact    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients: authenticated read"
  on public.clients for select
  using (auth.role() = 'authenticated');

create policy "clients: sales write"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مبيعات','مدير')
    )
  );

create policy "clients: sales update"
  on public.clients for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مبيعات','مدير')
    )
  );

create policy "clients: admin delete"
  on public.clients for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 4. PROJECTS (must come before tasks)
-- ============================================================
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  status        text not null default 'نشط'
                  check (status in ('نشط','مكتمل','معلّق')),
  progress      integer not null default 0 check (progress between 0 and 100),
  budget        numeric(14,2),
  spent         numeric(14,2) not null default 0,
  start_date    date,
  end_date      date,
  client_id     uuid references public.clients(id) on delete set null,
  manager_id    uuid references public.employees(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects: authenticated read"
  on public.projects for select
  using (auth.role() = 'authenticated');

create policy "projects: manager write"
  on public.projects for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "projects: manager update"
  on public.projects for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "projects: admin delete"
  on public.projects for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 5. TASKS
-- ============================================================
create table if not exists public.tasks (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text,
  status        text not null default 'جديدة'
                  check (status in ('جديدة','قيد التنفيذ','مكتملة','متأخرة')),
  priority      text not null default 'متوسطة'
                  check (priority in ('عالية','متوسطة','منخفضة')),
  due_date      date,
  assigned_to   uuid references public.employees(id) on delete set null,
  client_id     uuid references public.clients(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  created_by    uuid references public.users(id) on delete set null,
  tags          text[],
  progress      integer not null default 0 check (progress between 0 and 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks: authenticated read"
  on public.tasks for select
  using (auth.role() = 'authenticated');

create policy "tasks: authenticated insert"
  on public.tasks for insert
  with check (auth.role() = 'authenticated');

create policy "tasks: owner or manager update"
  on public.tasks for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "tasks: manager delete"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

-- ============================================================
-- 6. INVOICES
-- ============================================================
create table if not exists public.invoices (
  id              uuid primary key default uuid_generate_v4(),
  invoice_number  text not null unique,
  client_id       uuid references public.clients(id) on delete restrict,
  project_id      uuid references public.projects(id) on delete set null,
  status          text not null default 'مسودة'
                    check (status in ('مسودة','مرسلة','مدفوعة','متأخرة','ملغاة')),
  amount          numeric(14,2) not null default 0,
  tax_rate        numeric(5,2) not null default 15,
  issue_date      date not null default current_date,
  due_date        date,
  paid_date       date,
  notes           text,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "invoices: finance read"
  on public.invoices for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي','مدير')
    )
  );

create policy "invoices: finance insert"
  on public.invoices for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي')
    )
  );

create policy "invoices: finance update"
  on public.invoices for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي')
    )
  );

create policy "invoices: admin delete"
  on public.invoices for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 7. EXPENSES
-- ============================================================
create table if not exists public.expenses (
  id            uuid primary key default uuid_generate_v4(),
  description   text not null,
  category      text not null
                  check (category in ('رواتب','مرافق','تسويق','إيجار','معدات','سفر','أخرى')),
  amount        numeric(14,2) not null,
  date          date not null default current_date,
  project_id    uuid references public.projects(id) on delete set null,
  approved_by   uuid references public.users(id) on delete set null,
  status        text not null default 'معلّق'
                  check (status in ('معلّق','موافق','مرفوض')),
  receipt_url   text,
  notes         text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses: finance read"
  on public.expenses for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي','مدير')
    )
  );

create policy "expenses: authenticated insert"
  on public.expenses for insert
  with check (auth.role() = 'authenticated');

create policy "expenses: finance update"
  on public.expenses for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي')
    )
  );

create policy "expenses: admin delete"
  on public.expenses for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 8. TRANSACTIONS (cash flow / general ledger)
-- ============================================================
create table if not exists public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  type          text not null check (type in ('دخل','مصروف')),
  category      text not null,
  amount        numeric(14,2) not null,
  description   text,
  date          date not null default current_date,
  invoice_id    uuid references public.invoices(id) on delete set null,
  expense_id    uuid references public.expenses(id) on delete set null,
  reference     text,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: finance read"
  on public.transactions for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي','مدير')
    )
  );

create policy "transactions: finance insert"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير_مالي')
    )
  );

create policy "transactions: admin delete"
  on public.transactions for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 9. ORGANIZATION_UNITS (Org Chart)
-- ============================================================
create table if not exists public.organization_units (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  type            text not null check (type in ('board','agency','department','team')),
  agency          text check (agency in ('defense','offense')),
  parent_id       uuid references public.organization_units(id) on delete cascade,
  head_id         uuid references public.employees(id) on delete set null,
  employee_count  integer not null default 0,
  description     text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.organization_units enable row level security;

create policy "org_units: authenticated read"
  on public.organization_units for select
  using (auth.role() = 'authenticated');

create policy "org_units: admin write"
  on public.organization_units for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'مدير_عام'
    )
  );

-- ============================================================
-- 10. ACTIVITIES (audit log)
-- ============================================================
create table if not exists public.activities (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete set null,
  action        text not null,
  entity_type   text,
  entity_id     uuid,
  entity_name   text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "activities: manager read"
  on public.activities for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "activities: authenticated insert"
  on public.activities for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 11. AUTOMATION_LOGS
-- ============================================================
create table if not exists public.automation_logs (
  id            uuid primary key default uuid_generate_v4(),
  rule_id       text not null,
  rule_name     text not null,
  status        text not null check (status in ('success','warning','error','info')),
  message       text not null,
  duration_ms   integer,
  triggered_by  uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.automation_logs enable row level security;

create policy "automation_logs: manager read"
  on public.automation_logs for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('مدير_عام','مدير')
    )
  );

create policy "automation_logs: service insert"
  on public.automation_logs for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete cascade,
  type          text not null check (type in ('task','client','finance','system','warning')),
  title         text not null,
  message       text,
  is_read       boolean not null default false,
  action_url    text,
  created_at    timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: own rows only"
  on public.notifications for all
  using (user_id = auth.uid());

-- ============================================================
-- 13. MESSAGES (internal messaging)
-- ============================================================
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  from_id       uuid references public.users(id) on delete cascade,
  to_id         uuid references public.users(id) on delete cascade,
  body          text not null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: sender or recipient"
  on public.messages for select
  using (from_id = auth.uid() or to_id = auth.uid());

create policy "messages: authenticated send"
  on public.messages for insert
  with check (from_id = auth.uid());

create policy "messages: mark read by recipient"
  on public.messages for update
  using (to_id = auth.uid());

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_tasks_status        on public.tasks(status);
create index if not exists idx_tasks_due_date      on public.tasks(due_date);
create index if not exists idx_tasks_assigned_to   on public.tasks(assigned_to);
create index if not exists idx_clients_status      on public.clients(status);
create index if not exists idx_invoices_status     on public.invoices(status);
create index if not exists idx_transactions_date   on public.transactions(date);
create index if not exists idx_activities_created  on public.activities(created_at desc);
create index if not exists idx_notifications_user  on public.notifications(user_id, is_read);
create index if not exists idx_messages_to         on public.messages(to_id, is_read);
create index if not exists idx_auto_logs_created   on public.automation_logs(created_at desc);

-- Arabic full-text search via trigrams
create index if not exists idx_clients_name_trgm   on public.clients   using gin(name gin_trgm_ops);
create index if not exists idx_tasks_title_trgm    on public.tasks     using gin(title gin_trgm_ops);
create index if not exists idx_employees_name_trgm on public.employees using gin(name gin_trgm_ops);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['users','employees','clients','tasks','projects','invoices','expenses'] loop
    execute format(
      'create or replace trigger trg_%I_updated_at
       before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================
-- SEED DATA – Organization Units
-- ============================================================
do $$
declare
  board_id    uuid;
  defense_id  uuid;
  offense_id  uuid;
begin
  insert into public.organization_units (name, type, sort_order)
  values ('مجلس الإدارة', 'board', 0)
  on conflict do nothing
  returning id into board_id;

  if board_id is null then
    select id into board_id from public.organization_units where type = 'board' limit 1;
  end if;

  insert into public.organization_units (name, type, agency, parent_id, sort_order)
  values
    ('وكالة الدفاع',  'agency', 'defense', board_id, 1),
    ('وكالة الهجوم', 'agency', 'offense', board_id, 2)
  on conflict do nothing;

  select id into defense_id from public.organization_units where agency = 'defense' limit 1;
  select id into offense_id from public.organization_units where agency = 'offense' limit 1;

  insert into public.organization_units (name, type, agency, parent_id, employee_count, sort_order)
  values
    ('إدارة الموارد البشرية',       'department', 'defense', defense_id,  8, 1),
    ('إدارة التقنية والأنظمة',      'department', 'defense', defense_id, 12, 2),
    ('إدارة المالية والمحاسبة',     'department', 'defense', defense_id,  6, 3),
    ('إدارة الامتثال والمخاطر',     'department', 'defense', defense_id,  4, 4),
    ('إدارة الجودة',                'department', 'defense', defense_id,  5, 5),
    ('إدارة الخدمات الإدارية',      'department', 'defense', defense_id,  7, 6),
    ('إدارة الأمن والحماية',        'department', 'defense', defense_id,  3, 7),
    ('إدارة المبيعات',              'department', 'offense', offense_id, 15, 1),
    ('إدارة التسويق الرقمي',        'department', 'offense', offense_id,  9, 2),
    ('إدارة تطوير الأعمال',         'department', 'offense', offense_id,  6, 3),
    ('إدارة خدمة العملاء',          'department', 'offense', offense_id, 10, 4),
    ('إدارة الشراكات الاستراتيجية', 'department', 'offense', offense_id,  4, 5),
    ('إدارة المنتجات والابتكار',    'department', 'offense', offense_id,  7, 6)
  on conflict do nothing;
end;
$$;

-- ============================================================
-- RBAC EXTENSION – roles, permissions, role_permissions, user_roles
-- profiles table (extends auth.users with RBAC fields)
-- board_members table (organization members managed via /org page)
-- ============================================================

-- ─── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  full_name    text not null,
  role         text not null default 'employee'
                 check (role in ('super_admin','board_member','defense_manager','attack_manager','finance_manager','employee')),
  department   text,
  status       text not null default 'active' check (status in ('active','inactive')),
  phone        text,
  position     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"    on public.profiles for select using (auth.uid() = id);
create policy "profiles: admin reads" on public.profiles for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));
create policy "profiles: admin write" on public.profiles for all    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));
create policy "profiles: update own"  on public.profiles for update using (auth.uid() = id);

-- ─── roles ────────────────────────────────────────────────────────────────────
create table if not exists public.roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  label       text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.roles enable row level security;
create policy "roles: authenticated read" on public.roles for select using (auth.role() = 'authenticated');
create policy "roles: admin write"        on public.roles for all    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

insert into public.roles (name, label, description) values
  ('super_admin',     'مدير أعلى',             'صلاحيات كاملة على النظام'),
  ('board_member',    'عضو مجلس الإدارة',      'يشاهد التقارير والمالية والهيكل'),
  ('defense_manager', 'مدير وكالة الدفاع',     'يدير الأقسام الداخلية والموظفين والمهام'),
  ('attack_manager',  'مدير وكالة الهجوم',    'يدير العملاء والمبيعات والمتابعة'),
  ('finance_manager', 'مدير مالي',             'يدير المالية والفواتير والمصروفات'),
  ('employee',        'موظف',                  'يرى مهامه فقط')
on conflict (name) do nothing;

-- ─── permissions ──────────────────────────────────────────────────────────────
create table if not exists public.permissions (
  id          uuid primary key default uuid_generate_v4(),
  key         text not null unique,
  label       text not null,
  description text
);

alter table public.permissions enable row level security;
create policy "permissions: authenticated read" on public.permissions for select using (auth.role() = 'authenticated');
create policy "permissions: admin write"        on public.permissions for all    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

insert into public.permissions (key, label) values
  ('view_dashboard',    'عرض لوحة التحكم'),
  ('manage_board',      'إدارة مجلس الإدارة'),
  ('manage_users',      'إدارة المستخدمين'),
  ('manage_roles',      'إدارة الأدوار'),
  ('manage_tasks',      'إدارة المهام'),
  ('manage_clients',    'إدارة العملاء'),
  ('manage_finance',    'إدارة المالية'),
  ('manage_reports',    'عرض التقارير'),
  ('manage_settings',   'إدارة الإعدادات'),
  ('manage_automations','إدارة الأتمتة')
on conflict (key) do nothing;

-- ─── role_permissions ─────────────────────────────────────────────────────────
create table if not exists public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

alter table public.role_permissions enable row level security;
create policy "role_permissions: authenticated read" on public.role_permissions for select using (auth.role() = 'authenticated');
create policy "role_permissions: admin write"        on public.role_permissions for all    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- Seed default role→permission mappings
do $$
declare
  r_super    uuid; r_board uuid; r_defense uuid; r_attack uuid; r_finance uuid; r_emp uuid;
  p_dash uuid; p_board uuid; p_users uuid; p_roles uuid; p_tasks uuid;
  p_clients uuid; p_finance uuid; p_reports uuid; p_settings uuid; p_auto uuid;
begin
  select id into r_super   from public.roles where name = 'super_admin';
  select id into r_board   from public.roles where name = 'board_member';
  select id into r_defense from public.roles where name = 'defense_manager';
  select id into r_attack  from public.roles where name = 'attack_manager';
  select id into r_finance from public.roles where name = 'finance_manager';
  select id into r_emp     from public.roles where name = 'employee';

  select id into p_dash     from public.permissions where key = 'view_dashboard';
  select id into p_board    from public.permissions where key = 'manage_board';
  select id into p_users    from public.permissions where key = 'manage_users';
  select id into p_roles    from public.permissions where key = 'manage_roles';
  select id into p_tasks    from public.permissions where key = 'manage_tasks';
  select id into p_clients  from public.permissions where key = 'manage_clients';
  select id into p_finance  from public.permissions where key = 'manage_finance';
  select id into p_reports  from public.permissions where key = 'manage_reports';
  select id into p_settings from public.permissions where key = 'manage_settings';
  select id into p_auto     from public.permissions where key = 'manage_automations';

  -- super_admin: all permissions
  insert into public.role_permissions values
    (r_super,p_dash),(r_super,p_board),(r_super,p_users),(r_super,p_roles),(r_super,p_tasks),
    (r_super,p_clients),(r_super,p_finance),(r_super,p_reports),(r_super,p_settings),(r_super,p_auto)
  on conflict do nothing;

  -- board_member
  insert into public.role_permissions values (r_board,p_dash),(r_board,p_board),(r_board,p_reports),(r_board,p_finance) on conflict do nothing;

  -- defense_manager
  insert into public.role_permissions values (r_defense,p_dash),(r_defense,p_board),(r_defense,p_users),(r_defense,p_tasks),(r_defense,p_reports),(r_defense,p_auto) on conflict do nothing;

  -- attack_manager
  insert into public.role_permissions values (r_attack,p_dash),(r_attack,p_clients),(r_attack,p_tasks),(r_attack,p_reports) on conflict do nothing;

  -- finance_manager
  insert into public.role_permissions values (r_finance,p_dash),(r_finance,p_finance),(r_finance,p_reports) on conflict do nothing;

  -- employee
  insert into public.role_permissions values (r_emp,p_dash),(r_emp,p_tasks) on conflict do nothing;
end;
$$;

-- ─── user_roles ───────────────────────────────────────────────────────────────
create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

alter table public.user_roles enable row level security;
create policy "user_roles: authenticated read" on public.user_roles for select using (auth.role() = 'authenticated');
create policy "user_roles: admin write"        on public.user_roles for all    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- ─── board_members ────────────────────────────────────────────────────────────
create table if not exists public.board_members (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  position   text not null,
  email      text,
  phone      text,
  status     text not null default 'نشط' check (status in ('نشط','غير نشط')),
  sort_order integer not null default 0,
  user_id    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Max 3 board members enforced via DB constraint
create or replace function public.check_board_member_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.board_members) >= 3 then
    raise exception 'لا يمكن إضافة أكثر من 3 أعضاء في مجلس الإدارة';
  end if;
  return new;
end;
$$;

create or replace trigger trg_board_members_limit
  before insert on public.board_members
  for each row execute function public.check_board_member_limit();

alter table public.board_members enable row level security;
create policy "board_members: authenticated read" on public.board_members for select using (auth.role() = 'authenticated');
create policy "board_members: manage_board write" on public.board_members for all    using (exists (select 1 from public.profiles p join public.user_roles ur on ur.user_id = p.id join public.role_permissions rp on rp.role_id = ur.role_id join public.permissions pm on pm.id = rp.permission_id where p.id = auth.uid() and pm.key = 'manage_board'));

-- updated_at trigger for new tables
do $$
declare t text;
begin
  foreach t in array array['profiles','board_members'] loop
    execute format(
      'create or replace trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;
