# PR5: Customer Workspace Governance & Operations Audit

**Date:** 2026-05-25  
**Type:** Audit only — no code, schema, auth, RLS, middleware, routes, or Owner Panel changes  
**Scope:** Tenant customer workspace (`/dashboard`, `/org`, `/employees`, `/clients`, `/tasks`, `/finance`, `/settings`, header/mobile actions)

---

## Executive summary

The customer workspace has a **real multi-tenant org model** (Supabase `departments`, `teams`, `positions`, `employee_relations`) and a **permission engine** (`PermissionsContext` + `role_permissions` + plan features). Governance is **partially implemented**:

- **Board** is a **static UI root**; `board_members` exists in DB but is **not wired** to tenant org UI.
- **Highest operational tenant role** is **`organization_manager` (مدير المنشأة)**, not General Manager.
- **Agency / department managers** exist as **org-chart labels and structure levels**, not as scoped RBAC roles.
- **Permissions are automatic by role** in code, but **page-level CRUD buttons** on CRM/Tasks/Finance still gate on **`super_admin` only**, breaking tenant managers despite correct `hasPermission` on Quick Actions.

---

## 1. All role sources

| Source | Path | What it defines |
|--------|------|-----------------|
| Canonical RBAC | `src/contexts/PermissionsContext.tsx` | `UserRole`, `Permission`, `DEFAULT_ROLE_PERMISSIONS`, `mapAuthRoleToUserRole`, `hasPermission` |
| Auth session | `src/contexts/AuthContext.tsx` | Raw `profiles.role` on `user.role` |
| Tenant labels | `src/lib/tenant/tenantDisplay.ts` | `TENANT_ASSIGNABLE_ROLES`, `TENANT_ROLE_LABELS`, `getTenantRoleLabel` |
| Legacy types | `src/types/index.ts` | Wider role union — **not used** by permission engine |
| Org chart copy | `src/lib/org/packageHierarchy.ts` | `TENANT_ORG_ROLE_DEFINITIONS` — **display only** |
| Package routes | `src/lib/features/packageFeatures.ts` | Route → permission → plan feature |
| API provisioning | `src/lib/api/tenantUserAdmin.ts` | Who can create users; assignable roles |
| DB constraint | Migrations `015`, `018`, `024` | `profiles.role` CHECK |
| DB permissions | `role_permissions` table | Extends role permissions at runtime |
| RLS | `get_my_role()`, `can_manage_tenant_org()` | DB write scope |
| Employee modal | `src/app/employees/page.tsx` + `PremiumRolePicker` | Assignable: `organization_manager`, `finance_manager`, `employee` |
| Profile panel | `src/components/layout/Header.tsx` | Shows role from auth; no role editing |
| Settings permissions tab | `src/app/settings/page.tsx` | Full matrix — **hidden** from tenant managers (no `manage_roles`) |

---

## 2. Role consistency across surfaces

| Surface | Roles shown | Matches permissions? |
|---------|-------------|-------------------|
| **Org structure** (`SmartOrgBuilder`) | Static cards: مدير المنشأة، مدير مالي، **رئيس قسم**، موظف | **No** — «رئيس قسم» has no `profiles.role` equivalent |
| **Employee modal** | `organization_manager`, `finance_manager`, `employee` via `getTenantRoleLabel` | **Yes** — matches `TENANT_ASSIGNABLE_ROLES` |
| **Profile panel** | Raw mapped role label + dept chip | **Partial** — read-only; «الملف الشخصي» → `/employees` (admin list) |
| **Permissions logic** | 7 canonical roles; aliases collapsed in `mapAuthRoleToUserRole` | **Internal inconsistency** — see matrix below |

### Alias collapse (semantic drift)

