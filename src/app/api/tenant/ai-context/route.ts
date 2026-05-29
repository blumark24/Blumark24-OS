import { NextRequest, NextResponse } from "next/server";
import {
  loadTenantAiContextForSession,
  resolveTenantSession,
} from "@/lib/tenant/resolveTenantSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/ai-context]";

/** Read-only tenant summaries for future AI assistant — no LLM calls, no writes. */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const context = await loadTenantAiContextForSession(session);
    return NextResponse.json(context);
  } catch (err) {
    console.error(`${TAG} unexpected:`, err);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
