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
