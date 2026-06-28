import { NextRequest, NextResponse } from "next/server";
import { isExecutiveOfficeFixedRoomKey } from "@/lib/tenant/executiveOfficeRoomMappings";
import {
  isMissingVirtualOfficeTableError,
  resolveVirtualOfficeApiReadiness,
  virtualOfficeTableMissingResponse,
} from "@/lib/tenant/virtualOfficeReadiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/virtual-office/rooms/[roomKey]]";

const MANAGER_ROLES = new Set(["organization_manager", "super_admin"]);

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ roomKey: string }> },
) {
  try {
    const { roomKey } = await context.params;

    if (!isExecutiveOfficeFixedRoomKey(roomKey)) {
      return json({ error: "مفتاح الغرفة غير صالح" }, 400);
    }

    if (roomKey === "board") {
      return json({ error: "لا يمكن إغلاق مكتب مجلس الإدارة." }, 400);
    }

    const readiness = await resolveVirtualOfficeApiReadiness(req);
    if (!readiness.ok) return readiness.response;
    const { session } = readiness;

    if (!MANAGER_ROLES.has(session.role)) {
      return json({ error: "ليست لديك صلاحية إدارة المكاتب" }, 403);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "صيغة الطلب غير صالحة" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "بيانات الطلب غير صالحة" }, 400);
    }

    const patch = body as Record<string, unknown>;
    if (typeof patch.is_open !== "boolean") {
      return json({ error: "يجب إرسال قيمة is_open (true/false)" }, 400);
    }

    const { data, error } = await session.client
      .from("tenant_virtual_office_rooms")
      .update({ is_open: patch.is_open, updated_by: session.userId })
      .eq("organization_id", session.organizationId)
      .eq("room_key", roomKey)
      .select("id, room_key, room_number, display_name, is_board, is_reserved, is_open, updated_at")
      .maybeSingle();

    if (error) {
      if (isMissingVirtualOfficeTableError(error)) {
        return virtualOfficeTableMissingResponse();
      }
      console.error(`${TAG} update:`, error);
      return json({ error: "تعذر تحديث حالة الغرفة" }, 500);
    }

    if (!data) {
      return json({ error: "الغرفة غير موجودة" }, 404);
    }

    return json({ room: data });
  } catch (err) {
    console.error(`${TAG} unexpected:`, err);
    return json({ error: "تعذر تنفيذ الطلب" }, 500);
  }
}
