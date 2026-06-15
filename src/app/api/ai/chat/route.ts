import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, resolveIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[ai/chat]";

// 20 requests per user per minute — enough for active use, blocks runaway loops.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

// Allowlist of valid Anthropic model IDs. If ANTHROPIC_MODEL env var is set
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

const SYSTEM_PROMPT = `أنت مساعد ذكي لإدارة أعمال المنشأة (موارد بشرية، عملاء، مهام، مالية).
تتحدث باللغة العربية فقط وتقدم تحليلات بناءً على بيانات المنشأة المتاحة لك فقط.
كن مختصراً وعملياً. استخدم ** للنصوص المهمة والـ - للقوائم.`;

interface KPIContext {
  activeClients: number;
  completedTasksPct: number;
  incompleteTasks: number;
  netProfit: number;
  overdueTasks?: number;
}

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }

  return getAccessTokenFromSupabaseCookies(req);
}

function getAccessTokenFromSupabaseCookies(req: NextRequest): string | null {
  const authCookies = req.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  if (authCookies.length === 0) return null;

  const rawCookieValue = authCookies.map((cookie) => cookie.value).join("");
  if (!rawCookieValue) return null;

  const parseSession = (value: string): string | null => {
    try {
      const parsed: unknown = JSON.parse(value);
      const session = Array.isArray(parsed) ? parsed[0] : parsed;

      if (
        session &&
        typeof session === "object" &&
        "access_token" in session &&
        typeof (session as { access_token: unknown }).access_token === "string"
      ) {
        return (session as { access_token: string }).access_token;
      }
    } catch {
      // Ignore malformed or non-JSON cookies.
    }

    return null;
  };

  return parseSession(decodeURIComponent(rawCookieValue)) ?? parseSession(rawCookieValue);
}

interface AuthResult {
  ok: true;
  userId: string;
  organizationId: string | null;
}

async function requireAuthenticatedUser(
  req: NextRequest,
): Promise<AuthResult | { ok: false; response: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`${TAG} Supabase env missing — cannot verify session`);
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "AUTH_UNAVAILABLE", message: "إعداد الخادم غير مكتمل" },
        { status: 503 },
      ),
    };
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "UNAUTHORIZED", message: "يجب تسجيل الدخول لاستخدام المساعد الذكي" },
        { status: 401 },
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "UNAUTHORIZED", message: "جلسة غير صالحة أو منتهية" },
        { status: 401 },
      ),
    };
  }

  // Fetch organization_id from the user's profile so we can scope the session.
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return { ok: true, userId: user.id, organizationId: profile?.organization_id ?? null };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth.response;

  // Rate limit per user (fallback to IP if userId somehow unavailable).
  const rateLimitKey = `ai-chat:user:${auth.userId ?? resolveIp(req)}`;
  const rl = checkRateLimit(rateLimitKey, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "تجاوزت الحد المسموح من الطلبات. حاول مجدداً بعد دقيقة." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) },
      },
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

  const model = resolveModel();
  const client = new Anthropic({ apiKey });

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`${TAG} streaming | model=${model} msg_len=${userMessage.length}`);
    }

    // Use the Node.js request abort signal so the Anthropic stream is cancelled
    // when the client disconnects (e.g. user navigates away mid-stream).
    const stream = await client.messages.stream(
      {
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT + kpiContext,
        messages: [{ role: "user", content: userMessage }],
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
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${TAG} Anthropic error: ${msg}`);
    return NextResponse.json({ error: "AI_ERROR", message: msg }, { status: 502 });
  }
}