| Stored / alias string | Maps to | UI may say |
|----------------------|---------|------------|
| `general_manager`, `مدير_عام` | **`super_admin`** | «المدير العام» |
| `department_manager`, `manager`, `مدير` | **`organization_manager`** | «مدير قسم» **or** «مدير المنشأة» |
| `defense_manager`, `attack_manager` | Same (internal) | Sanitized to «مدير تشغيل» in tenant UI |

There is **no tenant-assignable** `agency_manager`, `department_manager`, or `board_member` role.

---

## 3. Board governance & board members

| Question | Finding |
|----------|---------|
| **Board node** | **Static** virtual root «مجلس الإدارة» — not a DB row (`buildFlowGraph.ts`, `packageHierarchy.ts`) |
| **Board members** | **DB real** (`board_members`, org-scoped) + CRUD in `db.ts`, hook `useBoardMembers` |
| **Tenant UI** | **Not loaded** — `SmartOrgBuilder` has no board member UI |
| **Dead code** | `InternalBlumarkOrgView.tsx` uses real board members but is **never routed** |

**Verdict:** Board governance is **static at the chart level**; board members are **real in DB but disconnected** from customer workspace.

---

## 4. General Manager as highest operational role

| Role | Tenant operational top? |
|------|-------------------------|
| **`organization_manager`** | **Yes** — full in-org admin (tasks, clients, finance, employees via API, org structure, tenant settings) |
| **`general_manager`** | **No** — maps to **`super_admin`** (platform), not tenant-scoped |
| **`finance_manager`** | Scoped finance + reports only |
| **`employee`** | Dashboard + tasks (own-task RLS at DB) |

Tenant org cards show **«مدير المنشأة»** as top role (`TENANT_ORG_ROLE_DEFINITIONS`), not «المدير العام».

---

## 5. Agency Manager & Department Manager structural support

| Layer | Agency | Department |
|-------|--------|------------|
| **Structure (DB)** | `departments.structure_level = 'agency'` — **Advanced plan only** | `department` / `management` levels supported by plan |
| **UI labels** | «مدير وكالة» in internal defs; tenant defs omit agency manager card | «رئيس قسم» in org role cards |
| **Profile role** | **None** for tenants | **None** — `department_manager` → `organization_manager` (full admin) |
| **`manager_id`** | Column on `departments` — **never set** in create/assign flows | Same |
| **`employee_relations.manager_id`** | Always **`null`** from org builder and employees page | Same |

**Verdict:** Structure **supports agency/department nodes**; manager roles are **informational only**, not enforced RBAC.

---

## 6. What managers can add (by role)

Assuming **Advanced plan** (all features enabled):

| Action | `organization_manager` | `finance_manager` | `employee` |
|--------|:---------------------:|:-----------------:|:----------:|
| Employees | ✅ (`manage_users` + API) | ❌ | ❌ |
| Clients | ✅ (`manage_clients`) | ❌ | ❌ |
| Tasks | ✅ (`manage_tasks`) | ❌ | ✅ (page access; status change unrestricted) |
| Departments / org units | ✅ (`canManageTenantOrgStructure`) | ❌ | ❌ |
| Teams / positions | ✅ | ❌ | ❌ |
| Login roles | ✅ 3 tenant roles only | ❌ | ❌ |
| Permission matrix | ❌ (no `manage_roles`) | ❌ | ❌ |
| Board members | Permission exists (`manage_board`) but **no UI** | ❌ | ❌ |

**UI bug:** CRM/Tasks/Finance **visible CRUD buttons** require `super_admin`, so **`organization_manager` cannot use in-page buttons** even with permissions (Quick Actions deep links may work where implemented).

---

## 7. Permissions automatic by role?

**Yes, layered:**

1. **`DEFAULT_ROLE_PERMISSIONS`** in code — always merged; DB cannot revoke coded defaults for tenant manager.
2. **`role_permissions`** table — extends at runtime.
3. **`super_admin`** — hard bypass in `hasPermission()`.
4. **Plan features** — route visibility via `TenantWorkspaceContext`.
5. **RLS** — separate DB layer (employee writes often via service-role API).

