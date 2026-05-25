# Phase 2 / Issue #182 — Owner Real KPI Aggregates

## Scope

Wire Owner dashboard KPI cards to real Supabase aggregates where existing tables and fields support it. **No schema changes. Owner Panel only.**

Depends on Phase 1 truthfulness (#181) for empty-state patterns.

## Real data source matrix

| KPI card | Source | Query / logic | When unavailable |
|----------|--------|---------------|------------------|
| **المنشآت النشطة** | `organizations` | Count rows where `status = active`, not soft-deleted, not internal | Loading skeleton |
| **الاشتراكات الشهرية (MRR)** | `subscriptions` + `plans.price_monthly` / `price_annual` | Sum monthly-normalized revenue for `active`/`trialing` non-internal subs only when plan prices exist | **غير متاح بعد** (seed plans use NULL prices today) |
| **إجمالي موظفي العملاء** | `employees` | `count(*)` where `organization_id` in non-internal customer orgs (`is_owner()` RLS) | **غير متاح بعد** if table/query fails |
| **استخدام الذكاء الاصطناعي** | `ai_usage_logs` (optional) | Request count when table exists | **لم يتم تفعيل تتبع الاستخدام بعد** until Phase 3 migration |

## Activity timeline (unchanged from Phase 1)

| Source | `owner_audit_logs` | Empty state when no rows or table missing |

## Button matrix

| Control | State | Notes |
|---------|-------|-------|
| KPI cards (×4) | Display only | No buttons added |
| All other Owner sections | Unchanged | — |

## Rollback

Revert this commit. No database rollback.

```bash
git revert <commit-sha>
```

## QA checklist

- [ ] Active org count matches Supabase `organizations` (active, non-internal)
- [ ] MRR shows **غير متاح بعد** when plan prices are NULL
- [ ] Staff count matches employee rows for customer orgs (owner session)
- [ ] AI KPI shows tracking-disabled message without `ai_usage_logs`
- [ ] No customer route diffs
- [ ] Build + tsc + lint pass

## Explicitly excluded

- Migrations, billing, automations, plan limits, AI caps
- Design / sidebar / section changes
- #173 monolith branch
