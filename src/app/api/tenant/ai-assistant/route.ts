import { NextRequest, NextResponse } from "next/server";
import {
  buildLocalContextFallback,
  buildTenantAiSystemPrompt,
  callOpenAiAssistant,
  OPENAI_KEY_MISSING_MESSAGE,
  parseAssistantRequestBody,
  resolveOpenAiModel,
} from "@/lib/tenant/aiAssistant";
import {
  loadTenantAiContextForSession,
  resolveTenantSession,
} from "@/lib/tenant/resolveTenantSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/ai-assistant]";

type AssistantJsonBody = {
  reply?: string;
  error?: string;
  message?: string;
  fallback?: boolean;
  model?: string;
};

function jsonAssistantResponse(payload: AssistantJsonBody, status: number) {
  return NextResponse.json(payload, { status });
}

/** Tenant-scoped AI assistant — OpenAI server-side, safe context only, no writes. */
export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return jsonAssistantResponse(
        { error: session.error, message: session.error },
        session.status,
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonAssistantResponse(
        { error: "طلب غير صالح", message: "طلب غير صالح" },
        400,
      );
    }

    const parsed = parseAssistantRequestBody(body);
    if (!parsed.ok) {
      return jsonAssistantResponse(
        { error: parsed.error, message: parsed.error },
        400,
      );
    }

    const context = await loadTenantAiContextForSession(session);
    const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();

    if (!apiKey) {
      const fallbackReply = buildLocalContextFallback(context);
      return jsonAssistantResponse(
        {
          error: "ASSISTANT_UNAVAILABLE",
          message: OPENAI_KEY_MISSING_MESSAGE,
          reply: fallbackReply,
          fallback: true,
        },
        503,
      );
    }

    const systemPrompt = buildTenantAiSystemPrompt(context);
    const result = await callOpenAiAssistant({
      apiKey,
      systemPrompt,
      message: parsed.message,
      conversationHistory: parsed.conversationHistory,
    });

    if (result.ok) {
      return jsonAssistantResponse(
        { reply: result.reply, model: resolveOpenAiModel() },
        200,
      );
    }

    const fallbackReply = result.useFallback
      ? buildLocalContextFallback(context)
      : undefined;

    return jsonAssistantResponse(
      {
        error: "ASSISTANT_UNAVAILABLE",
        message: result.message,
        reply: fallbackReply,
        fallback: Boolean(fallbackReply),
      },
      result.status,
    );
  } catch {
    console.error(`${TAG} unexpected`);
    return jsonAssistantResponse(
      {
        error: "خطأ داخلي",
        message: "حدث خطأ مؤقت — حاول مرة أخرى",
      },
      500,
    );
  }
}
