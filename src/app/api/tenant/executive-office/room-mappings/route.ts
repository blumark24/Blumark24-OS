import { NextRequest, NextResponse } from "next/server";
import { resolveTenantSession } from "@/lib/tenant/resolveTenantSession";
import {
  ExecutiveOfficeMappingError,
  deactivateExecutiveOfficeRoomMapping,
  loadActiveExecutiveOfficeRoomMappings,
  parseRoomMappingDeletePayload,
  parseRoomMappingPatchPayload,
  parseRoomMappingPayload,
  replaceExecutiveOfficeRoomMapping,
  updateExecutiveOfficeRoomMapping,
} from "@/lib/tenant/executiveOfficeRoomMappings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAG = "[tenant/executive-office/room-mappings]";

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ExecutiveOfficeMappingError(
      400,
      "INVALID_JSON",
      "صيغة الطلب غير صالحة",
    );
  }
}

function handleError(err: unknown) {
  if (err instanceof ExecutiveOfficeMappingError) {
    return json({ error: err.message, code: err.code }, err.status);
  }

  console.error(`${TAG} unexpected:`, err);
  return json({ error: "تعذر تنفيذ الطلب", code: "UNEXPECTED_ERROR" }, 500);
}

export async function GET(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return json({ error: session.error, code: session.code }, session.status);
    }

    const mappings = await loadActiveExecutiveOfficeRoomMappings({
      client: session.client,
      organizationId: session.organizationId,
    });

    return json({ mappings });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return json({ error: session.error, code: session.code }, session.status);
    }

    const parsed = parseRoomMappingPayload(await readJson(req));
    if (!parsed.ok) return json({ error: parsed.error, code: "INVALID_PAYLOAD" }, 400);

    const mapping = await replaceExecutiveOfficeRoomMapping({
      client: session.client,
      organizationId: session.organizationId,
      fixedRoomKey: parsed.value.fixed_room_key,
      mappedUnitType: parsed.value.mapped_unit_type,
      mappedUnitId: parsed.value.mapped_unit_id,
      displayName: parsed.value.display_name,
    });

    return json({ mapping }, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return json({ error: session.error, code: session.code }, session.status);
    }

    const parsed = parseRoomMappingPatchPayload(await readJson(req));
    if (!parsed.ok) return json({ error: parsed.error, code: "INVALID_PAYLOAD" }, 400);

    const mapping = await updateExecutiveOfficeRoomMapping({
      client: session.client,
      organizationId: session.organizationId,
      fixedRoomKey: parsed.value.fixed_room_key,
      mappedUnitType: parsed.value.mapped_unit_type,
      mappedUnitId: parsed.value.mapped_unit_id,
      displayName: parsed.value.display_name,
    });

    return json({ mapping });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await resolveTenantSession(req);
    if (!session.ok) {
      return json({ error: session.error, code: session.code }, session.status);
    }

    const parsed = parseRoomMappingDeletePayload(await readJson(req));
    if (!parsed.ok) return json({ error: parsed.error, code: "INVALID_PAYLOAD" }, 400);

    const result = await deactivateExecutiveOfficeRoomMapping({
      client: session.client,
      organizationId: session.organizationId,
      fixedRoomKey: parsed.value.fixed_room_key,
    });

    return json(result);
  } catch (err) {
    return handleError(err);
  }
}
