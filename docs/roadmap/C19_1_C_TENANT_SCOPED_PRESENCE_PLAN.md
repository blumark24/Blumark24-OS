# C19.1-C — Tenant-Scoped Presence Plan

## Goal

Define the future live-presence scope before any realtime connection is created.

This stage is a planning and safety layer only.

## What this stage adds

```txt
src/lib/virtual-office/tenantPresencePlan.ts
src/lib/virtual-office/__tests__/tenantPresencePlan.acceptance.ts
```

The plan defines:

- Tenant-scoped channel naming.
- Office-scoped boundaries.
- Manual user status payload shape.
- Consent requirement.
- Server validation requirement.
- RLS readiness requirement.
- Idle timeout bounds.

## Channel format

```txt
tenant:{tenantId}:office:{officeNumber}:presence
```

Example:

```txt
tenant:tenant-a:office:05:presence
```

## Scope key format

```txt
{tenantId}/office-{officeNumber}
```

Example:

```txt
tenant-a/office-05
```

## Payload shape

```ts
{
  tenantId: string;
  officeNumber: number;
  userId: string;
  displayName: string;
  roleOrUnit: string;
  status: "available" | "busy" | "away" | "offline";
  manual: true;
  consentGranted: true;
  expiresInSeconds: number;
}
```

## Safety preserved

- No realtime channel is created.
- No online status is shown.
- No live attendance is enabled.
- No Supabase channel code is added.
- No database writes.
- No API/Auth/RLS changes.
- No voice/video/WebRTC.
- No message sending.
- No image replacement.
- No map coordinate changes.
- No `CHIP_POSITIONS` changes.
- No `rooms.map` order changes.
- No localStorage/sessionStorage.

## Product behavior

The virtual office now has a clear future plan for live presence, but the current product still displays honest inactive status until all gates are approved.

## Next

C19.1-D — User consent and privacy UI.

That stage can add a disabled consent preview panel and explain what will be shared before any live presence activation.
