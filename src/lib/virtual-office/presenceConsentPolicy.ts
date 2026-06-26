export type PresenceConsentPolicyStatus = "blocked" | "preview" | "approved";

export type PresenceConsentItemKey =
  | "shared_status"
  | "shared_room"
  | "manual_control"
  | "stop_anytime"
  | "timeout"
  | "no_audio_video"
  | "no_silent_tracking";

export interface PresenceConsentPolicyInput {
  hasTenantScope?: boolean;
  hasOfficeScope?: boolean;
  hasManualStatus?: boolean;
  canStopSharing?: boolean;
  hasTimeout?: boolean;
  noAudioVideo?: boolean;
  noSilentTracking?: boolean;
  userAccepted?: boolean;
}

export interface PresenceConsentItem {
  key: PresenceConsentItemKey;
  label: string;
  detail: string;
  ready: boolean;
}

export interface PresenceConsentPolicy {
  status: PresenceConsentPolicyStatus;
  title: string;
  summary: string;
  actionLabel: string;
  canAskForConsent: boolean;
  canActivateAfterConsent: boolean;
  accepted: boolean;
  readyCount: number;
  totalCount: number;
  missingCount: number;
  items: PresenceConsentItem[];
}

const ITEM_DEFS: Array<Omit<PresenceConsentItem, "ready"> & { inputKey: keyof PresenceConsentPolicyInput }> = [
  {
    key: "shared_status",
    inputKey: "hasTenantScope",
    label: "حالة الحضور",
    detail: "تتم مشاركة حالة يدوية داخل منشأة محددة فقط.",
  },
  {
    key: "shared_room",
    inputKey: "hasOfficeScope",
    label: "نطاق المكتب",
    detail: "الحضور يظهر داخل المكتب المرتبط فقط وليس على مستوى عام.",
  },
  {
    key: "manual_control",
    inputKey: "hasManualStatus",
    label: "تحكم يدوي",
    detail: "المستخدم يحدد حالته بنفسه قبل أي مشاركة.",
  },
  {
    key: "stop_anytime",
    inputKey: "canStopSharing",
    label: "إيقاف المشاركة",
    detail: "يمكن إيقاف مشاركة الحضور في أي وقت.",
  },
  {
    key: "timeout",
    inputKey: "hasTimeout",
    label: "انتهاء تلقائي",
    detail: "تنتهي مشاركة الحضور تلقائياً بعد مدة محددة أو خمول.",
  },
  {
    key: "no_audio_video",
    inputKey: "noAudioVideo",
    label: "لا صوت ولا فيديو",
    detail: "الحضور لا يعني تشغيل كاميرا أو مايك.",
  },
  {
    key: "no_silent_tracking",
    inputKey: "noSilentTracking",
    label: "منع التتبع الصامت",
    detail: "لا تتم مشاركة أي حالة بدون فعل واضح من المستخدم.",
  },
];

export function buildPresenceConsentPolicy(input: PresenceConsentPolicyInput = {}): PresenceConsentPolicy {
  const items = ITEM_DEFS.map(({ inputKey, ...item }) => ({
    ...item,
    ready: Boolean(input[inputKey]),
  }));
  const readyCount = items.filter((item) => item.ready).length;
  const totalCount = items.length;
  const missingCount = totalCount - readyCount;
  const canAskForConsent = missingCount === 0;
  const accepted = Boolean(input.userAccepted);
  const canActivateAfterConsent = canAskForConsent && accepted;
  const status: PresenceConsentPolicyStatus = canActivateAfterConsent ? "approved" : canAskForConsent ? "preview" : "blocked";

  return {
    status,
    title: canActivateAfterConsent
      ? "موافقة الحضور جاهزة"
      : canAskForConsent
        ? "معاينة موافقة الحضور"
        : "موافقة الحضور غير جاهزة",
    summary: canActivateAfterConsent
      ? "تمت الموافقة ويمكن الانتقال إلى بوابة التنفيذ التالية."
      : canAskForConsent
        ? "يمكن عرض نص الموافقة للمستخدم، لكن التفعيل ما زال متوقفاً حتى يعتمدها."
        : `تبقى ${missingCount} نقاط خصوصية قبل طلب موافقة المستخدم.`,
    actionLabel: canActivateAfterConsent ? "الانتقال للتنفيذ" : canAskForConsent ? "طلب الموافقة لاحقاً" : "استكمال الخصوصية",
    canAskForConsent,
    canActivateAfterConsent,
    accepted,
    readyCount,
    totalCount,
    missingCount,
    items,
  };
}

export function canActivatePresenceAfterConsent(input: PresenceConsentPolicyInput = {}): boolean {
  return buildPresenceConsentPolicy(input).canActivateAfterConsent;
}
