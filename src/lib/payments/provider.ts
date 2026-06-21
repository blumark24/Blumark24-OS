import type {
  DbSubscriptionStatus,
  InvoiceLifecycleStatus,
  PaymentLifecycleStatus,
} from "@/lib/billing/lifecycle";

export const PAYMENT_PROVIDER_NAMES = [
  "moyasar",
  "hyperpay",
  "tap",
  "manual",
] as const;

export type PaymentProviderName = typeof PAYMENT_PROVIDER_NAMES[number];
export type PaymentStatus = PaymentLifecycleStatus;

export type PaymentProviderConfigState =
  | "not_configured"
  | "configured_but_disabled"
  | "disabled_in_this_phase";

export interface PaymentProviderConfigStatus {
  provider: PaymentProviderName;
  configured: boolean;
  enabled: false;
  state: PaymentProviderConfigState;
  message: string;
  requiredEnvNames?: string[];
}

export interface CreateCheckoutInput {
  provider?: PaymentProviderName;
  organizationId: string;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  amount: number;
  currency?: string;
  description?: string | null;
  successUrl?: string | null;
  cancelUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateCheckoutResult {
  ok: false;
  status: "provider_not_configured" | "disabled_in_this_phase" | "unsupported";
  provider: PaymentProviderName;
  checkoutUrl: null;
  message: string;
}

export interface PaymentWebhookEvent {
  provider: PaymentProviderName;
  eventId: string;
  eventType: string;
  idempotencyKey: string;
  status: PaymentStatus;
  organizationId?: string | null;
  subscriptionId?: string | null;
  invoiceId?: string | null;
  providerTransactionId?: string | null;
  amount?: number | null;
  currency?: string | null;
  occurredAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  getConfigStatus(): PaymentProviderConfigStatus;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> | CreateCheckoutResult;
}

export const PAYMENT_PROVIDER_REQUIRED_ENV_NAMES: Record<PaymentProviderName, string[]> = {
  moyasar: ["MOYASAR_SECRET_KEY", "MOYASAR_WEBHOOK_SECRET"],
  hyperpay: ["HYPERPAY_ENTITY_ID", "HYPERPAY_ACCESS_TOKEN", "HYPERPAY_WEBHOOK_SECRET"],
  tap: ["TAP_SECRET_KEY", "TAP_WEBHOOK_SECRET"],
  manual: [],
};

export function isPaymentProviderName(value: unknown): value is PaymentProviderName {
  return typeof value === "string"
    && (PAYMENT_PROVIDER_NAMES as readonly string[]).includes(value);
}

export function normalizePaymentProviderName(value: unknown): PaymentProviderName {
  return isPaymentProviderName(value) ? value : "manual";
}

export function getPaymentProviderConfigStatus(
  provider: PaymentProviderName,
): PaymentProviderConfigStatus {
  return {
    provider,
    configured: false,
    enabled: false,
    state: "disabled_in_this_phase",
    message: "Payment providers are architected but intentionally disabled in C13-B.",
    requiredEnvNames: PAYMENT_PROVIDER_REQUIRED_ENV_NAMES[provider],
  };
}

export function isPaymentProviderConfigured(
  statusOrProvider: PaymentProviderConfigStatus | PaymentProviderName,
): boolean {
  const status = typeof statusOrProvider === "string"
    ? getPaymentProviderConfigStatus(statusOrProvider)
    : statusOrProvider;
  return status.configured === true && status.enabled === false
    ? false
    : status.configured === true;
}

export function assertPaymentProviderDisabledInThisPhase(
  provider: PaymentProviderName = "manual",
): CreateCheckoutResult {
  return {
    ok: false,
    status: "disabled_in_this_phase",
    provider,
    checkoutUrl: null,
    message: "Real checkout is disabled in this architecture phase. No payment was created.",
  };
}

export function normalizePaymentStatus(
  providerStatus: string | null | undefined,
): PaymentStatus {
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

export function mapPaymentStatusToInvoiceStatus(
  status: PaymentStatus,
): InvoiceLifecycleStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
    case "canceled":
      return "failed";
    case "refunded":
      return "void";
    case "pending":
    case "processing":
    default:
      return "issued";
  }
}

export function mapPaymentStatusToSubscriptionSignal(
  status: PaymentStatus,
): DbSubscriptionStatus | null {
  switch (status) {
    case "paid":
      return "active";
    case "failed":
      return "past_due";
    case "canceled":
      return "suspended";
    case "refunded":
      return "cancelled";
    case "pending":
    case "processing":
    default:
      return null;
  }
}
