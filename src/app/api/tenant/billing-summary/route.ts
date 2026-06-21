import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
  internalError,
  unauthorized,
} from "@/lib/api/apiResponse";
import {
  getRenewalWarningState,
  getSubscriptionAccessState,
  OPEN_INVOICE_STATUSES,
} from "@/lib/billing/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanRow = {
  id: string;
  name: string | null;
  slug: string | null;
  price_monthly: number | null;
  price_annual: number | null;
};

type SubscriptionRow = {
  id: string;
  organization_id: string;
  plan_id: string | null;
  status: string | null;
  billing_cycle: string | null;
  started_at: string | null;
  ends_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  amount: number | string | null;
  status: string | null;
  issue_date: string | null;
  due_date: string | null;
  created_at: string | null;
};

function getBearer(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

export async function GET(req: NextRequest) {
  const ctx = createApiContext(req, "/api/tenant/billing-summary");

  try {
    const rateLimit = await applyApiRateLimit(ctx, {
      scope: "tenant_billing_summary",
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimit) return rateLimit;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return internalError(ctx, new Error("Supabase server environment is incomplete"), "tenant_billing_summary");
    }

    const token = getBearer(req);
    if (!token) return unauthorized(ctx);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) return unauthorized(ctx, "Invalid session");

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileErr) {
      return internalError(ctx, profileErr, "tenant_billing_summary_profile");
    }

    const organizationId = (profile?.organization_id as string | null | undefined) ?? null;
    if (!organizationId) {
      return apiSuccess(ctx, {
        success: true,
        organizationId: null,
        currentPlan: null,
        subscription: null,
        unpaidInvoiceCount: null,
        lastInvoice: null,
        visibility: "no_organization",
      });
    }

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .select("id, plan_id, status, deleted_at")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgErr) {
      return internalError(ctx, orgErr, "tenant_billing_summary_org");
    }

    if (!org || org.deleted_at) {
      return apiSuccess(ctx, {
        success: true,
        organizationId: null,
        currentPlan: null,
        subscription: null,
        unpaidInvoiceCount: null,
        lastInvoice: null,
        visibility: "organization_unavailable",
      });
    }

    const { data: subscriptions, error: subErr } = await admin
      .from("subscriptions")
      .select("id, organization_id, plan_id, status, billing_cycle, started_at, ends_at, updated_at, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (subErr) {
      return internalError(ctx, subErr, "tenant_billing_summary_subscription");
    }

    const subscription = ((subscriptions ?? [])[0] ?? null) as SubscriptionRow | null;
    const planId = subscription?.plan_id ?? ((org.plan_id as string | null | undefined) ?? null);
    let plan: PlanRow | null = null;

    if (planId) {
      const { data: planData, error: planErr } = await admin
        .from("plans")
        .select("id, name, slug, price_monthly, price_annual")
        .eq("id", planId)
        .maybeSingle();

      if (planErr) {
        return internalError(ctx, planErr, "tenant_billing_summary_plan");
      }
      plan = (planData as PlanRow | null) ?? null;
    }

    const [{ count: unpaidInvoiceCount }, lastInvoiceResult] = await Promise.all([
      admin
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", OPEN_INVOICE_STATUSES),
      admin
        .from("invoices")
        .select("id, invoice_number, amount, status, issue_date, due_date, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const lastInvoice = (((lastInvoiceResult.data ?? [])[0] ?? null) as InvoiceRow | null);
    const warning = getRenewalWarningState({
      renewalDate: subscription?.ends_at ?? null,
      expiryDate: subscription?.ends_at ?? null,
    });

    return apiSuccess(ctx, {
      success: true,
      organizationId,
      organizationStatus: org.status ?? null,
      currentPlan: plan
        ? {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            priceMonthly: plan.price_monthly,
            priceAnnual: plan.price_annual,
          }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            accessState: getSubscriptionAccessState({
              status: subscription.status,
              endsAt: subscription.ends_at,
            }),
            billingCycle: subscription.billing_cycle,
            startedAt: subscription.started_at,
            renewalDate: subscription.ends_at,
            expiryDate: subscription.ends_at,
            updatedAt: subscription.updated_at,
            warning,
          }
        : null,
      unpaidInvoiceCount: unpaidInvoiceCount ?? null,
      lastInvoice: lastInvoice
        ? {
            id: lastInvoice.id,
            invoiceNumber: lastInvoice.invoice_number,
            amount: lastInvoice.amount,
            status: lastInvoice.status,
            issueDate: lastInvoice.issue_date,
            dueDate: lastInvoice.due_date,
            createdAt: lastInvoice.created_at,
          }
        : null,
      visibility: "tenant_own_organization",
    });
  } catch (err) {
    return internalError(ctx, err, "tenant_billing_summary_unexpected");
  }
}
