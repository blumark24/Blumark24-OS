export type OfficePresenceSource = "none" | "manual" | "activity" | "realtime";
export type OfficePresenceConsent = "not_requested" | "granted" | "denied";
export type SafeOfficePresenceStatus = "unknown" | "available" | "busy" | "offline";

export interface OfficePresenceInput {
  source?: OfficePresenceSource;
  consent?: OfficePresenceConsent;
  lastActivityAt?: string | Date | null;
  manualStatus?: SafeOfficePresenceStatus | null;
  now?: string | Date | null;
}

export interface OfficePresencePolicyResult {
  status: SafeOfficePresenceStatus;
  label: string;
  source: OfficePresenceSource;
  consent: OfficePresenceConsent;
  isEnabled: boolean;
  isRealtime: boolean;
  requiresConsent: boolean;
  canRenderAsLive: boolean;
  reason: string;
}

const STATUS_LABELS: Record<SafeOfficePresenceStatus, string> = {
  unknown: "غير متاح",
  available: "متاح",
  busy: "مشغول",
  offline: "غير متاح",
};

function parseTime(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function minutesSince(value: string | Date | null | undefined, now: string | Date | null | undefined): number | null {
  const thenMs = parseTime(value);
  const nowMs = parseTime(now) ?? Date.now();
  if (thenMs === null) return null;
  return Math.max(0, Math.floor((nowMs - thenMs) / 60000));
}

export function resolveOfficePresencePolicy(input: OfficePresenceInput = {}): OfficePresencePolicyResult {
  const source = input.source ?? "none";
  const consent = input.consent ?? "not_requested";
  const requiresConsent = source !== "none";
  const isRealtime = source === "realtime";

  if (source === "none") {
    return {
      status: "unknown",
      label: STATUS_LABELS.unknown,
      source,
      consent,
      isEnabled: false,
      isRealtime: false,
      requiresConsent: false,
      canRenderAsLive: false,
      reason: "لا يوجد مصدر حضور مفعّل.",
    };
  }

  if (consent !== "granted") {
    return {
      status: "unknown",
      label: STATUS_LABELS.unknown,
      source,
      consent,
      isEnabled: false,
      isRealtime,
      requiresConsent,
      canRenderAsLive: false,
      reason: consent === "denied" ? "تم رفض مشاركة الحضور." : "يتطلب تفعيل الحضور موافقة صريحة.",
    };
  }

  if (source === "manual") {
    const manual = input.manualStatus && input.manualStatus !== "unknown" ? input.manualStatus : "offline";
    return {
      status: manual,
      label: STATUS_LABELS[manual],
      source,
      consent,
      isEnabled: true,
      isRealtime: false,
      requiresConsent,
      canRenderAsLive: false,
      reason: "حضور يدوي غير لحظي.",
    };
  }

  if (source === "activity") {
    const age = minutesSince(input.lastActivityAt, input.now);
    const status: SafeOfficePresenceStatus = age !== null && age <= 10 ? "available" : "offline";
    return {
      status,
      label: STATUS_LABELS[status],
      source,
      consent,
      isEnabled: true,
      isRealtime: false,
      requiresConsent,
      canRenderAsLive: false,
      reason: age === null ? "لا يوجد نشاط حديث موثوق." : `آخر نشاط قبل ${age} دقيقة.`,
    };
  }

  return {
    status: "unknown",
    label: STATUS_LABELS.unknown,
    source,
    consent,
    isEnabled: false,
    isRealtime: true,
    requiresConsent,
    canRenderAsLive: false,
    reason: "الحضور اللحظي محجوب حتى يتم تنفيذ قناة realtime مع الموافقات.",
  };
}

export function canShowPresenceAsLive(input: OfficePresenceInput = {}): boolean {
  return resolveOfficePresencePolicy(input).canRenderAsLive;
}
