import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildDashboardSummary } from "@/lib/services/dashboardSummary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status, headers: NO_STORE });
}

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
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authorization header missing" }, 401);
  }

  const supabase = createTenantClient(authorization);
  if (!supabase) {
    return json({ error: "Supabase environment variables are not set" }, 500);
  }

  try {
    const summary = await buildDashboardSummary(supabase);
    return json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard summary";
    console.error("[dashboard-summary]", message);
    return json({ error: message }, 500);
  }
}
