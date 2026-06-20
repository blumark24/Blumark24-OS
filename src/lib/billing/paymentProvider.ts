import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export interface CreateCheckoutSessionInput {
  organizationId?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency?: string;
  provider?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CheckoutSessionResult {
  ok: false;
  status: "provider_not_configured";
  checkoutUrl: null;
  provider: null;
  message: string;
}

export interface RecordPaymentTransactionInput extends CreateCheckoutSessionInput {
  status?: PaymentStatus;
  providerTransactionId?: string | null;
  paymentMethod?: string | null;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
}

export interface RecordBillingEventInput {
  organizationId?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  eventType: string;
  status?: string;
  source?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN =
  /(card|cvc|cvv|pan|number|expiry|exp_month|exp_year|secret|token|password|authorization|auth|key)/i;

export function createCheckoutSession(
  _input: CreateCheckoutSessionInput,
): CheckoutSessionResult {
  return {
    ok: false,
    status: "provider_not_configured",
    checkoutUrl: null,
    provider: null,
    message:
      "Online payments are not configured yet. No checkout session was created.",
  };
}

export function normalizePaymentStatus(providerStatus: string | null | undefined): PaymentStatus {
  const status = String(providerStatus ?? "").trim().toLowerCase();

  if (["paid", "succeeded", "success", "captured", "authorized"].includes(status)) {
    return "paid";
  }
  if (["processing", "in_progress", "initiated"].includes(status)) {
    return "processing";
  }
  if (["failed", "declined", "error"].includes(status)) {
    return "failed";
  }
  if (["canceled", "cancelled", "voided", "expired"].includes(status)) {
    return "canceled";
  }
  if (["refunded", "partially_refunded"].includes(status)) {
    return "refunded";
  }

  return "pending";
}

export function sanitizePaymentMetadata(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  return Object.entries(input as Record<string, unknown>).reduce<Record<string, unknown>>(
    (safe, [key, value]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) return safe;

      if (Array.isArray(value)) {
        safe[key] = value.map((item) =>
          item && typeof item === "object" ? sanitizePaymentMetadata(item) : item,
        );
        return safe;
      }

      if (value && typeof value === "object") {
        safe[key] = sanitizePaymentMetadata(value);
        return safe;
      }

      safe[key] = value;
      return safe;
    },
    {},
  );
}

export async function recordPaymentTransaction(
  supabase: SupabaseClient,
  input: RecordPaymentTransactionInput,
) {
  const { data, error } = await supabase
    .from("payment_transactions")
    .insert({
      organization_id: input.organizationId ?? null,
      subscription_id: input.subscriptionId ?? null,
      invoice_id: input.invoiceId ?? null,
      provider: input.provider ?? null,
      provider_transaction_id: input.providerTransactionId ?? null,
      amount: input.amount,
      currency: input.currency ?? "SAR",
      status: input.status ?? "pending",
      payment_method: input.paymentMethod ?? null,
      checkout_url: input.checkoutUrl ?? null,
      paid_at: input.paidAt ?? null,
      failed_at: input.failedAt ?? null,
      metadata: sanitizePaymentMetadata(input.metadata),
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message, id: null };
  }

  return { ok: true as const, error: null, id: data.id as string };
}

export async function recordBillingEvent(
  supabase: SupabaseClient,
  input: RecordBillingEventInput,
) {
  const { data, error } = await supabase
    .from("billing_events")
    .insert({
      organization_id: input.organizationId ?? null,
      subscription_id: input.subscriptionId ?? null,
      invoice_id: input.invoiceId ?? null,
      event_type: input.eventType,
      status: input.status ?? "recorded",
      source: input.source ?? "system",
      description: input.description ?? null,
      metadata: sanitizePaymentMetadata(input.metadata),
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message, id: null };
  }

  return { ok: true as const, error: null, id: data.id as string };
}
