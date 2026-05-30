import type { TenantAiContextPayload } from "@/lib/tenant/aiContext";
import type { AssistantDiagnosticDetail } from "@/lib/tenant/aiAssistantDiagnostics";

export const AI_ASSISTANT_MAX_MESSAGE_CHARS = 2000;
export const AI_ASSISTANT_MAX_HISTORY = 6;
export const AI_ASSISTANT_MAX_OUTPUT_TOKENS = 600;

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const ALLOWED_OPENAI_MODELS = new Set([
  "gpt-4o-mini",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
]);

export type AssistantChatRole = "user" | "assistant";

export interface AssistantHistoryMessage {
  role: AssistantChatRole;
  content: string;
}

export function resolveOpenAiModel(): string {
  const env = (process.env.OPENAI_MODEL ?? "").trim();
  if (env && ALLOWED_OPENAI_MODELS.has(env)) return env;
  return DEFAULT_OPENAI_MODEL;
}

export function buildTenantAiSystemPrompt(
  context: TenantAiContextPayload,
): string {
  const financeRule = context.finance.available
    ? "يمكنك الإجابة عن المالية باستخدام المجاميع المتاحة فقط (دخل/مصروف/صافي) دون تفاصيل معاملات."
    : "لا تُجب عن أسئلة مالية تفصيلية — بيانات المالية غير متاحة لهذا المستخدم (finance.available = false).";

  return `أنت مساعد تنفيذي للعمليات داخل منشأة واحدة فقط (Blumark24 OS).
اللغة: العربية الفصحى المبسطة، نبرة عملية ومختصرة.

قواعد صارمة:
- استخدم فقط سياق المنشأة المرفق أدناه (ملخصات وأعداد). لا تدّعِ الوصول لبيانات خارج هذا السياق.
- لا تذكر معرفات UUID أو مفاتيح API أو أسراراً أو بيانات منشآت أخرى.
- لا تقترح الوصول عبر منشآت أو حسابات أخرى.
- إذا طُلب منك إنشاء/تعديل/حذف بيانات: اشرح أن هذا الإصدار يقدم توصيات وتحليلاً فقط دون تنفيذ تغييرات.
- ${financeRule}
- عند نقص المعلومات، قل ذلك بوضوح ولا تخمّن أرقاماً.

سياق المنشأة (JSON):
${JSON.stringify(context)}`;
}

export function parseAssistantRequestBody(body: unknown):
  | { ok: true; message: string; conversationHistory: AssistantHistoryMessage[] }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "طلب غير صالح" };
  }

  const record = body as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message.trim() : "";

  if (!message) {
    return { ok: false, error: "الرسالة فارغة" };
  }
  if (message.length > AI_ASSISTANT_MAX_MESSAGE_CHARS) {
    return { ok: false, error: "الرسالة طويلة جداً" };
  }

  let conversationHistory: AssistantHistoryMessage[] = [];
  if (record.conversationHistory !== undefined) {
    if (!Array.isArray(record.conversationHistory)) {
      return { ok: false, error: "سجل المحادثة غير صالح" };
    }
    const sliced = record.conversationHistory.slice(-AI_ASSISTANT_MAX_HISTORY);
    for (const item of sliced) {
      if (!item || typeof item !== "object") {
        return { ok: false, error: "سجل المحادثة غير صالح" };
      }
      const row = item as Record<string, unknown>;
      const role = row.role;
      const content = typeof row.content === "string" ? row.content.trim() : "";
      if (role !== "user" && role !== "assistant") {
        return { ok: false, error: "سجل المحادثة غير صالح" };
      }
      if (!content || content.length > AI_ASSISTANT_MAX_MESSAGE_CHARS) {
        return { ok: false, error: "سجل المحادثة غير صالح" };
      }
      conversationHistory.push({ role, content });
    }
  }

  return { ok: true, message, conversationHistory };
}

export const OPENAI_KEY_MISSING_MESSAGE =
  "مفتاح الذكاء الاصطناعي غير مضبوط على الخادم";

export const OPENAI_KEY_INVALID_MESSAGE =
  "مفتاح الذكاء الاصطناعي غير صالح أو غير مفعّل";

export const OPENAI_PROVIDER_UNAVAILABLE_MESSAGE =
  "تعذر الاتصال بمزود الذكاء الاصطناعي حالياً";

export function buildLocalContextFallback(
  context: TenantAiContextPayload,
): string {
  const orgName = context.organization.name || "منشأتك";
  const lines = [
    "أستطيع قراءة ملخص منشأتك، لكن نموذج الذكاء غير متاح حالياً. إليك لمحة سريعة من البيانات الآمنة:",
    "",
    `**${orgName}**`,
    `- الموظفون: ${context.employees.total} (نشط ${context.employees.active}، خارج الهيكل ${context.employees.outsideStructure})`,
    `- المهام: ${context.tasks.total} (مفتوحة ${context.tasks.open}، متأخرة ${context.tasks.overdue}، مكتملة ${context.tasks.completed})`,
    `- العملاء: ${context.clients.total} (نشط ${context.clients.active})`,
    `- الهيكل: ${context.orgStructure.departments} أقسام، ${context.orgStructure.teams} فرق`,
  ];

  if (context.finance.available) {
    lines.push(
      `- المالية (مجاميع): دخل ${context.finance.totalIncome}، مصروف ${context.finance.totalExpense}، صافي ${context.finance.netProfit}`,
    );
  } else {
    lines.push("- المالية: غير متاحة لدورك الحالي");
  }

  lines.push("", "جرّب لاحقاً بعد ضبط مزود الذكاء، أو تواصل مع الدعم.");
  return lines.join("\n");
}

export type OpenAiCallResult =
  | { ok: true; reply: string }
  | {
      ok: false;
      status: number;
      message: string;
      useFallback: boolean;
      detail: AssistantDiagnosticDetail;
    };

export async function callOpenAiAssistant(input: {
  apiKey: string;
  systemPrompt: string;
  message: string;
  conversationHistory: AssistantHistoryMessage[];
}): Promise<OpenAiCallResult> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: input.systemPrompt },
    ...input.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  const model = resolveOpenAiModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: AI_ASSISTANT_MAX_OUTPUT_TOKENS,
        temperature: 0.35,
      }),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        status: 503,
        message: OPENAI_KEY_INVALID_MESSAGE,
        useFallback: true,
        detail: "OPENAI_KEY_INVALID",
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: 503,
        message: OPENAI_PROVIDER_UNAVAILABLE_MESSAGE,
        useFallback: true,
        detail: "OPENAI_HTTP_ERROR",
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return {
        ok: false,
        status: 503,
        message: OPENAI_PROVIDER_UNAVAILABLE_MESSAGE,
        useFallback: true,
        detail: "OPENAI_EMPTY_REPLY",
      };
    }

    return { ok: true, reply };
  } catch (err) {
    const detail =
      err instanceof DOMException && err.name === "AbortError"
        ? "OPENAI_TIMEOUT"
        : "OPENAI_HTTP_ERROR";
    return {
      ok: false,
      status: 503,
      message: OPENAI_PROVIDER_UNAVAILABLE_MESSAGE,
      useFallback: true,
      detail,
    };
  } finally {
    clearTimeout(timeout);
  }
}
