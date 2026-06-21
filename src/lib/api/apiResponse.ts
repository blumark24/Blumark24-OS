import { NextRequest, NextResponse } from "next/server";
import { generateRequestId, normalizeError } from "@/lib/monitoring/server";
import {
  buildRateLimitKey,
  checkRateLimit,
  getClientIp,
  type RateLimitResult,
} from "@/lib/security/rateLimit";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

export interface ApiRequestContext {
  requestId: string;
  path: string;
  ip: string;
}

export function createApiContext(req: NextRequest, path: string): ApiRequestContext {
  return {
    requestId: req.headers.get("x-request-id")?.trim() || generateRequestId(),
    path,
    ip: getClientIp(req),
  };
}

function responseHeaders(requestId: string, extra?: HeadersInit): HeadersInit {
  return {
    ...NO_STORE,
    "x-request-id": requestId,
    ...extra,
  };
}

export function apiSuccess(
  ctx: ApiRequestContext,
  payload: unknown,
  status = 200,
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: responseHeaders(ctx.requestId),
  });
}

export function apiError(
  ctx: ApiRequestContext,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      request_id: ctx.requestId,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: responseHeaders(ctx.requestId),
    },
  );
}

export function unauthorized(ctx: ApiRequestContext, message = "Unauthorized") {
  return apiError(ctx, 401, "UNAUTHORIZED", message);
}

export function forbidden(ctx: ApiRequestContext, message = "Forbidden") {
  return apiError(ctx, 403, "FORBIDDEN", message);
}

export function validationError(ctx: ApiRequestContext, message: string) {
  return apiError(ctx, 400, "VALIDATION_ERROR", message);
}

export function internalError(ctx: ApiRequestContext, err: unknown, logTag: string) {
  const norm = normalizeError(err);
  console.error(`${logTag} request_id=${ctx.requestId} path=${ctx.path} message=${norm.message}`);
  return apiError(ctx, 500, "INTERNAL_ERROR", "Internal server error");
}

export function rateLimited(ctx: ApiRequestContext, result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "تجاوزت الحد المسموح به — يرجى الانتظار قبل المحاولة مجدداً",
      code: "RATE_LIMITED",
      request_id: ctx.requestId,
      reset_at: result.resetAt,
    },
    {
      status: 429,
      headers: responseHeaders(ctx.requestId, {
        "Retry-After": String(Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000))),
        "X-RateLimit-Reset": result.resetAt,
      }),
    },
  );
}

export async function applyApiRateLimit(
  ctx: ApiRequestContext,
  input: {
    scope: string;
    limit: number;
    windowMs: number;
    userId?: string | null;
    target?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<NextResponse | null> {
  const result = await checkRateLimit({
    scope: input.scope,
    key: buildRateLimitKey({
      scope: input.scope,
      user_id: input.userId ?? null,
      ip: ctx.ip,
      route: ctx.path,
      target: input.target ?? null,
    }),
    limit: input.limit,
    windowMs: input.windowMs,
    user_id: input.userId ?? null,
    ip: ctx.ip,
    route: ctx.path,
    target_id: input.target ?? null,
    metadata: input.metadata ?? {},
  });
  return result.allowed ? null : rateLimited(ctx, result);
}
