import type { SupabaseClient } from "@supabase/supabase-js";

export const EXECUTIVE_OFFICE_FIXED_ROOM_KEYS = [
  "executive",
  "sales",
  "support",
  "marketing",
  "board",
  "finance",
  "execution",
  "ai",
  "meetings",
] as const;

export const EXECUTIVE_OFFICE_MAPPED_UNIT_TYPES = [
  "agency",
  "management",
  "department",
  "team",
] as const;

export type ExecutiveOfficeFixedRoomKey =
  (typeof EXECUTIVE_OFFICE_FIXED_ROOM_KEYS)[number];

export type ExecutiveOfficeMappedUnitType =
  (typeof EXECUTIVE_OFFICE_MAPPED_UNIT_TYPES)[number];

export interface ExecutiveOfficeRoomMapping {
  id: string;
  organization_id: string;
  fixed_room_key: ExecutiveOfficeFixedRoomKey;
  mapped_unit_type: ExecutiveOfficeMappedUnitType;
  mapped_unit_id: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExecutiveOfficeRoomMappingByRoom = Partial<
  Record<ExecutiveOfficeFixedRoomKey, ExecutiveOfficeRoomMapping>
>;

export type ParsedRoomMappingPayload =
  | {
      ok: true;
      value: {
        fixed_room_key: ExecutiveOfficeFixedRoomKey;
        mapped_unit_type: ExecutiveOfficeMappedUnitType;
        mapped_unit_id: string;
        display_name: string | null;
      };
    }
  | { ok: false; error: string };

export type ParsedRoomMappingPatchPayload =
  | {
      ok: true;
      value: RoomMappingPatchValue;
    }
  | { ok: false; error: string };

type RoomMappingPatchValue = {
  fixed_room_key: ExecutiveOfficeFixedRoomKey;
  mapped_unit_type?: ExecutiveOfficeMappedUnitType;
  mapped_unit_id?: string;
  display_name?: string | null;
};

export type ParsedRoomMappingDeletePayload =
  | { ok: true; value: { fixed_room_key: ExecutiveOfficeFixedRoomKey } }
  | { ok: false; error: string };

export class ExecutiveOfficeMappingError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAPPING_COLUMNS =
  "id, organization_id, fixed_room_key, mapped_unit_type, mapped_unit_id, display_name, is_active, created_at, updated_at";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isExecutiveOfficeFixedRoomKey(
  value: unknown,
): value is ExecutiveOfficeFixedRoomKey {
  return (
    typeof value === "string" &&
    EXECUTIVE_OFFICE_FIXED_ROOM_KEYS.includes(
      value as ExecutiveOfficeFixedRoomKey,
    )
  );
}

export function isExecutiveOfficeMappedUnitType(
  value: unknown,
): value is ExecutiveOfficeMappedUnitType {
  return (
    typeof value === "string" &&
    EXECUTIVE_OFFICE_MAPPED_UNIT_TYPES.includes(
      value as ExecutiveOfficeMappedUnitType,
    )
  );
}

function normalizeDisplayName(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") {
    return { ok: false, error: "اسم العرض غير صالح" };
  }

  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > 120) {
    return { ok: false, error: "اسم العرض يجب ألا يتجاوز 120 حرفاً" };
  }
  return { ok: true, value: trimmed };
}

export function parseRoomMappingPayload(
  body: unknown,
): ParsedRoomMappingPayload {
  if (!isRecord(body)) return { ok: false, error: "بيانات الربط غير صالحة" };

  if (!isExecutiveOfficeFixedRoomKey(body.fixed_room_key)) {
    return { ok: false, error: "الغرفة المحددة غير صالحة" };
  }
  if (!isExecutiveOfficeMappedUnitType(body.mapped_unit_type)) {
    return { ok: false, error: "نوع الوحدة الإدارية غير صالح" };
  }
  if (typeof body.mapped_unit_id !== "string" || !UUID_RE.test(body.mapped_unit_id)) {
    return { ok: false, error: "معرف الوحدة الإدارية غير صالح" };
  }

  const displayName = normalizeDisplayName(body.display_name);
  if (!displayName.ok) return displayName;

  return {
    ok: true,
    value: {
      fixed_room_key: body.fixed_room_key,
      mapped_unit_type: body.mapped_unit_type,
      mapped_unit_id: body.mapped_unit_id,
      display_name: displayName.value,
    },
  };
}

