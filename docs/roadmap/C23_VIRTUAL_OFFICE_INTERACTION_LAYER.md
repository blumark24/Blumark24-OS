# C23 - Virtual Office Interaction Layer

## Status

Planned module only. Do not implement before SEC-1B and Meetings Center are complete and approved.

## Goal

Transform the Virtual Office from a static office map into a live operational workspace with avatars, room presence, meetings, role-aware movements, and AI-assisted office intelligence.

The experience must remain a premium 2D enterprise workspace, not a game and not a heavy 3D scene.

## Placement

This module belongs after:

1. SEC-1B legacy helper function deprecation and tenant-isolation verification.
2. Meetings Center foundation and governance.

No Production database change, migration application, deploy, or realtime activation is allowed without explicit approval.

## Scope rules

- Keep the experience 2D and premium visual first.
- Do not use heavy 3D libraries.
- Do not make the experience feel like a game.
- Preserve Arabic RTL behavior and Blumark24 premium enterprise identity.
- Connect the module with My Desk, Meetings Center, Tasks, Employees, Org Structure, AI Assistant, and Notifications.
- Keep movement data minimal, operational, and scoped by `organization_id`.

## Core capabilities

### 1. User avatars

Each visible avatar should support:

- `avatar`
- `name`
- `role`
- `department`
- `status`
- `current_room`
- `last_seen`

### 2. Presence states

Allowed states:

- `online`
- `away`
- `busy`
- `in_meeting`
- `offline`

Presence must be consent-aware, tenant-scoped, and never silently track unnecessary private behavior.

### 3. Office rooms

Initial operational rooms:

- Manager office
- Employee desks
- Meeting room
- Secretary office
- Waiting area
- Reports room
- AI command room

### 4. Movement

Users may move between authorized rooms only.

Movement rules:

- Every movement record must include `organization_id`.
- Movement is visible only inside the same organization and permitted role scope.
- Movement must not become private behavior tracking.
- Employee movement must be limited to allowed rooms and allowed work context.

### 5. Meetings inside office

Meeting room behavior should support:

- Meeting room booking.
- Attendee avatars entering the room.
- Meeting status: `scheduled`, `in_progress`, `completed`, `cancelled`.
- Agenda.
- Minutes draft.
- Action items.
- Linked client.
- Linked project.
- Linked tasks.

Meeting attendees must always belong to the same `organization_id`.

### 6. Role-aware visibility

Visibility model:

- CEO sees company-level office activity.
- Manager sees team activity.
- Employee sees only own desk, own meetings, and own tasks.
- Secretary sees meetings, calendar, minutes, and follow-ups.
- Owner sees tenant-level overview only through owner permissions.

No role may bypass tenant isolation.

### 7. AI Secretary

The AI Secretary can:

- Prepare meeting agenda.
- Draft meeting minutes.
- Extract action items.
- Prepare follow-up drafts.

The AI Secretary must not send anything externally without explicit approval.

### 8. AI Office Brain

The AI Office Brain can:

- Summarize office status.
- Detect delayed tasks.
- Identify busy employees.
- Recommend next action.

The AI Office Brain must never write sensitive data or execute sensitive actions without explicit approval.

## Integration targets

- My Desk: own desk, own tasks, own meetings, and daily context.
- Meetings Center: bookings, agenda, minutes, action items, and meeting status.
- Tasks: linked action items and delayed-task detection.
- Employees: avatars, role, department, team scope, and availability.
- Org Structure: role and department boundaries.
- AI Assistant: approved agenda, summaries, drafts, recommendations.
- Notifications: approved internal alerts and follow-up reminders.

## Data and privacy guardrails

- All persisted office presence, movement, meeting, and action records must include `organization_id`.
- Realtime channels must be tenant-scoped and permission-aware.
- Employee private tasks must not be exposed through office presence.
- Cross-organization reads, updates, deletes, and realtime events must be blocked.
- Sensitive actions must be audit logged.
- External sending requires explicit approval.
- Production remains untouched until the preview isolation plan passes and an approval is recorded.

## Acceptance criteria

Pass only if:

- Org A never sees Org B office presence.
- Org B never sees Org A office presence.
- Employee cannot see other employees' private tasks.
- Employee cannot enter unauthorized rooms.
- Meeting attendees are scoped to the same organization.
- Realtime presence does not leak cross-tenant data.
- Sensitive actions are logged.
- Owner and super-admin access is intentional, controlled, and auditable.
- No Production changes occur without explicit approval.

## Non-goals for this module plan

- No implementation in this planning step.
- No Supabase migration in this planning step.
- No API, RLS, Auth, or realtime channel change in this planning step.
- No Vercel deploy in this planning step.
- No heavy 3D library.
- No game mechanics or game-like interaction model.

## Required readiness before implementation

- SEC-1B is complete or explicitly deferred with documented approval.
- Meetings Center has a stable data and permission model.
- Preview-only tenant isolation tests pass.
- Presence consent and privacy gates are approved.
- Room authorization rules are documented.
- AI approval boundaries are documented.
- Rollback and kill-switch behavior is defined.

## Final rule

This module may move from planned to implementation only after explicit approval for:

- Preview branch or disposable Preview project.
- Preview migration application.
- Seeded isolation test data.
- Realtime tenant-scope validation.
- AI Secretary and AI Office Brain action boundaries.
