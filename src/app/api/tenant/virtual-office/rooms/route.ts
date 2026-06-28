import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXECUTIVE_OFFICE_FIXED_ROOM_KEYS } from "@/lib/tenant/executiveOfficeRoomMappings";
import {
  isMissingVirtualOfficeTableError,
  resolveVirtualOfficeApiReadiness,
  virtualOfficeTableMissingResponse,
} from "@/lib/tenant/virtualOfficeReadiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/virtual-office/rooms]";

const BOARD_ROOM_KEY = "board";

const DEFAULT_DISPLAY_NAMES: Record<string, string> = {
  sales:     "مكتب المبيعات",
  executive: "مكتب الإدارة العليا",
  support:   "مكتب الدعم",
  marketing: "مكتب التسويق",
  board:     "مكتب مجلس الإدارة",
  finance:   "مكتب المالية",
  execution: "مكتب التنفيذ",
  ai:        "مكتب الذكاء الاصطناعي",
  meetings:  "غرفة الاجتماعات",
};

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

function handleError(err: unknown) {
  console.error(`${TAG} unexpected:`, err);
  return json({ error: "تعذر تنفيذ الطلب" }, 500);
}

async function ensureDefaultRooms(
  client: SupabaseClient,
  organizationId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { data: existing, error: selectError } = await client
    .from("tenant_virtual_office_rooms")
    .select("room_key")
    .eq("organization_id", organizationId);

  if (selectError) {
    if (isMissingVirtualOfficeTableError(selectError)) {
      return { ok: false, response: virtualOfficeTableMissingResponse() };
    }
    console.error(`${TAG} default rooms select:`, selectError);
    return { ok: false, response: json({ error: "تعذر تحميل غرف المكتب الافتراضي" }, 500) };
  }

  const existingKeys = new Set((existing ?? []).map((r: { room_key: string }) => r.room_key));
  const missing = EXECUTIVE_OFFICE_FIXED_ROOM_KEYS.filter((k) => !existingKeys.has(k));
  if (missing.length === 0) return { ok: true };

  const inserts = missing.map((key, i) => {
    const slotIndex = EXECUTIVE_OFFICE_FIXED_ROOM_KEYS.indexOf(key);
    return {
      organization_id: organizationId,
      room_key: key,
      room_number: slotIndex + 1,
      display_name: DEFAULT_DISPLAY_NAMES[key] ?? key,
      is_board: key === BOARD_ROOM_KEY,
      is_reserved: key === BOARD_ROOM_KEY,
      is_open: true,
    };
  });

  const { error: upsertError } = await client.from("tenant_virtual_office_rooms").upsert(inserts, {
    onConflict: "organization_id,room_key",
    ignoreDuplicates: true,
  });

  if (upsertError) {
    if (isMissingVirtualOfficeTableError(upsertError)) {
      return { ok: false, response: virtualOfficeTableMissingResponse() };
    }
    console.error(`${TAG} default rooms upsert:`, upsertError);
    return { ok: false, response: json({ error: "تعذر تجهيز غرف المكتب الافتراضي" }, 500) };
  }

  return { ok: true };
}

export async function GET(req: NextRequest) {
  try {
    const readiness = await resolveVirtualOfficeApiReadiness(req);
    if (!readiness.ok) return readiness.response;
    const { session } = readiness;

    const defaultRooms = await ensureDefaultRooms(session.client, session.organizationId);
    if (!defaultRooms.ok) return defaultRooms.response;

    const { data, error } = await session.client
      .from("tenant_virtual_office_rooms")
      .select("id, room_key, room_number, display_name, is_board, is_reserved, is_open, updated_at")
      .eq("organization_id", session.organizationId)
      .order("room_number");

    if (error) {
      if (isMissingVirtualOfficeTableError(error)) {
        return virtualOfficeTableMissingResponse();
      }
      console.error(`${TAG} select:`, error);
      return json({ error: "تعذر تحميل الغرف" }, 500);
    }

    return json({ rooms: data ?? [] });
  } catch (err) {
    return handleError(err);
  }
}
