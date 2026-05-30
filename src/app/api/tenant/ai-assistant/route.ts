import { NextRequest, NextResponse } from "next/server";
import {
  buildCodeOnlyAssistantReply,
  classifyContextLoadError,
  logAssistantEvent,
  safeMessageForCode,
  type AssistantDiagnosticCode,
  type AssistantDiagnosticDetail,
} from "@/lib/tenant/aiAssistantDiagnostics";
import {
  buildLocalContextFallback,
  buildTenantAiSystemPrompt,
  callOpenAiAssistant,
  parseAssistantRequestBody,
  resolveOpenAiModel,
} from "@/lib/tenant/aiAssistant";
import type { TenantAiContextPayload } from "@/lib/tenant/aiContext";
import {
  loadTenantAiContextSafe,
  resolveTenantSession,
} from "@/lib/tenant/resolveTenantSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantJsonBody = {
  reply?: string;
  error?: string;
  message?: string;
  fallback?: boolean;
  model?: string;
  code?: AssistantDiagnosticCode;
  detail?: AssistantDiagnosticDetail;
};

function respond(payload: AssistantJsonBody, status: number) {
  return NextResponse.json(payload, { status });
}

function respondWithContextFallback(
  context: TenantAiContextPayload,
  input: {
    status: number;
    code: AssistantDiagnosticCode;
    detail: AssistantDiagnosticDetail;
    message: string;
    organizationId: string;
    userId: string;
  },
) {
  logAssistantEvent("openai_fail", {
    code: input.code,
    detail: input.detail,
    status: input.status,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  return respond(
    {
      code: input.code,
      detail: input.detail,
      error: input.code,
      message: input.message,
      reply: buildLocalContextFallback(context),
      fallback: true,
    },
    input.status,
  );
}

/** Tenant-scoped AI assistant — OpenAI server-side, safe context only, no writes. */
export async function POST(req: NextRequest) {
  let organizationId: string | undefined;
  let userId: string | undefined;
  let context: TenantAiContextPayload | undefined;

  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      logAssistantEvent("denied", {
        code: session.code,
        detail: session.detail,
        status: session.status,
      });
      const message = safeMessageForCode(session.code, session.detail);
      return respond(
        {
          code: session.code,
          detail: session.detail,
          error: session.code,
          message,
          reply: buildCodeOnlyAssistantReply(message, session.detail),
          fallback: false,
        },
        session.status,
      );
    }

    organizationId = session.organizationId;
    userId = session.userId;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      logAssistantEvent("denied", {
        code: "AI_CONTEXT_ERROR",
        detail: "REQUEST_INVALID",
        status: 400,
        organizationId,
        userId,
      });
      const message = safeMessageForCode("AI_CONTEXT_ERROR", "REQUEST_INVALID");
      return respond(
        {
          code: "AI_CONTEXT_ERROR",
          detail: "REQUEST_INVALID",
          error: "AI_CONTEXT_ERROR",
          message,
          reply: buildCodeOnlyAssistantReply(message, "REQUEST_INVALID"),
        },
        400,
      );
    }

    const parsed = parseAssistantRequestBody(body);
    if (!parsed.ok) {
      logAssistantEvent("denied", {
        code: "AI_CONTEXT_ERROR",
        detail: "REQUEST_INVALID",
        status: 400,
        organizationId,
        userId,
      });
      const message = parsed.error;
      return respond(
        {
          code: "AI_CONTEXT_ERROR",
          detail: "REQUEST_INVALID",
          error: "AI_CONTEXT_ERROR",
          message,
          reply: buildCodeOnlyAssistantReply(message, "REQUEST_INVALID"),
        },
        400,
      );
    }

    const contextResult = await loadTenantAiContextSafe(session);
    if (!contextResult.ok) {
      logAssistantEvent("context_fail", {
        code: contextResult.code,
        detail: contextResult.detail,
        status: contextResult.code === "RLS_ERROR" ? 403 : 503,
        organizationId,
        userId,
      });
      const message = safeMessageForCode(contextResult.code, contextResult.detail);
      return respond(
        {
          code: contextResult.code,
          detail: contextResult.detail,
          error: contextResult.code,
          message,
          reply: buildCodeOnlyAssistantReply(message, contextResult.detail),
          fallback: false,
        },
        contextResult.code === "RLS_ERROR" ? 403 : 503,
      );
    }

    context = contextResult.context;
    const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();

    if (!apiKey) {
      return respondWithContextFallback(context, {
        status: 503,
        code: "OPENAI_ERROR",
        detail: "OPENAI_KEY_MISSING",
        message: safeMessageForCode("OPENAI_ERROR", "OPENAI_KEY_MISSING"),
        organizationId,
        userId,
      });
    }

    const systemPrompt = buildTenantAiSystemPrompt(context);
    const result = await callOpenAiAssistant({
      apiKey,
      systemPrompt,
      message: parsed.message,
      conversationHistory: parsed.conversationHistory,
    });

    if (result.ok) {
      logAssistantEvent("success", {
        code: "OPENAI_ERROR",
        detail: "ASSISTANT_OK",
        status: 200,
        organizationId,
        userId,
      });
      return respond(
        {
          reply: result.reply,
          model: resolveOpenAiModel(),
        },
        200,
      );
    }

    return respondWithContextFallback(context, {
      status: result.status,
      code: "OPENAI_ERROR",
      detail: result.detail,
      message: result.message,
      organizationId,
      userId,
    });
  } catch (err) {
    const classified = classifyContextLoadError(err);

    logAssistantEvent("unexpected", {
      code: classified.code,
      detail: classified.detail,
      status: 503,
      organizationId,
      userId,
    });

    const message = safeMessageForCode(classified.code, classified.detail);

    if (context && organizationId && userId) {
      return respondWithContextFallback(context, {
        status: 503,
        code: classified.code,
        detail: classified.detail,
        message,
        organizationId,
        userId,
      });
    }

    return respond(
      {
        code: classified.code,
        detail: classified.detail,
        error: classified.code,
        message,
        reply: buildCodeOnlyAssistantReply(message, classified.detail),
        fallback: false,
      },
      503,
    );
  }
}
