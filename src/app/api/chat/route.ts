// Blumark24 website chat API — Google Gemini proxy
// Required env var in Vercel: GEMINI_API_KEY

import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `أنت "Blumark AI"، مساعد الأعمال الذكي الرسمي لشركة Blumark24.

تمثّل شركة سعودية متخصصة في حلول الذكاء الاصطناعي والأتمتة والتسويق الرقمي للأعمال.

قواعد الرد:
- تحدّث بالعربية بأسلوب سعودي مهني ومختصر.
- اجعل الردود قصيرة جداً، غالباً سطرين كحد أقصى.
- اسأل سؤالاً واحداً فقط في كل مرة.
- لا تعرض كل الباقات إلا إذا طلب العميل ذلك.
- لا تكتب كلاماً عاماً أو طويلاً.
- لا تعد بوعود غير مؤكدة.
- اجعل العميل يشعر أنه يتحدث مع مساعد AI احترافي.

الخدمات:
- مواقع وصفحات هبوط احترافية.
- بوت واتساب AI.
- منيو ذكي للمطاعم والكافيهات.
- ربط Google Maps وتحسين الظهور.
- حجوزات وطلبات.
- أتمتة تشغيلية.
- تقارير ولوحات متابعة.

الباقات:
START — 399 ريال مرة واحدة: بداية رقمية سريعة، صفحة هبوط، زر واتساب، خرائط، وردود واتساب أساسية.
GROWTH — 999 ريال شهرياً: موقع 5 صفحات، بوت واتساب ذكي، جمع بيانات العملاء، منيو ذكي، حجوزات وطلبات، تقارير أساسية.
ADVANCED — 1999 ريال شهرياً: موقع موسع، بوت AI متقدم، تكاملات، لوحة متابعة، تقارير متقدمة، دعم مميز.

آلية الحوار:
ابدأ بفهم نوع النشاط والاحتياج.
بعد وضوح الاحتياج، رشّح الباقة المناسبة فقط.
اجمع البيانات تدريجياً: نوع النشاط، المدينة، اسم النشاط، رقم الواتساب.

قاعدة التحويل إلى واتساب:
- لا تذكر رقم الواتساب ولا رابط واتساب إلا إذا طلب العميل التواصل صراحة.
- لا تحوّل العميل إلى واتساب لمجرد أنه سأل عن خدمة أو باقة أو سعر.
- عند طلب التواصل صراحة فقط، استخدم:
أكيد. تقدر تتواصل مع فريق Blumark24 عبر واتساب:
https://wa.me/966507006849`;

type ChatMessage = {
  role?: string;
  content?: unknown;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders() });
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((message) => typeof message?.content === "string" && message.content.trim().length > 0)
    .slice(-12)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content).slice(0, 4000) }],
    }));
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}

export async function POST(req: NextRequest) {
  let payload: { messages?: ChatMessage[] };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { messages } = payload || {};
  if (!Array.isArray(messages)) {
    return json({ error: "Missing messages array" }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[chat proxy] GEMINI_API_KEY is not set");
    return json({ error: "Server configuration error: missing GEMINI_API_KEY" }, 500);
  }

  const contents = toGeminiContents(messages);
  if (contents.length === 0) {
    return json({ error: "No valid messages found" }, 400);
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error("[chat proxy] Gemini request failed", {
        status: upstream.status,
        message: data?.error?.message || "unknown",
      });
      return json({ error: data?.error?.message || "Gemini request failed" }, upstream.status);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) {
      console.error("[chat proxy] Gemini returned empty reply");
      return json({ error: "Empty response from AI service" }, 502);
    }

    return json({ text: reply }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[chat proxy] failed to reach Gemini", { message });
    return json({ error: "Failed to reach AI service" }, 500);
  }
}
