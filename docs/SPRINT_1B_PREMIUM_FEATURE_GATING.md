# Sprint 1B — Premium Feature Gating

Date: 2026-06-27
Scope: feature-flag schema only. No UI, Auth, RLS, middleware, Supabase
migrations, API routes, or business logic were modified. No real
integrations were implemented and no secrets were added.

## What Changed

Single source file: `src/lib/features/packageFeatures.ts`.

- `WorkspaceFeature` (type union) gained two members:
  - `virtual_office`
  - `external_integrations`
- `ALL_WORKSPACE_FEATURES` (array) gained the same two members (appended
  at the end; existing order preserved).
- `WORKSPACE_ROUTES` virtual_office route now has `feature: "virtual_office"`
  (was `feature: null`). Route order, `href`, `permission`, `audience`,
  `iconName`, and the Arabic label (`المكتب الافتراضي`) are unchanged.
- `PLAN_FEATURES` defaults updated:
  - `basic` — unchanged.
  - `growth` — unchanged.
  - `advanced` — appended `"virtual_office"`, `"external_integrations"`.
  - `enterprise` — appended `"virtual_office"`, `"external_integrations"`.

No new routes were added (external integrations have no `WorkspaceRouteDef`
this sprint, per task #8).

## Exact Files Changed

- `src/lib/features/packageFeatures.ts`
- `docs/SPRINT_1B_PREMIUM_FEATURE_GATING.md` (this file)

## Package Defaults (post-1B)

| Plan | Includes `virtual_office` | Includes `external_integrations` |
|---|---|---|
| `basic` | no | no |
| `growth` | no | no |
| `advanced` | yes | yes |
| `enterprise` | yes | yes |

`PLAN_FEATURES` is described in code as seed defaults / migration-020 fallback;
runtime gating still reads `enabledFeatures` from the workspace-context API.
Owner-managed `plan_features` rows continue to win at runtime — the owner can
add or remove `virtual_office` / `external_integrations` per plan without code
changes.

## Tools Covered Under `external_integrations`

This flag is the umbrella gate. Each tool below is in scope for future
sprints. None has any code, connector, route, secret, or env handling in
this sprint.

- Vercel
- Supabase
- GitHub
- Google Drive
- Replit
- Lovable
- Figma
- Canva
- Adobe Photoshop
- Gmail

## Owner-Controlled Feature Note

The owner panel writes `plan_features` rows that the workspace-context API
maps into `enabledFeatures: WorkspaceFeature[]`. After this sprint, the
owner can:

- Grant `virtual_office` or `external_integrations` to a `basic` / `growth`
  plan tenant on demand (still gated by `canAccessWorkspaceRoute`).
- Revoke `virtual_office` from `advanced` / `enterprise` tenants;
  `WORKSPACE_ROUTES` virtual_office now respects this revocation because
  its `feature` is no longer `null`.

`PLAN_FEATURES` is fallback-only. The owner-controlled `enabledFeatures`
array remains the source of truth at runtime.

Note: the owner UI feature toggle list lives in
`src/app/owner/_lib/planMutations.ts` (`OWNER_WORKSPACE_FEATURES`). It is an
independent enum and was not modified in this sprint, so owner-facing
toggles for the two new keys will arrive when that file is opened in a
later sprint. Runtime gating is unaffected.

## Security Note

- No real integration code, OAuth flow, webhook, or API connector was added.
- No env variables, secrets, tokens, or third-party SDK calls were
  introduced.
- No Supabase schema, RLS policy, migration, or API route was touched.
- The change is type/data only; runtime behavior changes only in that the
  virtual_office route is now gated by the `virtual_office` feature flag.

## How To Test

```bash
npm run lint            # PASS (pre-existing <img> warning only)
npm run build           # PASS
npm run verify:isolation  # PASS (static checks)
```

Manual sanity (no automation added this sprint):

1. Sign in as a tenant on plan `basic`. Confirm `/virtual-office` is not
   in the sidebar and visiting the URL is denied by the workspace gate.
2. Owner: open `plan_features` for the tenant's plan, grant
   `virtual_office`. Reload the tenant — the route appears.
3. Repeat with `advanced` / `enterprise`: route appears by default.
4. Confirm no UI redesign — only the visibility of the virtual_office nav
   entry can change for `basic` / `growth` tenants.

## What Remains For Sprint 1C

1. Update owner UI feature toggles (`src/app/owner/_lib/planMutations.ts`
   and `PlansPageContent.tsx`) so owners can grant the two new flags from
   the panel.
2. Add Arabic owner-side labels for `virtual_office` and
   `external_integrations` in `OWNER_FEATURE_LABELS_AR`.
3. Optional Supabase migration to seed `plan_features` rows for the two
   new keys on advanced / enterprise. Schema change — must be its own
   sprint.
4. Spec the `/integrations` route (single hub, gated by
   `external_integrations`) — no per-tool routes. Defer implementation.
5. Spec per-tool integration contracts (Vercel, Supabase, GitHub, Google
   Drive, Replit, Lovable, Figma, Canva, Adobe Photoshop, Gmail) including
   scope, secret storage, RLS impact, audit logging. Documentation only.
6. Add a CI assertion (in `safety-gates.yml` or `verify-tenant-isolation.mjs`)
   that `PLAN_FEATURES.basic` and `PLAN_FEATURES.growth` never contain
   premium-only flags — prevents regression of this sprint.