---

## 8. Employee department assignment

| Step | Implementation | Table |
|------|----------------|-------|
| Create employee | `/api/admin/create-user` + optional `assignEmployeeToOrgUnit` | `employees`, `profiles`, `employee_relations` |
| Save dept | `assignEmployeeToOrgUnit` → upsert relation + sync labels | `employee_relations`, `employees.department`, `profiles.department` |
| Display | Table badge: `employees.department`; profile chip: `profiles.department` or relation lookup | `useProfileOrgDepartment` |
| Edit role | Updates **`employees` only** — **does not sync `profiles.role`** | **Desync risk** |

**Verdict:** Department **save/display works** when org unit is selected; **role edits can desync** `employees` vs `profiles`.

---

## 9. Settings tabs persistence

| Tab | Persists? | Target |
|-----|----------|--------|
| **عام** | ✅ On «حفظ التغييرات» | `tenant_workspace_settings.company_info` (tenant) or `system_settings` (platform) |
| **الحساب** | ✅ On form submit | Supabase Auth password + optional `profiles` force-PW clear |
| **الإشعارات** | ✅ On save | `tenant_workspace_settings.notifications` — **not wired** to notification delivery |
| **المظهر** | ✅ On save + live | DB `appearance` + `localStorage` `blumark-theme`; language stored but **no i18n switch** |
| Tab selection | ❌ Local / URL `?tab=` only | — |

Tenant managers see only these 4 tabs (`TENANT_MANAGER_TABS`); permissions/integrations/automation tabs hidden.

---

## 10. Floating + contextual actions

| Surface | Contextual? | Notes |
|---------|-------------|-------|
| **Header + FAB** (`QuickActionsMenu`) | ✅ | Permission + finance feature gated; deep links with `?action=` where implemented |
| **Dashboard quick tiles** | ❌ | All 6 actions shown **without permission filter** |
| **Page hero buttons** | ⚠️ Partial | Employees uses `manage_users`; Clients/Tasks/Finance use **`super_admin`** |
| **Search** | ✅ | Routes to module pages, not row/modal |
| **Profile / Notifications overlays** | ✅ | Mobile z-index above bottom nav (`z-[62]`) |

---

## 11. Empty states (CRM / Tasks / Finance)

| Module | Empty state | Clear? |
|--------|-------------|--------|
| **CRM** | `WorkspaceEmpty`: «لا يوجد عملاء مطابقة للبحث» | ✅ Adequate; no dedicated «add first client» for zero total |
| **Tasks** | «لا توجد مهام بعد» + CTA if `super_admin` | ⚠️ CTA hidden for `organization_manager` |
| **Finance** | Uses **`TENANT_EMPTY_STATE_MSG`** = org-structure copy («لم يتم إعداد الهيكل التنظيمي بعد») | ❌ **Wrong message for finance** |

---

## Findings by module

### Governance / Org

- Static board root; real `board_members` unused in tenant UI.
- Org role cards describe «رئيس قسم» / «مدير وكالة» without matching profile roles.
- `manager_id` columns unused.
- Dual department APIs: `useOrgStructure` (hierarchical) vs `useDepartments` (flat) — same table, different shapes.
- `InternalBlumarkOrgView` orphaned.

### Roles / Permissions

- `department_manager` and `general_manager` aliases mislead operators.
- Tenant has one real admin role: `organization_manager`.
- Permissions automatic in code; UI buttons not aligned.

### Employees

- Create flow solid (API + org assignment).
- Edit role/status does not update `profiles`.
- Employee modal roles consistent with `TENANT_ASSIGNABLE_ROLES`.

### CRM / Tasks / Finance

- Data from real Supabase tables with realtime.
- **Critical:** `isAdmin = super_admin` gates CRUD UI vs `hasPermission` on Quick Actions.
- Tasks: any page viewer can change status via dropdown (no RBAC on status).

### Settings

