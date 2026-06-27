# Sprint 1C — Org + Virtual Office Deletion Safety

Date: 2026-06-27
Scope: defensive pre-delete validation only. No UI, Auth, RLS, middleware,
Supabase migrations, API routes, or package gating were touched. No real
integrations or secrets were added.

## What Changed

Single source file: `src/lib/org/structureDb.ts`. Three existing exports
gained a pre-flight assertion that throws a clear Arabic error before
the DB delete is issued:

- `deleteDepartment(id)`
- `deleteTeam(id)`
- `deletePosition(id)`

Three private helpers were added:

- `assertDepartmentSafeToDelete(id)`
- `assertTeamSafeToDelete(id)`
- `assertPositionSafeToDelete(id)`

Plus two query helpers that the asserts share:

- `countActiveEmployeesInRelation(field, id)` — counts active employees
  (filtered by `ACTIVE_EMPLOYEE_STATUS_VALUES`) joined via
  `employee_relations`.
- `countActiveVirtualOfficeMappings(types, id)` — counts active rows in
  `executive_office_room_mappings` for the given `mapped_unit_type[]` and
  `mapped_unit_id`.

No schema, migration, RLS, or API route was modified. The existing FK
cascades remain in place — these guards stop the call before the delete
ever reaches the database when the unit is still in use.

## Exact Files Changed

- `src/lib/org/structureDb.ts`
- `docs/SPRINT_1C_ORG_VIRTUAL_OFFICE_DELETION_SAFETY.md` (this file)

## Blocked Deletion Cases

### Department (`deleteDepartment`)

| Condition | Arabic error |
|---|---|
| Has an active mapping in `executive_office_room_mappings` (`mapped_unit_type` in `agency`/`management`/`department`, `is_active = true`) | `لا يمكن حذف هذا القسم لأنه مرتبط بمكتب افتراضي.` |
| Has at least one active employee assigned via `employee_relations.department_id` (employee `status` in `ACTIVE_EMPLOYEE_STATUS_VALUES`) | `لا يمكن حذف هذا القسم لأنه يحتوي على موظفين.` |
| Has child departments (`departments.parent_id = id`), child teams (`teams.department_id = id`), or position assignments (`employee_relations.department_id = id AND position_id IS NOT NULL`) | `لا يمكن حذف هذا القسم لأنه يحتوي على فرق أو مناصب.` |

### Team (`deleteTeam`)

| Condition | Arabic error |
|---|---|
| Active VO mapping with `mapped_unit_type = 'team'` | `لا يمكن حذف هذا الفريق لأنه مرتبط بمكتب افتراضي.` |
| Has at least one active employee assigned via `employee_relations.team_id` | `لا يمكن حذف هذا الفريق لأنه يحتوي على موظفين.` |

### Position (`deletePosition`)

| Condition | Arabic error |
|---|---|
| Has at least one active employee assigned via `employee_relations.position_id` | `لا يمكن حذف هذا المنصب لأنه يحتوي على موظفين.` |
| Has child positions (`positions.parent_id = id`) | `لا يمكن حذف هذا المنصب لأنه يحتوي على مناصب فرعية.` |

Order matters: VO mapping is checked first so users see the strongest
business reason. Active employees come next. Structural children last.

## Safe Deletion Cases (Behavior Unchanged)

- Department with **no** active VO mapping, **no** active employees, **no**
  child departments, **no** child teams, and **no** position assignments
  via `employee_relations` — deletes normally.
- Team with no active VO mapping and no active employees — deletes
  normally.
- Position with no active employees and no child positions — deletes
  normally.
- Employees with non-active status (`inactive`, `terminated`, etc.) do
  not block deletion. They only block when their status is in
  `ACTIVE_EMPLOYEE_STATUS_VALUES`.
- VO mappings marked `is_active = false` do not block deletion.

## How To Test

```bash
npm run lint              # PASS (pre-existing <img> warning only)
npm run build             # PASS
npm run verify:isolation  # PASS (static checks)
```

Manual sanity (no automation added this sprint):

1. Create an empty department with no employees/teams/children. Delete it
   from the org page — succeeds.
2. Assign an active employee to a department. Attempt delete — fails with
   `لا يمكن حذف هذا القسم لأنه يحتوي على موظفين.`
3. Map a department to a virtual office room (Owner / Executive Office
   mapping). Attempt delete — fails with
   `لا يمكن حذف هذا القسم لأنه مرتبط بمكتب افتراضي.`
4. Create a child department under a parent. Attempt to delete the
   parent — fails with
   `لا يمكن حذف هذا القسم لأنه يحتوي على فرق أو مناصب.`
5. Create a team under a department; assign an active employee to it.
   Attempt to delete the team — fails with
   `لا يمكن حذف هذا الفريق لأنه يحتوي على موظفين.`
6. Create a position with a child position. Attempt to delete the parent
   position — fails with
   `لا يمكن حذف هذا المنصب لأنه يحتوي على مناصب فرعية.`

## What Remains For Sprint 1D

1. Surface the new Arabic errors in the org UI's delete confirmation
   toast/dialog without redesigning the dialog. (UI sprint — not this
   one.)
2. Add unit tests around the three asserts using a mocked Supabase
   client (jest/vitest). The repo has no test runner today; introducing
   one is its own sprint.
3. Add an audit log entry when a delete is blocked (table + RLS via a
   migration). Out of scope here — needs a migration sprint.
4. Mirror these guards in any server-side or future API route that
   issues the same deletes — currently all delete calls flow through
   `structureDb.ts`, so this is preventive.
5. Spec a soft-delete / archive flow as a non-destructive alternative,
   so org admins can retire a department without losing audit trail.
   Documentation only.
6. Add a CI assertion (e.g. in `verify-tenant-isolation.mjs`) that the
   three `delete*` exports still call their respective `assert*` helper —
   prevents accidental regression.
