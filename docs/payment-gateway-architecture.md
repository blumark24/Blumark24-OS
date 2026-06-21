# Payment Gateway Architecture

Status: C13-B architecture foundation only. No real payment gateway is enabled.

## Purpose

Blumark24 OS needs a safe payment layer that can later support Saudi-market providers without coupling product code to a single SDK. C13-B adds TypeScript contracts, disabled provider placeholders, and future integration rules. It does not charge cards, create checkout sessions, verify real webhooks, or call external payment APIs.

## Current Billing Foundation

- C13-A added subscription lifecycle helpers in `src/lib/billing/lifecycle.ts`.
- Tenant billing visibility is available through `/api/tenant/billing-summary`.
- Owner plan and subscription mutations now use lifecycle validation.
- C9 provider-neutral `payment_transactions` and `billing_events` tables already exist.
- C13-B keeps database schema, RLS, Auth, UI, and payment logic unchanged.

## Provider Abstraction

`src/lib/payments/provider.ts` defines the gateway contract:

- `PaymentProvider`
- `PaymentProviderName`
- `CreateCheckoutInput`
- `CreateCheckoutResult`
- `PaymentWebhookEvent`
- `PaymentStatus`
- `PaymentProviderConfigStatus`

Placeholder provider names:

- `moyasar`
- `hyperpay`
- `tap`
- `manual`

These names are architecture placeholders only. No SDK is installed and no provider API is called.

## Manual Provider Placeholder

`src/lib/payments/manualProvider.ts` exposes a disabled manual provider. It cannot create checkout sessions and always returns `provider_not_configured` or disabled responses. This makes payment-disabled behavior explicit and testable.

## Checkout Flow

Future flow:

1. Tenant requests checkout for an invoice or subscription renewal.
2. Server verifies the tenant session.
3. Server checks organization ownership and subscription state.
4. Server selects a configured provider.
5. Provider creates checkout session through its SDK or API.
6. Server stores the pending transaction in `payment_transactions`.
7. Client receives a provider-hosted checkout URL.

C13-B adds `/api/tenant/billing/checkout` as a disabled placeholder. It requires authentication and returns `501` with `PROVIDER_NOT_CONFIGURED`. It does not parse card data, create checkout, or call a provider.

## Webhook Flow

Future webhook handlers must:

1. Receive the raw request body.
2. Verify provider signature before parsing trusted fields.
3. Normalize the provider event to `PaymentWebhookEvent`.
4. Compute a stable idempotency key.
5. Reject duplicates safely.
6. Map payment status to invoice status.
7. Map payment status to subscription signal.
8. Update invoice and subscription in one controlled server-side flow.
9. Record `payment_transactions` and `billing_events`.
10. Log safe operational metadata only.
11. Return provider-compatible success response.

C13-B does not add a real webhook handler.

## Idempotency Requirements

Future payment operations must have idempotency at three layers:

- Provider request idempotency for checkout/session creation.
- Webhook event idempotency using provider event ID plus provider transaction ID.
- Database idempotency using unique keys or transaction-safe lookups before mutation.

No idempotency migration is added in C13-B. A later phase should design indexes after choosing the payment provider and webhook payload shape.

## Status Mapping

`src/lib/payments/provider.ts` includes safe mapping helpers:

- `normalizePaymentStatus`
- `mapPaymentStatusToInvoiceStatus`
- `mapPaymentStatusToSubscriptionSignal`

These helpers only calculate states. They do not mutate invoices, subscriptions, or transactions.

## Security Requirements

- Never expose provider secret keys to the browser.
- Never store card numbers, CVV, or raw authorization headers.
- Verify webhook signatures using the provider's documented method.
- Use server-side routes only for checkout creation and webhook processing.
- Keep service-role access out of client code.
- Log request IDs and safe metadata, not secrets or full payment payloads.
- Treat webhook payloads as untrusted until signature verification passes.

## Environment Variables

Names only; no values should be committed:

- `MOYASAR_SECRET_KEY`
- `MOYASAR_WEBHOOK_SECRET`
- `HYPERPAY_ENTITY_ID`
- `HYPERPAY_ACCESS_TOKEN`
- `HYPERPAY_WEBHOOK_SECRET`
- `TAP_SECRET_KEY`
- `TAP_WEBHOOK_SECRET`
- `PAYMENT_PROVIDER`

## Saudi Provider Decision Checklist

- Supports SAR.
- Supports Mada and Saudi-friendly card flows.
- Provides hosted checkout or low PCI-scope redirect flow.
- Provides signed webhooks.
- Has clear refund, void, and reconciliation APIs.
- Has sandbox credentials and test cards.
- Has stable Node/HTTP integration documentation.
- Supports Arabic/English customer-facing payment screens.
- Has acceptable settlement, dispute, and fee terms.
- Has operational support suitable for production SaaS.

## Go/No-Go Before Real Gateway

Go only when:

- Provider is selected and legal/commercial approval is complete.
- Sandbox account is available.
- Webhook signature verification is implemented and tested.
- Idempotency strategy is approved.
- Invoice and subscription reconciliation rules are approved.
- Rollback plan and incident runbook are ready.
- No secrets are exposed to clients or logs.
- Full test matrix covers success, failure, cancel, refund, duplicate webhook, and retry cases.

No-go if any of the above is missing.