- Four tenant tabs persist real data to `tenant_workspace_settings`.
- Notifications preferences saved but not enforced downstream.
- Integrations tab is mock (toast only) — hidden from tenant managers.

### Dashboard / Actions

- Quick action tiles unfiltered by permission.
- Projects panel links to `/clients` (not a projects route) — misleading label.

---

## Critical issues

| # | Issue | Impact |
|---|-------|--------|
| C1 | **CRM/Tasks/Finance CRUD UI gated on `super_admin` only** while `organization_manager` has `manage_clients/tasks/finance` | Tenant managers cannot operate workspace from page buttons |
| C2 | **`general_manager` → `super_admin` mapping** | Mislabeled roles grant platform-level effective permissions |
| C3 | **Employee edit does not sync `profiles.role`** | Permission/authentication role diverges from HR record |

---

## High issues

| # | Issue | Impact |
|---|-------|--------|
| H1 | **No scoped department/agency manager RBAC** — `department_manager` → full org manager | Over-permissioning if used as literal role string |
| H2 | **Board members DB disconnected from tenant org UI** | Governance audit trail missing in product |
| H3 | **Finance empty state uses org-structure copy** | Confusing empty finance experience |
| H4 | **Org chart shows «رئيس قسم» but no assignable role** | Role consistency failure across org vs employee modal |
| H5 | **Dashboard quick actions not permission-filtered** | Users hit PageGuard or modals they cannot complete |
| H6 | **Profile «الملف الشخصي» → `/employees` admin list** | Wrong destination for self-service profile |

---

## Medium issues

| # | Issue |
|---|-------|
| M1 | `manager_id` never assigned on departments or relations |
| M2 | Settings notification toggles not wired to delivery |
| M3 | Tasks status dropdown has no permission check |
| M4 | Two department data paths (`structureDb` vs `useDepartments`) |
| M5 | `InternalBlumarkOrgView` dead code |
| M6 | Header «عرض جميع التنبيهات» → `/tasks` not notifications page |
| M7 | Header `⌘K` badge decorative — no keyboard shortcut |
| M8 | Projects card «المشاريع النشطة» links to `/clients` |
| M9 | `types/index.ts` role union diverges from `PermissionsContext` |
| M10 | PageGuard denial always mentions package upgrade even for pure RBAC |

---

## Button status matrix

| Control | Location | Works? | Gate | Notes |
|---------|----------|--------|------|-------|
| إضافة موظف | `/employees` | ✅ | `manage_users` | Correct |
| تعديل/حذف موظف | `/employees` | ✅ | `manage_users` | Correct |
| عميل جديد | `/clients` hero | ⚠️ | **`super_admin`** | Should be `manage_clients` |
| تعديل/حذف عميل | `/clients` rows | ⚠️ | **`super_admin`** | Same |
| مهمة جديدة | `/tasks` hero | ⚠️ | **`super_admin`** | Quick Action works for permitted roles |
| تعديل/حذف مهمة | `/tasks` cards | ⚠️ | **`super_admin`** | Same |
| Status `<select>` | `/tasks` | ✅ always | **None** | All viewers can change status |
| معاملة جديدة | `/finance` | ⚠️ | **`super_admin`** | Quick Action works |
| تعديل/حذف معاملة | `/finance` | ⚠️ | **`super_admin`** | Same |
| Quick Actions (FAB/Header) | Layout | ✅ | `hasPermission` + finance feature | Contextual |
| Dashboard quick tiles (×6) | `/dashboard` | ⚠️ | **None** | Always visible |
| Dashboard + orb | `/dashboard` | ✅ | Link only | No permission check |
| حفظ التغييرات | `/settings` | ✅ | tenant/platform mode | Persists to Supabase |
| Password change | Settings حساب | ✅ | Auth API | Independent of header save |
| Integration connect | Settings | ❌ mock | — | Toast only |
| Org: قسم/فريق/منصب CRUD | `/org` | ✅ | `canManageTenantOrgStructure` | Correct |
| Assign employee | Org modal | ✅ | Manager toolbar | Correct |
| الملف الشخصي | Profile panel | ⚠️ | — | Navigates to `/employees` not profile |
| عرض جميع التنبيهات | Notifications | ⚠️ | — | Goes to `/tasks` |
| ⌘K | Header search | ❌ silent | — | Decorative |
| Projects «عرض الكل» | Dashboard | ⚠️ | Card link | Whole card → `/clients` |

