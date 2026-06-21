import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDashboardSummary } from "@/lib/services/dashboardSummary";
import {
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
  internalError,
  unauthorized,
} from "@/lib/api/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createTenantClient(authorization: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

export async function GET(req: NextRequest) {
  const ctx = createApiContext(req, "/api/tenant/dashboard-summary");
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return unauthorized(ctx, "Authorization header missing");
  }

  const limited = await applyApiRateLimit(ctx, {
    scope: "tenant_dashboard_summary",
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (limited) {
    return limited;
  }

  const supabase = createTenantClient(authorization);
  if (!supabase) {
    return internalError(ctx, new Error("Supabase environment variables are not set"), "[dashboard-summary]");
  }

  try {
    const summary = await buildDashboardSummary(supabase);
    return apiSuccess(ctx, summary);
  } catch (err) {
    return internalError(ctx, err, "[dashboard-summary]");
  }
}
