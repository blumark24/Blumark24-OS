# Phase 1 — Owner Panel Truthfulness

## Scope

Remove fake operational metrics from the Owner command center dashboard (`/owner`) while keeping layout, sections, and visual identity unchanged.

**No schema changes. No migrations.**

## Changes

| Section | Before | After |
|---------|--------|-------|
| KPI cards (MRR, AI %, staff) | Static fake numbers + trends | `—` + **غير متاح بعد** |
| KPI card (active orgs) | Real when DB loaded | Unchanged — live count from Supabase |
| AI usage card | Fake message counts | **لم يتم تفعيل تتبع الاستخدام بعد** until `ai_usage_logs` exists |
| Activity timeline | Fake sample events | Real rows from `owner_audit_logs` or **لا توجد نشاطات مسجّلة بعد** |

## Button matrix

| Control | State | Notes |
|---------|-------|-------|
| KPI cards | Display only | No buttons |
| AI usage card | Display only | Empty state — no actions |
| Activity timeline | Display only | Read-only list or empty state |
| All other Owner sections | Unchanged | Orgs table, plans, sidebar, etc. |

## Rollback

Revert this commit only. No database rollback required.

```bash
git revert <commit-sha>
```

## QA checklist

- [ ] `/owner` — no fake KPI numbers (124, SAR 48,000, 78%, 1,248)
- [ ] AI card shows Arabic disabled message when `ai_usage_logs` absent
- [ ] Activity shows real audit rows after owner actions, or empty state
- [ ] Layout grid unchanged (4 KPIs, same cards, same sidebar)
- [ ] Customer workspace routes unchanged
- [ ] Build + lint pass

## Follow-up (not Phase 1)

- WhatsApp card + system status footer still use placeholder constants in `_data.ts` (separate micro-PR)
- Phase 3 will add `ai_usage_logs` migration and wire full AI aggregates
