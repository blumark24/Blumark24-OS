export type TenantPresencePlanStatus = "blocked" | "planned";
export type TenantPresenceUserStatus = "available" | "busy" | "away" | "offline";

export interface TenantPresencePlanInput {
  tenantId?: string | null;
  officeNumber?: number | null;
  userId?: string | null;
  displayName?: string | null;
  roleOrUnit?: string | null;
  status?: TenantPresenceUserStatus | null;
  consentGranted?: boolean;
  serverValidated?: boolean;
  rlsReady?: boolean;
  timeoutSeconds?: number | null;
}

export interface TenantPresencePayloadShape {
  tenantId: string;
  officeNumber: number;
  userId: string;
  displayName: string;
  roleOrUnit: string;
  status: TenantPresenceUserStatus;
  manual: true;
  consentGranted: true;
  expiresInSeconds: number;
}

export interface TenantPresencePlan {
  status: TenantPresencePlanStatus;
  channelName: string | null;
  scopeKey: string | null;
  payloadShape: TenantPresencePayloadShape | null;
  timeoutSeconds: number;
  canCreateRealtimeChannel: boolean;
  blockedReasons: string[];
  notes: string[];
}

const MIN_TIMEOUT_SECONDS = 60;
const MAX_TIMEOUT_SECONDS = 900;

function cleanToken(value?: string | null): string | null {
  const clean = value?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean ? clean.slice(0, 64) : null;
}

function cleanLabel(value?: string | null, fallback = "غير محدد"): string {
  const clean = value?.trim();
  return clean ? clean.slice(0, 80) : fallback;
}

function safeOfficeNumber(value?: number | null): number | null {
  if (!Number.isFinite(value ?? NaN)) return null;
  const number = Math.trunc(Number(value));
  return number > 0 && number <= 99 ? number : null;
}

function safeTimeout(value?: number | null): number {
  if (!Number.isFinite(value ?? NaN)) return 300;
  return Math.max(MIN_TIMEOUT_SECONDS, Math.min(MAX_TIMEOUT_SECONDS, Math.trunc(Number(value))));
}

function officeLabel(officeNumber: number): string {
  return String(officeNumber).padStart(2, "0");
}

export function buildTenantPresencePlan(input: TenantPresencePlanInput = {}): TenantPresencePlan {
  const tenantId = cleanToken(input.tenantId);
  const userId = cleanToken(input.userId);
  const officeNumber = safeOfficeNumber(input.officeNumber);
  const timeoutSeconds = safeTimeout(input.timeoutSeconds);
  const blockedReasons: string[] = [];

  if (!tenantId) blockedReasons.push("tenant_required");
  if (!officeNumber) blockedReasons.push("office_required");
  if (!userId) blockedReasons.push("user_required");
  if (!input.consentGranted) blockedReasons.push("consent_required");
  if (!input.serverValidated) blockedReasons.push("server_validation_required");
  if (!input.rlsReady) blockedReasons.push("rls_required");

  const canCreateRealtimeChannel = blockedReasons.length === 0;
  const channelName = tenantId && officeNumber ? `tenant:${tenantId}:office:${officeLabel(officeNumber)}:presence` : null;
  const scopeKey = tenantId && officeNumber ? `${tenantId}/office-${officeLabel(officeNumber)}` : null;

  return {
    status: canCreateRealtimeChannel ? "planned" : "blocked",
    channelName,
    scopeKey,
    payloadShape: canCreateRealtimeChannel && tenantId && officeNumber && userId ? {
      tenantId,
      officeNumber,
      userId,
      displayName: cleanLabel(input.displayName, "مستخدم"),
      roleOrUnit: cleanLabel(input.roleOrUnit, "عضو مكتب"),
      status: input.status ?? "away",
      manual: true,
      consentGranted: true,
      expiresInSeconds: timeoutSeconds,
    } : null,
    timeoutSeconds,
    canCreateRealtimeChannel,
    blockedReasons,
    notes: [
      "هذه خطة نطاق فقط ولا تنشئ قناة realtime.",
      "الحضور يجب أن يبقى يدوياً وبموافقة صريحة.",
      "كل قناة مقيدة بالمنشأة والمكتب ولا تستخدم قناة عامة.",
      "الانتهاء التلقائي مطلوب لتقليل بقاء الحالة بعد الخمول.",
    ],
  };
}

export function canPlanTenantPresenceChannel(input: TenantPresencePlanInput = {}): boolean {
  return buildTenantPresencePlan(input).canCreateRealtimeChannel;
}
