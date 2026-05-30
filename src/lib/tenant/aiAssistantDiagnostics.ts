/**
 * Structured diagnostics for tenant AI assistant (server-side only).
 * Logs never include prompts, API keys, emails, or raw provider bodies.
 */

export type AssistantDiagnosticCode =
  | "AUTH_ERROR"
  | "TENANT_ERROR"
  | "RLS_ERROR"
  | "AI_CONTEXT_ERROR"
  | "OPENAI_ERROR";

export type AssistantDiagnosticDetail =
  | "AUTH_MISSING_TOKEN"
  | "AUTH_INVALID_SESSION"
  | "TENANT_NO_ORGANIZATION"
  | "TENANT_PLATFORM_ROLE"
  | "TENANT_ORG_UNAVAILABLE"
  | "RLS_PROFILE_DENIED"
  | "RLS_DATA_DENIED"
  | "AI_CONTEXT_BUILD_FAILED"
  | "AI_CONTEXT_PARTIAL"
  | "OPENAI_KEY_MISSING"
  | "OPENAI_KEY_INVALID"
  | "OPENAI_HTTP_ERROR"
  | "OPENAI_TIMEOUT"
  | "OPENAI_EMPTY_REPLY"
  | "REQUEST_INVALID"
  | "UNEXPECTED"
  | "ASSISTANT_OK";

const LOG_TAG = "[tenant/ai-assistant]";

export interface AssistantLogFields {
  code: AssistantDiagnosticCode;
  detail: AssistantDiagnosticDetail;
  status: number;
  organizationId?: string;
  userId?: string;
  httpStatus?: number;
  table?: string;
}

export function logAssistantEvent(
  event: "denied" | "context_fail" | "openai_fail" | "success" | "unexpected",
  fields: AssistantLogFields,
): void {
  console.info(
    JSON.stringify({
      tag: LOG_TAG,
      event,
      ts: new Date().toISOString(),
      code: fields.code,
      detail: fields.detail,
      status: fields.status,
      organizationId: fields.organizationId ?? null,
      userId: fields.userId ? fields.userId.slice(0, 8) + "…" : null,
      httpStatus: fields.httpStatus ?? null,
      table: fields.table ?? null,
    }),
  );
}

export function isRlsOrPermissionError(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  const code = errorCode(err);
  return (
    code === "42501"
    || code === "PGRST301"
    || msg.includes("row-level security")
    || msg.includes("permission denied")
    || msg.includes("not authorized")
    || msg.includes("jwt")
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err ?? "");
}

function errorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

export function classifyContextLoadError(err: unknown): {
  code: "RLS_ERROR" | "AI_CONTEXT_ERROR";
  detail: AssistantDiagnosticDetail;
} {
  if (isRlsOrPermissionError(err)) {
    return { code: "RLS_ERROR", detail: "RLS_DATA_DENIED" };
  }
  return { code: "AI_CONTEXT_ERROR", detail: "AI_CONTEXT_BUILD_FAILED" };
}

export function safeMessageForCode(
  code: AssistantDiagnosticCode,
  detail: AssistantDiagnosticDetail,
): string {
  switch (detail) {
    case "AUTH_MISSING_TOKEN":
    case "AUTH_INVALID_SESSION":
      return "جلسة غير صالحة — سجّل الدخول مجدداً";
    case "TENANT_NO_ORGANIZATION":
      return "حسابك غير مربوط بمنشأة — لا يتوفر المساعد";
    case "TENANT_PLATFORM_ROLE":
      return "المساعد متاح لمساحة عمل المنشأة فقط";
    case "TENANT_ORG_UNAVAILABLE":
      return "بيانات المنشأة غير متاحة لحسابك الحالي";
    case "RLS_PROFILE_DENIED":
      return "صلاحيات القراءة تمنع تحميل ملفك — تواصل مع مدير المنشأة";
    case "RLS_DATA_DENIED":
      return "صلاحيات القراءة تمنع تحميل ملخص المنشأة";
    case "AI_CONTEXT_BUILD_FAILED":
      return "تعذر تجميع ملخص المنشأة الآمن";
    case "OPENAI_KEY_MISSING":
      return "مفتاح الذكاء الاصطناعي غير مضبوط على الخادم";
    case "OPENAI_KEY_INVALID":
      return "مفتاح الذكاء الاصطناعي غير صالح أو غير مفعّل";
    case "OPENAI_HTTP_ERROR":
    case "OPENAI_TIMEOUT":
    case "OPENAI_EMPTY_REPLY":
      return "تعذر الاتصال بمزود الذكاء الاصطناعي حالياً";
    case "REQUEST_INVALID":
      return "طلب غير صالح";
    default:
      return "تعذر إكمال طلب المساعد — راجع الإعدادات أو حاول لاحقاً";
  }
}

/** Short assistant bubble when tenant context is not available. */
export function buildCodeOnlyAssistantReply(
  message: string,
  detail: AssistantDiagnosticDetail,
): string {
  const hint =
    detail === "OPENAI_KEY_MISSING" || detail.startsWith("OPENAI_")
      ? "\n\nيمكنك مراجعة مدير النظام لتفعيل مزود الذكاء."
      : "";
  return `⚠️ ${message}${hint}`;
}
