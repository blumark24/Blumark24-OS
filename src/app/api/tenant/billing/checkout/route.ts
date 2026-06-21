import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
  internalError,
  unauthorized,
} from "@/lib/api/apiResponse";
import { getManualPaymentProvider } from "@/lib/payments/manualProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearer(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

async function assertAuthenticatedTenantRequest(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase server environment is incomplete");
  }

  const token = getBearer(req);
  if (!token) return false;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.getUser(token);
  return !error && Boolean(data?.user);
}

export async function POST(req: NextRequest) {
  const ctx = createApiContext(req, "/api/tenant/billing/checkout");

  try {
    const rateLimit = await applyApiRateLimit(ctx, {
      scope: "tenant_billing_checkout_placeholder",
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (rateLimit) return rateLimit;

    const authenticated = await assertAuthenticatedTenantRequest(req);
    if (!authenticated) return unauthorized(ctx);

    const provider = getManualPaymentProvider();
    const result = provider.createCheckout({
      organizationId: "not-used-in-placeholder",
      amount: 0,
      currency: "SAR",
    });

    return apiSuccess(ctx, {
      success: false,
      code: "PROVIDER_NOT_CONFIGURED",
      ...result,
    }, 501);
  } catch (err) {
    return internalError(ctx, err, "tenant_billing_checkout_placeholder");
  }
}
