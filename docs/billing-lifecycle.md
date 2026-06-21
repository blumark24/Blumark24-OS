# Billing Lifecycle Architecture

Status: C13-A internal lifecycle foundation. This document describes the billing model without adding a real payment gateway, checkout, or webhook integration.

## Existing Foundation Inspected

- `plans`, `plan_limits`, `organizations`, and `subscriptions` already exist from the owner command center foundation.
- `subscriptions.status` currently supports `active`, `trialing`, `past_due`, `cancelled`, and `suspended` at the database level.
- `payment_transactions` and `billing_events` exist as provider-neutral C9 tables.
- `payment_transactions.status` supports `pending`, `processing`, `paid`, `failed`, `canceled`, and `refunded`.
- `invoices` already exists for finance workflows and uses text status values. The lifecycle layer treats `draft`, `issued`, `paid`, `overdue`, `void`, and `failed` as the supported application states.
- Owner subscription controls exist in the owner queries layer and the owner change-plan API.
- Customer-side subscription visibility was not centralized before C13-A.

## Subscription States

- `active`: paid or internally enabled subscription with full access.
- `trialing`: trial access. It is treated as enabled until `ends_at` passes.
- `past_due`: billing issue state. Access is treated as a grace period, not a successful payment.
- `suspended`: owner-restricted state. Access should be restricted.
- `cancelled`: terminated state. Plan changes should not be applied to this subscription; create a new subscription instead.
- `expired`: application-level computed state when the end date has passed. It is not written to the current database because the existing database check constraint does not include it.

## Valid Transitions

- `active` -> `past_due`, `suspended`, `cancelled`
- `trialing` -> `active`, `past_due`, `suspended`, `cancelled`
- `past_due` -> `active`, `suspended`, `cancelled`
- `suspended` -> `active`, `cancelled`
- `cancelled` -> no direct mutation; create a new subscription
- `expired` -> no direct database write in C13-A; owner should create a new subscription or reactivate through a future approved flow

## Lifecycle Helpers

`src/lib/billing/lifecycle.ts` now provides:

- status constants for subscription, invoice, and payment lifecycles
- `canChangePlan`
- `canSuspendSubscription`
- `canCancelSubscription`
- `canReactivateSubscription`
- `isSubscriptionActive`
- `isSubscriptionPastDue`
- `getSubscriptionAccessState`
- `getRenewalWarningState`
- `getValidSubscriptionTransitions`

These helpers do not perform payment actions and do not mutate data.

## Owner Actions

Owner billing controls should validate lifecycle intent before mutating subscriptions:

- changing package is allowed for active, trialing, past-due, and suspended subscriptions
- changing package is blocked for cancelled or expired subscriptions
- suspending is allowed for active, trialing, and past-due subscriptions
- cancelling is allowed until the subscription is already cancelled or expired
- reactivation is an internal lifecycle concept for suspended or past-due subscriptions only

The owner change-plan API now checks the latest subscription lifecycle before changing the organization package.

## Tenant Billing Visibility

`/api/tenant/billing-summary` is a read-only endpoint for the signed-in tenant user. It verifies the bearer token server-side, reads the caller profile, and returns only the caller organization billing summary:

- current plan/package
- organization status
- subscription status
- access state
- renewal and expiry date
- warning state
- unpaid invoice count when available
- latest invoice summary when available

The endpoint does not expose payment secrets and does not expose other tenants.

## Invoice States

Application-level invoice states:

- `draft`: created but not issued
- `issued`: sent or ready for collection
- `paid`: settled
- `overdue`: unpaid after due date
- `void`: intentionally invalidated
- `failed`: failed collection or reconciliation state

Open invoices for customer warning purposes are `draft`, `issued`, `overdue`, and `failed`.

## Future Payment Gateway Integration Points

Future C13 phases can add a gateway adapter behind the provider-neutral billing layer:

- checkout session creation
- signed webhook verification
- payment transaction reconciliation
- invoice payment linking
- renewal automation
- retry and dunning rules
- refund handling

C13-A intentionally does not add Stripe, Tap, Moyasar, HyperPay, checkout pages, or webhook handlers.

C13-B extends this with a disabled payment provider architecture in `docs/payment-gateway-architecture.md`. The provider layer is still architecture-only and does not enable checkout, webhooks, or real charges.

## Risks Before Real Payment Integration

- Subscription state changes are still mostly owner-driven.
- `expired` is computed at the application layer and is not a database status yet.
- Invoice status values are text-based and need stronger normalization before automated payment reconciliation.
- Renewals are date-aware but not automated.
- Webhook idempotency, signature validation, and retry handling are still future work.
- A production gateway will require a separate security review, test cards/sandbox flow, and rollback plan.
