export type LivePresenceReadinessStatus = "blocked" | "partial" | "ready";

export type LivePresenceRequirementKey =
  | "tenant_isolation"
  | "explicit_consent"
  | "manual_status"
  | "idle_timeout"
  | "stop_control"
  | "rls_policy"
  | "privacy_notice"
  | "server_validation"
  | "no_silent_tracking";

export interface LivePresenceReadinessInput {
  tenantIsolationReady?: boolean;
  explicitConsentReady?: boolean;
  manualStatusReady?: boolean;
  idleTimeoutReady?: boolean;
  stopControlReady?: boolean;
  rlsPolicyReady?: boolean;
  privacyNoticeReady?: boolean;
  serverValidationReady?: boolean;
  noSilentTrackingReady?: boolean;
}

export interface LivePresenceRequirement {
  key: LivePresenceRequirementKey;
  label: string;
  detail: string;
  ready: boolean;
}

export interface LivePresenceReadiness {
  status: LivePresenceReadinessStatus;
  title: string;
  summary: string;
  actionLabel: string;
  completedCount: number;
  totalCount: number;
  missingCount: number;
  canEnableLivePresence: boolean;
  requirements: LivePresenceRequirement[];
}

const REQUIREMENT_DEFS: Array<Omit<LivePresenceRequirement, "ready"> & { inputKey: keyof LivePresenceReadinessInput }> = [
  {
    key: "tenant_isolation",
    inputKey: "tenantIsolationReady",
    label: "عزل المنشأة",
    detail: "كل قناة حضور يجب أن تكون محدودة داخل منشأة ومكتب محدد.",
  },
  {
    key: "explicit_consent",
    inputKey: "explicitConsentReady",
    label: "موافقة واضحة",
    detail: "لا يتم تفعيل الحضور إلا بعد موافقة المستخدم على مشاركة حالته.",
  },
  {
    key: "manual_status",
    inputKey: "manualStatusReady",
    label: "حالة يدوية",
    detail: "المستخدم يستطيع اختيار حالته بنفسه ولا تظهر حالة افتراضية مضللة.",
  },
  {
    key: "idle_timeout",
    inputKey: "idleTimeoutReady",
    label: "انتهاء تلقائي",
    detail: "الحضور ينتهي تلقائياً عند الخمول أو إغلاق الجلسة.",
  },
  {
    key: "stop_control",
    inputKey: "stopControlReady",
    label: "زر إيقاف",
    detail: "يوجد تحكم واضح لإيقاف مشاركة الحضور فوراً.",
  },
  {
    key: "rls_policy",
    inputKey: "rlsPolicyReady",
    label: "سياسات RLS",
    detail: "العزل والصلاحيات يجب أن تكون مؤكدة قبل أي قناة لحظية.",
  },
  {
    key: "privacy_notice",
    inputKey: "privacyNoticeReady",
    label: "تنبيه خصوصية",
    detail: "واجهة الحضور توضّح ماذا تتم مشاركته ومتى يتوقف.",
  },
  {
    key: "server_validation",
    inputKey: "serverValidationReady",
    label: "تحقق خادمي",
    detail: "لا يعتمد التفعيل على الواجهة فقط؛ يجب التحقق من الخادم.",
  },
  {
    key: "no_silent_tracking",
    inputKey: "noSilentTrackingReady",
    label: "منع التتبع الصامت",
    detail: "لا يتم إرسال أو تتبع حالة المستخدم بدون فعل أو موافقة واضحة.",
  },
];

export function buildLivePresenceReadiness(input: LivePresenceReadinessInput = {}): LivePresenceReadiness {
  const requirements = REQUIREMENT_DEFS.map(({ inputKey, ...requirement }) => ({
    ...requirement,
    ready: Boolean(input[inputKey]),
  }));

  const completedCount = requirements.filter((requirement) => requirement.ready).length;
  const totalCount = requirements.length;
  const missingCount = totalCount - completedCount;
  const canEnableLivePresence = missingCount === 0;
  const status: LivePresenceReadinessStatus = canEnableLivePresence
    ? "ready"
    : completedCount >= Math.ceil(totalCount / 2)
      ? "partial"
      : "blocked";

  return {
    status,
    title: canEnableLivePresence ? "الحضور اللحظي جاهز للتفعيل" : "الحضور اللحظي غير مفعّل",
    summary: canEnableLivePresence
      ? "كل بوابات الأمان مكتملة ويمكن الانتقال إلى تنفيذ الحضور اللحظي."
      : `تبقى ${missingCount} متطلبات قبل تفعيل الحضور اللحظي.`,
    actionLabel: canEnableLivePresence ? "بدء مرحلة التنفيذ" : "استكمال بوابات الأمان",
    completedCount,
    totalCount,
    missingCount,
    canEnableLivePresence,
    requirements,
  };
}

export function canEnableLivePresence(input: LivePresenceReadinessInput = {}): boolean {
  return buildLivePresenceReadiness(input).canEnableLivePresence;
}
