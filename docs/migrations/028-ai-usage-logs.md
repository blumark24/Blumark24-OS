# Migration 028 — AI Usage Logs (PR C)

## Apply

Run `supabase/migrations/028_ai_usage_logs.sql` in Supabase SQL editor **before** deploying PR C app changes.

## What it enables

- `ai_usage_logs` table for tenant AI chat request logging
- Owner `/owner` usage aggregates and KPI AI percentage
- No monthly cap enforcement (that is PR D)

## Rollback

```sql
DROP TABLE IF EXISTS public.ai_usage_logs CASCADE;
```

Revert app deploy to remove logging calls (graceful if table missing — queries return empty).
