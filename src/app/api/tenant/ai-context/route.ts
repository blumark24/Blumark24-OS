import { NextRequest, NextResponse } from "next/server";
import { buildTenantAiContext } from "@/lib/tenant/aiContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    const status = Number((err as { status?: unknown }).status);
    if (Number.isInteger(status) && status >= 400 && status <= 599) return status;
  }
  return 500;
}

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "internal_error";
  switch (message) {
    case "invalid_session":
      return "جلسة غير صالحة";
    case "missing_tenant_profile":
      return "حسابك غير مربوط بمنشأة";
    case "platform_workspace_mismatch":
      return "سياق المساعد الذكي غير متاح لحسابات المنصة داخل مساحة العميل";
    case "organization_not_available":
      return "المنشأة غير متاحة";
    case "missing_public_supabase_env":
    case "missing_server_supabase_env":
      return "إعداد الخادم غير مكتمل";
    default:
      return "تعذر تجهيز سياق المساعد الذكي";
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
    }

    const context = await buildTenantAiContext(token);
    return NextResponse.json({ success: true, context });
  } catch (err) {
    console.error("[tenant-ai-context] failed:", err);
    return NextResponse.json(
      { success: false, error: errorMessage(err) },
      { status: errorStatus(err) },
    );
  }
}
