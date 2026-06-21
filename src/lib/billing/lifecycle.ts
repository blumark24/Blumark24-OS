export const SUBSCRIPTION_LIFECYCLE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "suspended",
  "cancelled",
  "expired",
] as const;

export const DB_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "suspended",
  "cancelled",
] as const;

export const LIVE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export const INVOICE_LIFECYCLE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "overdue",
  "void",
  "failed",
] as const;

export const OPEN_INVOICE_STATUSES = [
  "draft",
  "issued",
  "overdue",
  "failed",
] as const;

export const PAYMENT_LIFECYCLE_STATUSES = [
  "pending",
  "processing",
  "paid",
  "failed",
  "canceled",
  "refunded",
] as const;

export type SubscriptionLifecycleStatus = typeof SUBSCRIPTION_LIFECYCLE_STATUSES[number];
export type DbSubscriptionStatus = typeof DB_SUBSCRIPTION_STATUSES[number];
export type InvoiceLifecycleStatus = typeof INVOICE_LIFECYCLE_STATUSES[number];
export type PaymentLifecycleStatus = typeof PAYMENT_LIFECYCLE_STATUSES[number];
export type BillingCycle = "monthly" | "annual" | "internal";

export type SubscriptionAccessState =
  | "enabled"
  | "trial"
  | "grace_period"
  | "restricted"
  | "suspended"
  | "cancelled"
  | "expired"
  | "unavailable";

export type RenewalWarningLevel =
  | "none"
  | "upcoming"
  | "due_today"
  | "expired"
  | "unavailable";

export interface LifecycleDecision {
  allowed: boolean;
  reason?: string;
}

export interface SubscriptionStateInput {
  status?: string | null;
  endsAt?: string | null;
  now?: Date;
}

export interface RenewalWarningInput {
  renewalDate?: string | null;
  expiryDate?: string | null;
  now?: Date;
  warningWindowDays?: number;
}

const DB_STATUS_SET = new Set<string>(DB_SUBSCRIPTION_STATUSES);
const LIFECYCLE_STATUS_SET = new Set<string>(SUBSCRIPTION_LIFECYCLE_STATUSES);

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInPast(value?: string | null, now = new Date()): boolean {
  const date = parseDate(value);
  return date ? date.getTime() < now.getTime() : false;
}

export function normalizeSubscriptionStatus(
  status?: string | null,
): SubscriptionLifecycleStatus | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase();
  return LIFECYCLE_STATUS_SET.has(normalized)
    ? (normalized as SubscriptionLifecycleStatus)
    : null;
}

export function isDbSubscriptionStatus(
  status?: string | null,
): status is DbSubscriptionStatus {
  return typeof status === "string" && DB_STATUS_SET.has(status);
}

export function isSubscriptionActive(input: SubscriptionStateInput): boolean {
  const status = normalizeSubscriptionStatus(input.status);
  if (!status || isDateInPast(input.endsAt, input.now ?? new Date())) return false;
  return status === "active" || status === "trialing";
}

export function isSubscriptionPastDue(input: SubscriptionStateInput): boolean {
  return normalizeSubscriptionStatus(input.status) === "past_due";
}

export function canChangePlan(input?: SubscriptionStateInput | null): LifecycleDecision {
  const status = normalizeSubscriptionStatus(input?.status);
  if (!status) return { allowed: true };
  if (status === "cancelled" || status === "expired") {
    return {
      allowed: false,
      reason: "Plan changes require a new active subscription for cancelled or expired subscriptions.",
    };
  }
  return { allowed: true };
}

export function canSuspendSubscription(input: SubscriptionStateInput): LifecycleDecision {
  const status = normalizeSubscriptionStatus(input.status);
  if (status === "active" || status === "trialing" || status === "past_due") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Only active, trialing, or past-due subscriptions can be suspended.",
  };
}

export function canCancelSubscription(input: SubscriptionStateInput): LifecycleDecision {
  const status = normalizeSubscriptionStatus(input.status);
  if (status && status !== "cancelled" && status !== "expired") {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "This subscription is already cancelled or expired.",
  };
}

export function canReactivateSubscription(input: SubscriptionStateInput): LifecycleDecision {
  const status = normalizeSubscriptionStatus(input.status);
  if (status === "suspended" || status === "past_due") {
    return { allowed: true };
  }
  if (status === "cancelled" || status === "expired") {
    return {
      allowed: false,
      reason: "Cancelled or expired subscriptions should be replaced with a new subscription.",
    };
  }
  return {
    allowed: false,
    reason: "Only suspended or past-due subscriptions can be reactivated.",
  };
}

export function getSubscriptionAccessState(input: SubscriptionStateInput): SubscriptionAccessState {
  const status = normalizeSubscriptionStatus(input.status);
  if (!status) return "unavailable";
  if (isDateInPast(input.endsAt, input.now ?? new Date())) return "expired";

  switch (status) {
    case "active":
      return "enabled";
    case "trialing":
      return "trial";
    case "past_due":
      return "grace_period";
    case "suspended":
      return "suspended";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "unavailable";
  }
}

export function getRenewalWarningState(input: RenewalWarningInput): {
  level: RenewalWarningLevel;
  daysRemaining: number | null;
  date: string | null;
} {
  const now = input.now ?? new Date();
  const warningWindowDays = input.warningWindowDays ?? 14;
  const targetDate = parseDate(input.renewalDate ?? input.expiryDate ?? null);

  if (!targetDate) {
    return { level: "unavailable", daysRemaining: null, date: null };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / msPerDay);

  if (daysRemaining < 0) {
    return { level: "expired", daysRemaining, date: targetDate.toISOString() };
  }
  if (daysRemaining === 0) {
    return { level: "due_today", daysRemaining, date: targetDate.toISOString() };
  }
  if (daysRemaining <= warningWindowDays) {
    return { level: "upcoming", daysRemaining, date: targetDate.toISOString() };
  }
  return { level: "none", daysRemaining, date: targetDate.toISOString() };
}

export function getValidSubscriptionTransitions(
  status?: string | null,
): DbSubscriptionStatus[] {
  const normalized = normalizeSubscriptionStatus(status);
  switch (normalized) {
    case "active":
    case "trialing":
      return ["past_due", "suspended", "cancelled"];
    case "past_due":
      return ["active", "suspended", "cancelled"];
    case "suspended":
      return ["active", "cancelled"];
    case "cancelled":
    case "expired":
      return [];
    default:
      return ["active", "trialing"];
  }
}
