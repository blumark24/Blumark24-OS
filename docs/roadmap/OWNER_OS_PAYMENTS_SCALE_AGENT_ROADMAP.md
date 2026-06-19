# Owner OS Payments, Scale, and Executive Agent Roadmap

Date: 2026-06-19
Scope: Owner Control Center, billing automation, 1000+ tenant readiness, executive agent

## Executive direction

Blumark24 OS must operate like a professional SaaS company:

1. A customer subscribes and pays.
2. The system creates or activates the tenant workspace automatically.
3. The correct package features open immediately.
4. The owner dashboard tracks revenue, tenants, risk, support, and operations.
5. An executive AI agent assists the owner when absent.

This document locks the next operating roadmap after B1 Owner Plan Editor.

---

## B1 — Owner Plan Editor

Status: in progress.

Goal:

- Manage existing packages from the owner dashboard without Supabase access.

Included:

- Edit plan pricing.
- Edit plan limits.
- Activate/deactivate plans.
- Manage plan features.
- Record owner audit logs.

Remaining:

- Create new plan wizard.
- Plan change history UI.

---

## B2 — Owner Audit Center

Goal:

Create a full owner-facing audit center based on `owner_audit_logs`.

Required views:

- Recent owner actions.
- Plan changes.
- Organization changes.
- Subscription changes.
- User provisioning actions.
- Suspensions/reactivations.
- Deleted/restored tenants.

Required filters:

- By action.
- By target type.
- By organization.
- By owner email.
- By date range.

Business purpose:

- No critical owner action should disappear.
- The owner can review what happened while away.

---

## B3 — Customer Provisioning Wizard

Goal:

Turn customer onboarding into one professional flow.

Current state:

- Create organization.
- Create client login.
- Activate subscription.
- Change plan.

These exist, but some are separate steps.

Target flow:

1. Enter business name.
2. Enter owner email.
3. Choose plan.
4. Choose billing cycle.
5. Create tenant.
6. Create login.
7. Activate subscription.
8. Send secure password/reset email.
9. Show final onboarding summary.

Important rule:

- If one step fails, the UI must show which step failed and whether the tenant is partially created.

---

## B4 — Payments and Subscription Automation

Goal:

Connect payments to SaaS activation.

Target behavior:

1. Customer chooses package.
2. Customer pays online.
3. Payment provider webhook reaches Blumark24 OS.
4. System verifies payment authenticity.
5. System creates or activates subscription.
6. System assigns correct plan.
7. System opens correct feature gates.
8. Owner dashboard shows revenue and subscription state.

Required database concepts:

- `payment_providers`
- `payment_customers`
- `payment_orders`
- `payment_transactions`
- `payment_webhook_events`
- `subscription_invoices`
- `subscription_entitlements`

Required statuses:

- pending
- paid
- failed
- refunded
- cancelled
- trialing
- active
- past_due
- suspended

Required webhook safety:

- Signature verification.
- Idempotency key.
- Store raw event safely.
- Never trust frontend payment status alone.
- Only activate subscription after verified server-side webhook.

Owner dashboard additions:

- MRR.
- ARR.
- Active subscribers.
- Failed payments.
- Upcoming renewals.
- Payment provider health.
- Manual override with audit log.

Operational rule:

- Payment success opens the subscription.
- Payment failure does not delete data; it changes account/subscription state.

---

## B5 — 1000+ Tenant Readiness

Goal:

Prepare Blumark24 OS to safely handle more than 1000 customers.

Required areas:

### Database

- Confirm all tenant tables have `organization_id` indexes.
- Review RLS policy performance.
- Add pagination to heavy owner pages.
- Avoid loading all tenants when data grows.
- Add read models for owner KPIs.

### Frontend

- Paginated tables.
- Search/filter server-side for large lists.
- Loading skeletons.
- Empty/error states.

### Operations

- Rate limits for provisioning and admin APIs.
- Runtime error monitoring.
- Daily backup/recovery check.
- Incident runbook.
- Admin action audit trail.

### Scale target

- 1000+ tenant organizations.
- 10,000+ users/employees.
- 100,000+ activity/audit rows.
- Owner dashboard still loads quickly.

---

## B6 — Executive AI Agent for Owner Panel

Goal:

Create an AI executive agent that works as the owner’s assistant when absent.

Role:

- Executive assistant inside Owner Control Center.
- Observes business health.
- Summarizes what changed.
- Flags risks.
- Suggests actions.
- Drafts owner actions, but does not execute destructive actions without approval.

Agent capabilities:

- Daily owner brief.
- Revenue summary.
- New customers summary.
- Suspended/past-due accounts summary.
- Failed provisioning detection.
- Important audit log summary.
- Plan usage summary.
- Support/risk notes.

Allowed autonomous actions:

- Summarize.
- Draft recommendations.
- Prepare checklists.
- Classify risk.
- Notify owner.

Approval-required actions:

- Change plan.
- Suspend customer.
- Reactivate customer.
- Refund/payment action.
- Delete/soft-delete tenant.
- Create paid subscription.
- Send external customer message.

Required tables/concepts:

- `owner_agent_runs`
- `owner_agent_tasks`
- `owner_agent_insights`
- `owner_agent_approvals`
- `owner_agent_memory`

Owner dashboard UI:

- Executive Brief card.
- Risk Alerts card.
- Waiting for Approval card.
- Revenue/tenant summary card.
- Agent activity timeline.

Security principle:

- The agent assists the owner; it does not become the owner.
- Every action must be traceable in audit logs.

---

## Roadmap order

Recommended order:

1. Finish B1 Plan Editor.
2. Build B2 Owner Audit Center.
3. Build B3 Customer Provisioning Wizard.
4. Build B4 Payments and Subscription Automation.
5. Build B5 1000+ Tenant Readiness.
6. Build B6 Executive AI Agent.

Reason:

- Payments require reliable plans, subscriptions, audit logs, and provisioning first.
- The executive agent needs clean operational data before it can provide useful decisions.

---

## Launch rule

Do not open broad public self-serve subscription before:

- Payments webhook verification exists.
- Subscription activation is server-side.
- Audit center is visible.
- Provisioning wizard handles partial failures.
- Owner dashboard supports scale pagination.

Controlled manual onboarding remains acceptable before B4 is complete.