---

## Role / permission matrix

*(Advanced plan, all features on)*

| Permission | super_admin | org_manager | finance_manager | employee | board_member* |
|------------|:-----------:|:-----------:|:-------------:|:--------:|:-------------:|
| view_dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_users | ✅ | ✅ | ❌ | ❌ | ❌ |
| view_employees | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_tasks | ✅ | ✅ | ❌ | ✅ | ❌ |
| manage_clients | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_finance | ✅ | ✅ | ✅ | ❌ | ✅ |
| manage_reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| manage_tenant_settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| manage_board | ✅ | ✅ | ❌ | ❌ | ✅ |
| manage_roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| manage_settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| manage_automations | ✅ | ❌ | ❌ | ❌ | ❌ |

\*Internal/platform role — not tenant-assignable.

### Structural role vs profile role

| Business title | Profile role | Scoped to unit? |
|----------------|--------------|-----------------|
| مدير المنشأة | `organization_manager` | Org-wide |
| مدير مالي | `finance_manager` | Org-wide (finance) |
| مدير وكالة | — | Structure node only |
| رئيس قسم | — (alias → org_manager if stored) | Not dept-scoped |
| عضو مجلس | `board_member` | Platform/internal |
| المدير العام | **`super_admin`** (alias) | Platform |

---

## Data source matrix

| Module | Primary tables | Realtime | Mock / local |
|--------|----------------|----------|--------------|
| Auth / role | `profiles` | — | — |
| Permissions | `role_permissions` | Loaded on mount | Code defaults merged |
| Org structure | `departments`, `teams`, `positions`, `employee_relations` | Via hooks | Static board root |
| Board members | `board_members` | Hook exists | **Unused in tenant UI** |
| Employees | `employees`, `profiles` | ✅ | Performance stars UI-only semantics |
| CRM | `clients`, `activities`, `notifications` | ✅ | — |
| Tasks | `tasks`, `activities`, `notifications` | ✅ | — |
| Finance | `transactions` | ✅ | Fund split from client formula |
| Settings (4 tabs) | `tenant_workspace_settings` | Load on mount | Tab index; appearance localStorage |
| Settings (platform) | `system_settings` | — | Integration cards |
| Plan gating | `plan_features`, `plan_limits`, `organizations` | API context | — |
| Notifications UI | `notifications`, `messages` | ✅ | Delivery policy not from settings toggles |

---

## Risks

| Risk | Severity | Description |
|------|----------|-------------|
| Tenant manager lockout from CRUD UI | **Critical** | Permissions say yes; buttons say no |
| Role desync employees ↔ profiles | **Critical** | Edited employee role may not change login permissions |
| Alias over-permissioning | **High** | `department_manager` string → full org manager |
| Board governance gap | **High** | No tenant-visible board roster despite DB + permission |
| Dual department APIs | **Medium** | Reports/settings may show flat depts while org uses hierarchy |
| RLS vs UI mismatch | **Medium** | Employee writes via API; direct client writes blocked — by design but fragile |
| Unscoped task status edits | **Medium** | Employees can change any task status on kanban |
| Wrong finance empty copy | **Medium** | Operators misdiagnose empty finance as org problem |

---

## Recommended safe PR sequence

Each PR is **UI/RBAC wiring only** — no schema, auth, RLS, middleware, or Owner Panel changes unless noted as future phase.

