# Migration 029 — Plan Limits Enforcement (PR D)

**Do not merge until tested on Supabase staging.**

Depends on: migration **028** (`ai_usage_logs`) for AI monthly cap counting. Migration **019** (`departments`) must exist for department trigger.

## Preflight validation

Run in Supabase SQL editor before applying:

```sql
-- Required functions
SELECT proname FROM pg_proc
WHERE proname IN ('current_org_id', 'get_my_role', 'is_owner')
  AND pronamespace = 'public'::regnamespace;

-- Required tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'plan_limits', 'departments', 'employees');

-- Sample plan limits present
SELECT p.slug, pl.limit_key, pl.limit_value
FROM plan_limits pl
JOIN plans p ON p.id = pl.plan_id
WHERE pl.limit_key IN ('max_departments', 'max_employees', 'ai_level')
ORDER BY p.slug, pl.limit_key;

-- Count departments/employees per org (baseline before triggers)
SELECT o.slug, COUNT(DISTINCT d.id) AS departments, COUNT(DISTINCT e.id) AS employees
FROM organizations o
LEFT JOIN departments d ON d.organization_id = o.id
LEFT JOIN employees e ON e.organization_id = o.id
GROUP BY o.slug
ORDER BY o.slug;
```

If any org already exceeds `max_departments` or `max_employees`, fix data or raise limits **before** applying triggers — otherwise new inserts will fail with `plan_limit_exceeded`.

## Apply

Run `supabase/migrations/029_plan_limits_enforcement.sql`.

## App changes (same PR)

- `src/lib/planLimits.ts` — AI monthly cap check in `/api/ai/chat`
- `src/hooks/useData.ts` — explicit `organization_id` filters (defense-in-depth)

## Staging test checklist

1. Tenant at department cap cannot insert another department (expect DB error).
2. Tenant at employee cap cannot insert another employee.
3. AI chat returns `429 AI_LIMIT_EXCEEDED` when monthly log count exceeds `ai_level * 50`.
4. Owner / super_admin bypass triggers (internal operations still work).

## Rollback

```sql
DROP TRIGGER IF EXISTS trg_enforce_plan_limit_departments ON public.departments;
DROP TRIGGER IF EXISTS trg_enforce_plan_limit_employees ON public.employees;
DROP FUNCTION IF EXISTS public.enforce_plan_limit_departments();
DROP FUNCTION IF EXISTS public.enforce_plan_limit_employees();
```

Revert app deploy to remove AI cap check and hook-level org filters.

## Notes

- Triggers do not retroactively delete over-cap rows.
- AI cap requires `ai_usage_logs` from PR C; if 028 is not applied, cap count is always zero.