export function parseRoomMappingPatchPayload(
  body: unknown,
): ParsedRoomMappingPatchPayload {
  if (!isRecord(body)) return { ok: false, error: "بيانات الربط غير صالحة" };

  if (!isExecutiveOfficeFixedRoomKey(body.fixed_room_key)) {
    return { ok: false, error: "الغرفة المحددة غير صالحة" };
  }

  const hasMappedUnitType = body.mapped_unit_type !== undefined;
  const hasMappedUnitId = body.mapped_unit_id !== undefined;
  const hasDisplayName = body.display_name !== undefined;

  if (!hasMappedUnitType && !hasMappedUnitId && !hasDisplayName) {
    return { ok: false, error: "لا توجد بيانات لتحديث الربط" };
  }

  if (hasMappedUnitType !== hasMappedUnitId) {
    return {
      ok: false,
      error: "يجب إرسال نوع الوحدة ومعرفها معاً عند تعديل الربط",
    };
  }

  const value: RoomMappingPatchValue = {
    fixed_room_key: body.fixed_room_key,
  };

  if (hasMappedUnitType) {
    if (!isExecutiveOfficeMappedUnitType(body.mapped_unit_type)) {
      return { ok: false, error: "نوع الوحدة الإدارية غير صالح" };
    }
    if (typeof body.mapped_unit_id !== "string" || !UUID_RE.test(body.mapped_unit_id)) {
      return { ok: false, error: "معرف الوحدة الإدارية غير صالح" };
    }
    value.mapped_unit_type = body.mapped_unit_type;
    value.mapped_unit_id = body.mapped_unit_id;
  }

  if (hasDisplayName) {
    const displayName = normalizeDisplayName(body.display_name);
    if (!displayName.ok) return displayName;
    value.display_name = displayName.value;
  }

  return { ok: true, value };
}

export function parseRoomMappingDeletePayload(
  body: unknown,
): ParsedRoomMappingDeletePayload {
  if (!isRecord(body)) return { ok: false, error: "بيانات الربط غير صالحة" };
  if (!isExecutiveOfficeFixedRoomKey(body.fixed_room_key)) {
    return { ok: false, error: "الغرفة المحددة غير صالحة" };
  }
  return { ok: true, value: { fixed_room_key: body.fixed_room_key } };
}

export async function loadActiveExecutiveOfficeRoomMappings(input: {
  client: SupabaseClient;
  organizationId: string;
}): Promise<ExecutiveOfficeRoomMappingByRoom> {
  const { data, error } = await input.client
    .from("executive_office_room_mappings")
    .select(MAPPING_COLUMNS)
    .eq("organization_id", input.organizationId)
    .eq("is_active", true)
    .returns<ExecutiveOfficeRoomMapping[]>();

  if (error) throw mapSupabaseRoomMappingError(error, "تعذر تحميل ربط الغرف");

  const byRoom: ExecutiveOfficeRoomMappingByRoom = {};
  for (const row of data ?? []) {
    byRoom[row.fixed_room_key] = row;
  }
  return byRoom;
}

