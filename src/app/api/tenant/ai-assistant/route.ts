import { NextRequest, NextResponse } from "next/server";
import {
  buildTenantAiSystemPrompt,
  callOpenAiAssistant,
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

/** Tenant-scoped AI assistant — OpenAI server-side, safe context only, no writes. */
export async function POST(req: NextRequest) {
  try {
    const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "ASSISTANT_UNAVAILABLE",
          message:
            "المساعد الذكي غير متاح حالياً — لم يتم إعداد مفتاح OpenAI على الخادم.",
        },
        { status: 503 },
      );
    }

    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const parsed = parseAssistantRequestBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const context = await loadTenantAiContextForSession(session);
    const systemPrompt = buildTenantAiSystemPrompt(context);

    const result = await callOpenAiAssistant({
      apiKey,
      systemPrompt,
      message: parsed.message,
      conversationHistory: parsed.conversationHistory,
    });

    if ("error" in result) {
      console.error(`${TAG} upstream error`);
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      reply: result.reply,
      model: resolveOpenAiModel(),
    });
  } catch (err) {
    console.error(`${TAG} unexpected`);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
