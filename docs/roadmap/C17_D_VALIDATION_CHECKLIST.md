# C17-D — Validation Checklist

## Required local checks

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run verify:isolation
```

## Required deployment checks

- Confirm Vercel deployment completes from `main`.
- Confirm no preview quota errors block the final production deploy.
- Confirm environment variables are present only in the deployment environment.

## Required Supabase checks

- Confirm RLS is enabled on production-facing tables.
- Confirm tenant-scoped queries do not leak cross-tenant data.
- Confirm owner/admin reads are role-protected.

## Required product checks

- Virtual office map still renders.
- Office chip coordinates are unchanged.
- Board office remains OFFICE 05.
- Unassigned offices stay empty until linked.
- No fake employees, files, reports, presence, or meetings appear.
- Text invites remain draft-only.
- Meeting rooms remain text-only.
- Production readiness is shown as validation state, not a false completion claim.

## Release decision

Only mark release-ready when all checks pass.
