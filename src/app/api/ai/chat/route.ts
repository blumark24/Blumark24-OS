import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[ai/chat]";

// Allowlist of valid Anthropic model IDs.  If ANTHROPIC_MODEL env var is set
// to an unrecognised value we fall back to the default rather than crashing.
const VALID_MODELS = new Set([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
]);
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

function resolveModel(): string {
  const env = (process.env.ANTHROPIC_MODEL ?? "").trim();
  if (env && VALID_MODELS.has(env)) return env;
  if (env) console.warn(`${TAG} ANTHROPIC_MODEL="${env}" is not in allowlist — using default`);
  return DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `أنت مساعد ذكي متخصص في إدارة الأعمال والموارد البشرية لشركة Blumark24.
تتحدث باللغة العربية فقط وتقدم تحليلات دقيقة ومفيدة بناءً على بيانات الشركة الحقيقية.
كن مختصراً وعملياً في إجاباتك. استخدم التنسيق بـ ** للنصوص المهمة والـ - لنقاط القوائم.`;

interface KPIContext {
  activeClients: number;
  completedTasksPct: number;
  incompleteTasks: number;
  netProfit: number;
  overdueTasks?: number;
}

export async function POST(req: NextRequest) {
  // ── Require a valid authenticated Supabase user before any processing. ──
  // The browser must send the user's access token as a Bearer header. We
  // validate it against Supabase Auth using the public anon key — the
  // service-role key and ANTHROPIC_API_KEY are never involved here, and an
  // invalid/absent token is rejected with 401 before any AI work begins.
  const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(`${TAG} Supabase env not set — cannot authenticate request`);
    return NextResponse.json(
      { error: "SERVER_MISCONFIGURED", message: "إعداد الخادم غير مكتمل" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "يجب تسجيل الدخول لاستخدام المساعد الذكي" },
      { status: 401 },
    );
  }
  const token = authHeader.slice(7);
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED", message: "الجلسة غير صالحة — سجّل الدخول مجدداً" },
      { status: 401 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    console.warn(`${TAG} ANTHROPIC_API_KEY not set — returning 503`);
    return NextResponse.json(
      { error: "AI_KEY_MISSING", message: "مفتاح الذكاء الاصطناعي غير مضبوط" },
      { status: 503 },
    );
  }

  let body: { message?: string; kpi?: KPIContext };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const userMessage = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  if (!userMessage) {
    return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
  }

  const kpi = body.kpi;
  const kpiContext = kpi
    ? `\n\n**بيانات الشركة الحالية:**\n- العملاء النشطون: ${kpi.activeClients}\n- معدل إتمام المهام: ${kpi.completedTasksPct}%\n- المهام غير المكتملة: ${kpi.incompleteTasks}\n- المهام المتأخرة: ${kpi.overdueTasks ?? 0}\n- صافي الربح: ${kpi.netProfit.toLocaleString("ar-SA")} ريال`
    : "";

  const model  = resolveModel();
  const client = new Anthropic({ apiKey });

  try {
    console.log(`${TAG} streaming | model=${model} msg_len=${userMessage.length}`);

    // Use the Node.js request abort signal so the Anthropic stream is cancelled
    // when the client disconnects (e.g. user navigates away mid-stream).
    const stream = await client.messages.stream(
      {
        model,
        max_tokens: 1024,
        system:     SYSTEM_PROMPT + kpiContext,
        messages:   [{ role: "user", content: userMessage }],
      },
      { signal: req.signal },
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (streamErr) {
          // AbortError means the client disconnected — not a bug
          if (!(streamErr instanceof Error && streamErr.name === "AbortError")) {
            console.error(`${TAG} stream error:`, streamErr);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type":      "text/plain; charset=utf-8",
        "Cache-Control":     "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${TAG} Anthropic error: ${msg}`);
    return NextResponse.json({ error: "AI_ERROR", message: msg }, { status: 502 });
  }
}