async function assertMappedUnitBelongsToOrganization(input: {
  client: SupabaseClient;
  organizationId: string;
  mappedUnitType: ExecutiveOfficeMappedUnitType;
  mappedUnitId: string;
}): Promise<void> {
  if (input.mappedUnitType === "team") {
    const { data, error } = await input.client
      .from("teams")
      .select("id, organization_id")
      .eq("id", input.mappedUnitId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();

    if (error) {
      throw mapSupabaseRoomMappingError(error, "تعذر التحقق من الفريق");
    }
    if (!data) {
      throw new ExecutiveOfficeMappingError(
        400,
        "INVALID_MAPPED_UNIT",
        "الفريق المحدد غير متاح داخل هذه المنشأة",
      );
    }
    return;
  }

  const { data, error } = await input.client
    .from("departments")
    .select("id, organization_id, structure_level")
    .eq("id", input.mappedUnitId)
    .eq("organization_id", input.organizationId)
    .eq("structure_level", input.mappedUnitType)
    .maybeSingle();

  if (error) {
    throw mapSupabaseRoomMappingError(error, "تعذر التحقق من الوحدة الإدارية");
  }
  if (!data) {
    throw new ExecutiveOfficeMappingError(
      400,
      "INVALID_MAPPED_UNIT",
      "الوحدة الإدارية المحددة غير متاحة داخل هذه المنشأة",
    );
  }
}

export async function replaceExecutiveOfficeRoomMapping(input: {
  client: SupabaseClient;
  organizationId: string;
  fixedRoomKey: ExecutiveOfficeFixedRoomKey;
  mappedUnitType: ExecutiveOfficeMappedUnitType;
  mappedUnitId: string;
  displayName: string | null;
}): Promise<ExecutiveOfficeRoomMapping> {
  await assertMappedUnitBelongsToOrganization({
    client: input.client,
    organizationId: input.organizationId,
    mappedUnitType: input.mappedUnitType,
    mappedUnitId: input.mappedUnitId,
  });

  const { error: deactivateError } = await input.client
    .from("executive_office_room_mappings")
    .update({ is_active: false })
    .eq("organization_id", input.organizationId)
    .eq("fixed_room_key", input.fixedRoomKey)
    .eq("is_active", true);

  if (deactivateError) {
    throw mapSupabaseRoomMappingError(
      deactivateError,
      "تعذر استبدال ربط الغرفة",
    );
  }

  const { data, error } = await input.client
    .from("executive_office_room_mappings")
    .insert({
      organization_id: input.organizationId,
      fixed_room_key: input.fixedRoomKey,
      mapped_unit_type: input.mappedUnitType,
      mapped_unit_id: input.mappedUnitId,
      display_name: input.displayName,
      is_active: true,
    })
    .select(MAPPING_COLUMNS)
    .single<ExecutiveOfficeRoomMapping>();

  if (error) {
    throw mapSupabaseRoomMappingError(error, "تعذر إنشاء ربط الغرفة");
  }
  return data;
}

export async function updateExecutiveOfficeRoomMapping(input: {
  client: SupabaseClient;
  organizationId: string;
  fixedRoomKey: ExecutiveOfficeFixedRoomKey;
  mappedUnitType?: ExecutiveOfficeMappedUnitType;
  mappedUnitId?: string;
  displayName?: string | null;
}): Promise<ExecutiveOfficeRoomMapping> {
  const patch: Record<string, string | boolean | null> = {};

  if (input.mappedUnitType && input.mappedUnitId) {
    await assertMappedUnitBelongsToOrganization({
      client: input.client,
      organizationId: input.organizationId,
      mappedUnitType: input.mappedUnitType,
      mappedUnitId: input.mappedUnitId,
    });
    patch.mapped_unit_type = input.mappedUnitType;
    patch.mapped_unit_id = input.mappedUnitId;
  }

  if (input.displayName !== undefined) {
    patch.display_name = input.displayName ?? null;
  }

  const { data, error } = await input.client
    .from("executive_office_room_mappings")
    .update(patch)
    .eq("organization_id", input.organizationId)
    .eq("fixed_room_key", input.fixedRoomKey)
    .eq("is_active", true)
    .select(MAPPING_COLUMNS)
    .maybeSingle<ExecutiveOfficeRoomMapping>();

  if (error) {
    throw mapSupabaseRoomMappingError(error, "تعذر تحديث ربط الغرفة");
  }
  if (!data) {
    throw new ExecutiveOfficeMappingError(
      404,
      "MAPPING_NOT_FOUND",
      "لا يوجد ربط نشط لهذه الغرفة",
    );
  }
  return data;
}

export async function deactivateExecutiveOfficeRoomMapping(input: {
  client: SupabaseClient;
  organizationId: string;
  fixedRoomKey: ExecutiveOfficeFixedRoomKey;
}): Promise<{ deactivated: boolean }> {
  const { data, error } = await input.client
    .from("executive_office_room_mappings")
    .update({ is_active: false })
    .eq("organization_id", input.organizationId)
    .eq("fixed_room_key", input.fixedRoomKey)
    .eq("is_active", true)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw mapSupabaseRoomMappingError(error, "تعذر إلغاء ربط الغرفة");
  }
  return { deactivated: Boolean(data) };
}

export function mapSupabaseRoomMappingError(
  error: { code?: string; message?: string; status?: number },
  fallbackMessage: string,
): ExecutiveOfficeMappingError {
  const code = error.code ?? "";
  const message = error.message ?? "";

  if (code === "23505") {
    return new ExecutiveOfficeMappingError(
      409,
      "MAPPING_CONFLICT",
      "يوجد ربط نشط لهذه الغرفة بالفعل",
    );
  }

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new ExecutiveOfficeMappingError(
      403,
      "RLS_DENIED",
      "ليست لديك صلاحية تعديل ربط الغرف",
    );
  }

  if (code === "23514" || code === "P0001") {
    return new ExecutiveOfficeMappingError(
      400,
      "INVALID_MAPPING",
      "بيانات الربط لا تطابق قواعد الهيكل الإداري",
    );
  }

  return new ExecutiveOfficeMappingError(
    error.status && error.status >= 400 ? error.status : 500,
    "ROOM_MAPPING_ERROR",
    fallbackMessage,
  );
}
