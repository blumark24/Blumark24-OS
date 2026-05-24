# PR: Org Production Units (`org_units` + `org_unit_members`)

## Migration

- `supabase/migrations/028_org_units_production.sql`

## Data model

### `org_units`
Hierarchy node per tenant: `board | agency | management | department | team`.

### `org_unit_members`
Links `employee_id` (or `profile_id`) to `org_unit_id` within the same `organization_id`.

### `board_members`
Unchanged — board layer stays in existing table; UI shows members under «مجلس الإدارة».

## Backfill

Per organization with latest `ORG_STRUCTURE_JSON` activity:

- Skips if `org_units` already has rows
- Skips invalid JSON, >500 units, unresolved parents
- Maps `kind` → `unit_type`, rebuilds parent chain with new UUIDs
- Seeds `org_unit_members` from `employees.department` matching department unit names

## App layer

- `src/lib/org/orgUnitsDb.ts` — CRUD + assign + safe apply
- `src/lib/org/orgStructure.ts` — loads from `org_units` only (no localStorage primary)

## RLS summary

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| `org_units` | same org | `organization_manager`, `board_member`, owner, super_admin |
| `org_unit_members` | same org | same |

## organization_manager

- Full CRUD on org units and members within `current_org_id()`
- No change to `employees` table (placement via `org_unit_members`)
