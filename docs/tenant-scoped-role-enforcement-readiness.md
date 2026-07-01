# Scoped Role Enforcement Readiness

This document is an audit/readiness note only. Scoped role enforcement is not enabled.

No DB/RLS/Auth/UI changes are included here. This audit does not change routes, permissions, data filters, API behavior, RLS policies, database schema, Auth flow, or user interface behavior.

Verification phrase: no DB/RLS/Auth/UI changes.

## Current State After #498 And #499

- `scopedRoleResolver` exists as a read-only resolver for deriving tenant scoped role signals from existing organization structure data.
- `scopedRoleVisibilityContract` exists as a contract-only visibility description for the scoped roles.
- `PermissionsContext` still provides coarse role permissions and does not enforce agency, management, department, or employee visibility boundaries.
- `PageGuard` still works as a package/permission route guard only.
- `useData` applies `organization_id` guards only; it does not apply hierarchy scope filtering.
- `dashboard-summary` uses tenant JWT/RLS behavior and organization-level data access, not the scoped role contract.
- `aiContext` uses organization-level summaries and does not consume the scoped role contract.
- `officeScope` in virtual-office has an independent scoped model that can inform future tenant scoped visibility work.

## Readiness Table

| Area | Current State | Readiness | Later Requirement |
| --- | --- | --- | --- |
| `PermissionsContext` | Coarse role permissions only | Not ready for scoped enforcement | Add shadow scoped awareness before any behavior change |
| `PageGuard` | Route-level package/permission guard | Not ready for scoped enforcement | Optional scoped awareness in a separate PR |
| `useData` | Organization-level reads/writes with `organization_id` guards | Ready for tenant isolation, not scoped hierarchy | Add optional scoped filtering only after shadow checks |
| `dashboard-summary` API | Tenant JWT/RLS and organization summary behavior | Not ready for scoped hierarchy | Define per-scope summary rules before filtering |
| `aiContext` | Organization-level summaries | Not ready for scoped AI context | Build scoped AI context manifest first |
| `virtual-office officeScope` | Independent scoped access model exists | Useful reference | Reuse concepts without coupling enforcement directly |
| Supabase RLS | Organization-level isolation policies | Not ready for hierarchy enforcement | Review only if app-layer shadow checks prove insufficient |
| DB schema | Existing departments, employee relations, manager ids | Sufficient for read-only readiness | Schema/RLS review only if durable scoped enforcement needs more data |

## Enforcement Decision

- enforcement is not enabled.
- Scoped role enforcement must not be enabled inside this audit PR.
- Any future enforcement must be introduced in a separate PR.
- Future enforcement should start with read-only shadow checks, then move gradually through scoped manifests and optional guards.
- The current contract must remain advisory until explicit enforcement PRs are reviewed.

## Future Phase Plan

- Phase 3C-4: shadow scoped checks only.
- Phase 3C-5: scoped AI context manifest.
- Phase 3C-6: optional PageGuard scoped awareness.
- Phase 3C-7: optional useData scoped filtering.
- Phase 3C-8: RLS/schema review only if needed.

## Explicit Non-Changes

- No UI changes.
- No route behavior changes.
- No DB changes.
- No schema changes.
- No migrations.
- No RLS changes.
- No Auth changes.
- No enforcement behavior.
- No `PermissionsContext` behavior changes.
- No `PageGuard` behavior changes.
- No `useData` filtering behavior changes.
- No AI assistant UI.
- No presence.
- No meetings.
