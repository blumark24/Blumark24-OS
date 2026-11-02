# BLUMARK DESIGN GUARDIAN V1 — Read-only Design Preservation

**Owner:** Blumark24 Holding → Board → DEF (internal QA).
**Target:** Blumark24 OS first, then ATK-1 Services; SMART HSR municipal UI remains frozen under its separate security/release gates.
**Mode:** MONITOR / ADVISE only. No design edits, no auto-merge, no auto-deploy, no credentials, no client data.

## Existing design is the authority

- `docs/design-system-v1.md` → official design guidelines.
- `src/styles/design-tokens.css` → design-token contract.
- `public/brand/` → protected identity assets.
- `docs/BLUMARK24_MOBILE_DASHBOARD_REFERENCE_PREVIEW.md` → a *reference preview*, not signed-off production baseline.
- First source comparison ref: `f03a88e55ea4326cd01c4a9c1f7ee0391c7e5a82` from `design/classic-dashboard-day-night-final-20261014`. This is **not automatically approved as the production design**. Board/design owner must approve actual screenshots.

## What V1 can and cannot prove

`scripts/design-guardian/audit.mjs` reports **paths** changed since an immutable SHA. It flags edits to official brand assets, shared design tokens, shell/navigation, dashboard, task screens, UI components and the static design preview.

This is a **static scope detector**, not image inspection. The result always says `visualComparisonStatus: NOT_PERFORMED` and `screenshotsApproved: false`. A zero-diff report never authorizes visual approval.

## Local operation

Requires Node.js 20+ and a local Git checkout of the branch. Uses no external service, npm install or credentials.

```sh
node --test test/design-guardian.test.mjs
node scripts/design-guardian/audit.mjs --base f03a88e55ea4326cd01c4a9c1f7ee0391c7e5a82
```

The inspector only invokes `git rev-parse HEAD` and `git diff --name-only`. It cannot change source files, settings or Production.

## Next gate: visual baseline approval (NOT EXECUTED)

1. Decide which of the existing competing Blumark24 OS dashboard designs the Board actually approves; don't call a Draft PR approved by default.
2. Capture **synthetic-only**, isolated screenshots for Dashboard and Tasks on desktop 1440 px, tablet 820 px and phone 390 px, for both Day and Night (RTL + reduced-motion). Use an access-controlled artifact store.
3. Record SHA, browser version, viewport, theme, approved reference, reviewer, date. Do not capture private employees, tenant clients, session tokens or municipal citizens.
4. Compare screenshots using Playwright `toHaveScreenshot` or a review equivalent; flag cropped dialogs, wrong sidebar side, missing branded header, light-mode glare, unreadable text, and mobile overflow.
5. Require human signoff before any code is changed or merged. Unslop is advisory, never automatic replacement of approved design.

## Safety and acceptance

- This change must contain ONLY `scripts/design-guardian/**`, `test/design-guardian.test.mjs` and this file.
- Branch prefix `docs-*` is listed under `vercel.json` with `deploymentEnabled: false`. Still verify that no deploy occurred.
- No new GitHub workflow or auto-trigger is activated; the monitor is callable when an operator wants a read-only review.
- V1 is done when tests run, the three-file branch is reviewed, and Production remains untouched.
- V2 screenshot-based visual regression requires a separately approved safe fixture and baseline.
