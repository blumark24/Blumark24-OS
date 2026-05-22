# Blumark24 OS — Database Plan

## 1) الجداول المطلوبة
- profiles
- roles
- permissions
- role_permissions
- employees
- departments
- tasks
- clients
- invoices
- invoice_items
- expenses
- organization_units
- strategy_goals
- strategy_phases
- automation_rules
- automation_logs
- reports
- activity_logs
- settings

## 2) أعمدة أساسية (مختصر)
- **profiles:** id(uuid FK auth.users), email, name, role_id, avatar_url, status, created_at, updated_at
- **roles:** id, code(unique), name_ar, level
- **permissions:** id, code(unique), name_ar, module
- **role_permissions:** role_id, permission_id
- **employees:** id, profile_id, department_id, job_title, phone, hire_date, salary, status
- **departments:** id, name_ar, manager_employee_id
- **tasks:** id, title, description, status, priority, assignee_employee_id, due_date, created_by
- **clients:** id, name, phone, city, business_type, status, account_manager_employee_id
- **invoices:** id, client_id, issue_date, due_date, status, subtotal, tax, total, currency
- **invoice_items:** id, invoice_id, description, qty, unit_price, line_total
- **expenses:** id, category, amount, expense_date, department_id, notes, created_by
- **organization_units:** id, name_ar, unit_type, parent_id
- **strategy_goals:** id, title, owner_id, status, target_date
- **strategy_phases:** id, goal_id, title, progress, status
- **automation_rules:** id, title, trigger_type, action_type, config_json, enabled
- **automation_logs:** id, rule_id, status, message, executed_at
- **reports:** id, report_type, payload_json, created_by, created_at
- **activity_logs:** id, actor_id, action, entity, entity_id, metadata_json, created_at
- **settings:** id, org_name, locale, timezone, currency, dark_mode, accent_color

## 3) العلاقات
- profiles 1:1 auth.users
- employees -> profiles, departments
- tasks -> employees (assignee)
- clients -> employees (manager)
- invoices -> clients
- invoice_items -> invoices
- strategy_phases -> strategy_goals
- role_permissions -> roles + permissions
- automation_logs -> automation_rules

## 4) الفهارس (Indexes)
- unique on roles.code, permissions.code
- composite index on tasks(status, assignee_employee_id)
- index invoices(client_id, issue_date)
- index expenses(expense_date, department_id)
- index activity_logs(actor_id, created_at desc)
- gin index for JSON search fields if needed

## 5) RLS Policies (مختصر)
- default deny all.
- SELECT: authenticated with scoped access by role.
- INSERT/UPDATE/DELETE: حسب permission code.
- super_admin full access.
- employee row-level محدود على موارده.

## 6) Seed Data
- Seed `roles` + `permissions` الأساسية.
- إنشاء super_admin واحد مرتبط بـ auth.users + profiles + roles.

## 7) Supabase Notes
- service role server-only.
- جميع عمليات admin عبر API routes/edge secured.
- توثيق migration order الإلزامي.

## 8) SQL Migration Proposal (High-level)
1. create roles/permissions/role_permissions
2. alter profiles -> role_id FK
3. create core business tables
4. add indexes
5. enable RLS + policies
6. seed baseline admin/roles
