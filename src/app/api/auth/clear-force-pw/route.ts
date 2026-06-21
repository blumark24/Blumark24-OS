// Clears force_password_change for the authenticated caller's own profile.
// Uses the service role to bypass RLS (employees cannot self-update profiles).
// Verifies the caller's Bearer token before any DB write.

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
  internalError,
  unauthorized,
} from "@/lib/api/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ctx = createApiContext(req, "/api/auth/clear-force-pw");
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return internalError(ctx, new Error("Supabase service environment is not configured"), "[clear-force-pw]");
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return unauthorized(ctx, "Authorization header missing");
  }

  const { data: { user }, error: tokenErr } = await admin.auth.getUser(authHeader.slice(7));
  if (tokenErr || !user) {
    return unauthorized(ctx, "Invalid or expired session");
  }

  const limited = await applyApiRateLimit(ctx, {
    scope: "auth_clear_force_password_change",
    limit: 10,
    windowMs: 60 * 1000,
    userId: user.id,
  });
  if (limited) {
    return limited;
  }

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ force_password_change: false })
    .eq("id", user.id);

  if (updateErr) {
    return internalError(ctx, updateErr, "[clear-force-pw]");
  }

  return apiSuccess(ctx, { success: true });
}
