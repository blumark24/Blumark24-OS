// Phase 4C-2 — Owner organizations/subscriptions reconciliation (read-only).
//
// Some subscriptions can remain linked to soft-deleted organizations
// (deleted_at is stamped, rows are never hard-deleted — see Phase 4C-1
// tenantLifecycleGuard). This module classifies every owner-visible
// subscription against its organization's lifecycle so owner counts and
// MRR never silently include archived or internal tenants.
//
// This is a pure classification layer: it never queries, mutates,
// auto-fixes, or cancels anything. It only names the truth so the owner
// panel can show it.

import { LIVE_SUBSCRIPTION_STATUSES } from "@/lib/billing/lifecycle";

export type SubscriptionLifecycleClass =
  | "visible"      // non-internal org, deleted_at is null
  | "archived"     // org is soft-deleted, subscription is not live
  | "needs_review" // org is soft-deleted but subscription is still active/trialing/past_due
  | "internal"     // internal (Blumark) organization — never customer revenue
  | "orphaned";    // subscription has no valid organization relation

// Compact Arabic badges for the owner subscriptions page.
export const SUBSCRIPTION_LIFECYCLE_LABEL_AR: Record<SubscriptionLifecycleClass, string> = {
  visible:      "منشأة ظاهرة",
  archived:     "منشأة مؤرشفة",
  needs_review: "يتطلب مراجعة",
  internal:     "داخلي",
  orphaned:     "بدون منشأة",
};

export interface SubscriptionOrgLifecycle {
  isInternal: boolean;
  deletedAt: string | null;
}

const LIVE_STATUS_SET = new Set<string>(LIVE_SUBSCRIPTION_STATUSES);

/**
 * Classify one subscription against its organization's lifecycle state.
 * Precedence: orphaned → internal → needs_review → archived → visible.
 * `needs_review` is the dangerous overlap: a live billing state pointing
 * at an archived tenant — it must never count as active customer revenue,
 * but the owner must see it instead of it disappearing silently.
 */
export function classifySubscriptionLifecycle(
  subscriptionStatus: string,
  org: SubscriptionOrgLifecycle | null | undefined,
): SubscriptionLifecycleClass {
  if (!org) return "orphaned";
  if (org.isInternal) return "internal";
  if (org.deletedAt) {
    return LIVE_STATUS_SET.has(subscriptionStatus) ? "needs_review" : "archived";
  }
  return "visible";
}

/**
 * The only subscriptions that may count as "active" in owner KPIs and MRR:
 * status active/trialing AND a visible (non-internal, non-deleted) org.
 * Archived, needs_review, internal, and orphaned subscriptions never count.
 */
export function isActiveVisibleCustomerSubscription(row: {
  statusRaw: string;
  lifecycle: SubscriptionLifecycleClass;
}): boolean {
  return (
    row.lifecycle === "visible"
    && (row.statusRaw === "active" || row.statusRaw === "trialing")
  );
}

export interface SubscriptionLifecycleSummary {
  visible: number;
  archived: number;
  needsReview: number;
  internal: number;
  orphaned: number;
  activeVisible: number;
}

export function summarizeSubscriptionLifecycle(
  rows: { statusRaw: string; lifecycle: SubscriptionLifecycleClass }[],
): SubscriptionLifecycleSummary {
  const summary: SubscriptionLifecycleSummary = {
    visible: 0,
    archived: 0,
    needsReview: 0,
    internal: 0,
    orphaned: 0,
    activeVisible: 0,
  };
  for (const row of rows) {
    if (row.lifecycle === "visible") summary.visible += 1;
    else if (row.lifecycle === "archived") summary.archived += 1;
    else if (row.lifecycle === "needs_review") summary.needsReview += 1;
    else if (row.lifecycle === "internal") summary.internal += 1;
    else summary.orphaned += 1;

    if (isActiveVisibleCustomerSubscription(row)) summary.activeVisible += 1;
  }
  return summary;
}
