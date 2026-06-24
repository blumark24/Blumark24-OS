import { NextRequest, NextResponse } from "next/server";
import { resolveTenantSession } from "@/lib/tenant/resolveTenantSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/virtual-office/reset]";

const MANAGER_ROLES = new Set(["organization_manager", "super_admin"]);

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

// POST /api/tenant/virtual-office/reset
// Manager-only, tenant-scoped.
// Deactivates all active executive_office_room_mappings for this org.
// Opens all non-board tenant_virtual_office_rooms.
// Never deletes employees, tasks, departments, teams, or org data.
// Never affects any other tenant (all queries scoped to organization_id).
export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return json({ error: session.error, code: session.code }, session.status);
    }

    if (!MANAGER_ROLES.has(session.role)) {
      return json({ error: "ليست لديك صلاحية إعادة ضبط المكتب الافتراضي" }, 403);
    }

    const orgId = session.organizationId;

    // 1. Deactivate all active room mappings for this org only.
    const { error: mappingError } = await session.client
      .from("executive_office_room_mappings")
      .update({ is_active: false })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (mappingError) {
      console.error(`${TAG} deactivate mappings:`, mappingError);
      return json({ error: "تعذر إعادة ضبط ربط المكاتب" }, 500);
    }

    // 2. Open all non-board rooms for this org only.
    const { error: roomError } = await session.client
      .from("tenant_virtual_office_rooms")
      .update({ is_open: true })
      .eq("organization_id", orgId)
      .eq("is_board", false);

    if (roomError) {
      console.error(`${TAG} open rooms:`, roomError);
      return json({ error: "تعذر فتح المكاتب بعد إعادة الضبط" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error(`${TAG} unexpected:`, err);
    return json({ error: "تعذر تنفيذ الطلب" }, 500);
  }
}
