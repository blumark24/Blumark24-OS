import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import {
  apiSuccess,
  applyApiRateLimit,
  createApiContext,
} from "@/lib/api/apiResponse";
import { getReleaseEnvPresence, getReleaseReadiness } from "@/lib/env/releaseReadiness";
import { logServerEvent } from "@/lib/monitoring/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_NAME = "Blumark24 OS";
const ROUTE = "/api/health";

type HealthCheckStatus = "ok" | "degraded" | "skipped";

interface HealthCheck {
  status: HealthCheckStatus;
  message: string;
  duration_ms?: number;
}

function getEnvironmentName(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
}

function getVersionInfo() {
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_COMMIT_SHA || null;
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    commit: commit ? commit.slice(0, 12) : null,
  };
}

async function checkSupabaseConnectivity(): Promise<HealthCheck> {
  const started = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      status: "skipped",
      message: "Supabase connectivity skipped because required server env is missing",
    };
  }

  try {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await admin
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .limit(0);

    if (error) {
      return {
        status: "degraded",
        message: "Supabase connectivity check failed",
        duration_ms: Date.now() - started,
      };
    }

    return {
      status: "ok",
      message: "Supabase connectivity check passed",
      duration_ms: Date.now() - started,
    };
  } catch {
    return {
      status: "degraded",
      message: "Supabase connectivity check threw",
      duration_ms: Date.now() - started,
    };
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = createApiContext(req, ROUTE);
  const deep = req.nextUrl.searchParams.get("deep") === "1";

  if (deep) {
    const limited = await applyApiRateLimit(ctx, {
      scope: "health_deep",
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (limited) return limited;
  }

  const checks: Record<string, HealthCheck> = {
    runtime: {
      status: "ok",
      message: "Server runtime is responding",
    },
  };

  const envPresence = getReleaseEnvPresence();
  const releaseReadiness = getReleaseReadiness();
  const requiredEnvOk = releaseReadiness.requiredCoreEnvPresent;

  checks.environment = {
    status: requiredEnvOk ? "ok" : "degraded",
    message: requiredEnvOk ? "Required public runtime env is present" : "Required public runtime env is missing",
  };

  if (deep) {
    checks.supabase = await checkSupabaseConnectivity();
  }

  const status = Object.values(checks).some((check) => check.status === "degraded") ? "degraded" : "ok";
  const durationMs = Date.now() - started;

  logServerEvent(status === "ok" ? "info" : "warn", {
    event: "health_check",
    route: ROUTE,
    requestId: ctx.requestId,
    durationMs,
    status,
    metadata: { deep },
  });

  const publicHealth = {
    status,
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    request_id: ctx.requestId,
    duration_ms: durationMs,
  };

  if (!deep) {
    return apiSuccess(ctx, publicHealth, status === "ok" ? 200 : 503);
  }

  return apiSuccess(
    ctx,
    {
      ...publicHealth,
      environment: getEnvironmentName(),
      ...getVersionInfo(),
      deep,
      checks,
    },
    status === "ok" ? 200 : 503,
  );
}