| PR | Title | Scope | Depends on |
|----|-------|-------|------------|
| **PR5-A** | Permission-aligned CRUD buttons | Replace `isAdmin` with `canManageClients/Tasks/Finance` on Clients, Tasks, Finance pages | — |
| **PR5-B** | Employee profile sync | Employee edit calls `/api/admin/update-user` to sync `profiles.role`/status | PR5-A pattern |
| **PR5-C** | Dashboard action gating | Filter dashboard `QuickActionTile`s by same rules as `QuickActionsMenu` | PR5-A |
| **PR5-D** | Finance empty state copy | Finance-specific empty messages; stop reusing org strings | — |
| **PR5-E** | Profile panel routing | «الملف الشخصي» → settings account tab or read-only self view | — |
| **PR5-F** | Tasks status RBAC | Restrict status changes to `manage_tasks` or assignee rules | PR5-A |
| **PR5-G** | Org role label alignment | Align org role cards with assignable profile roles; document «رئيس قسم» as future scoped role or remove | Audit sign-off |
| **PR5-H** | Board members tenant UI *(optional)* | Wire `board_members` read-only or CRUD under `manage_board` on org page | Product decision |
| **PR5-I** | Manager assignment *(optional)* | Populate `departments.manager_id` / `employee_relations.manager_id` when product defines scoped RBAC | PR5-G + schema review |
| **PR5-J** | Department API unification | Consolidate `useDepartments` flat path with `useOrgStructure` | Low risk refactor |

**Do not start** alias remapping (`general_manager`, `department_manager`) or new profile roles until product defines governance model — that touches auth semantics.

---

## Audit checklist

| # | Requirement | Result |
|---|-------------|--------|
| 1 | All role sources | ✅ Documented |
| 2 | Role consistency across surfaces | ❌ Gaps (org cards vs modal vs aliases) |
| 3 | Board members real or static | **Static UI; DB real but unused** |
| 4 | General Manager highest operational | **No — `organization_manager` is tenant top** |
| 5 | Agency/Dept manager structurally supported | **Structure yes; RBAC no** |
| 6 | What managers can add | ✅ Matrix above; UI blocks org_manager on CRM/Tasks/Finance buttons |
| 7 | Permissions automatic by role | ✅ Yes (code + DB merge + plan) |
| 8 | Department assignment save/display | ✅ Mostly works; role sync broken on edit |
| 9 | Settings four tabs persist | ✅ Real Supabase persistence |
| 10 | Floating actions contextual | ⚠️ Header/FAB yes; dashboard tiles no |
| 11 | CRM/Tasks/Finance empty states | ⚠️ CRM/Tasks OK; Finance wrong copy |
| 12 | Broken/silent buttons | ✅ Matrix above |
| 13 | Supabase tables required | ✅ Data source matrix |
| 14 | Risks | ✅ Listed |
| 15 | Safe PR sequence | ✅ PR5-A through PR5-J |

---

## Supabase tables reference

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant root; plan limits |
| `profiles` | Auth role, `organization_id`, department label |
| `employees` | HR records |
| `departments` | Hierarchy nodes (`parent_id`, `structure_level`, `manager_id`) |
| `teams` | Sub-units under departments |
| `positions` | Job titles for assignment |
| `employee_relations` | Employee ↔ dept/team/position/manager |
| `board_members` | Board roster (org-scoped; **not wired to tenant org UI**) |
| `role_permissions` | Permission matrix per role |
| `tenant_workspace_settings` | Tenant company prefs (عام, إشعارات, مظهر) |
| `system_settings` | Platform settings fallback |
| `plan_features` / `plan_limits` | Package caps for org levels |
| `clients`, `tasks`, `transactions` | CRM, tasks, finance modules |
| `activities`, `notifications`, `messages` | Activity feed and messaging |

**RPCs:** `current_org_id()`, `can_manage_tenant_org()`

---

*End of audit — no implementation changes included in this document.*
