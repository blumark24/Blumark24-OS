export type MeetingControlKey = "start_meeting" | "microphone" | "camera" | "screen_share" | "leave_meeting";
export type MeetingControlStatus = "blocked" | "preview" | "ready";

export interface MeetingControlsReadinessInput {
  livePresenceReady?: boolean;
  consentApproved?: boolean;
  tenantScopeReady?: boolean;
  officeScopeReady?: boolean;
  serverValidationReady?: boolean;
  rlsReady?: boolean;
  mediaPermissionPolicyReady?: boolean;
  stopControlReady?: boolean;
}

export interface MeetingControl {
  key: MeetingControlKey;
  label: string;
  detail: string;
  disabled: true;
  disabledReason: string;
}

export interface MeetingControlsReadiness {
  status: MeetingControlStatus;
  title: string;
  summary: string;
  actionLabel: string;
  readyCount: number;
  totalCount: number;
  missingCount: number;
  canShowDisabledControls: boolean;
  canEnableMeetingControls: boolean;
  controls: MeetingControl[];
  missingRequirements: string[];
}

const REQUIREMENTS: Array<{ key: keyof MeetingControlsReadinessInput; label: string }> = [
  { key: "livePresenceReady", label: "الحضور اللحظي" },
  { key: "consentApproved", label: "موافقة المستخدم" },
  { key: "tenantScopeReady", label: "نطاق المنشأة" },
  { key: "officeScopeReady", label: "نطاق المكتب" },
  { key: "serverValidationReady", label: "التحقق الخادمي" },
  { key: "rlsReady", label: "سياسات RLS" },
  { key: "mediaPermissionPolicyReady", label: "سياسة الكاميرا والمايك" },
  { key: "stopControlReady", label: "زر الإيقاف" },
];

const CONTROLS: Array<Omit<MeetingControl, "disabled" | "disabledReason">> = [
  {
    key: "start_meeting",
    label: "بدء اجتماع",
    detail: "يفتح الاجتماع بعد اكتمال بوابات الأمان فقط.",
  },
  {
    key: "microphone",
    label: "مايك",
    detail: "لا يطلب إذن الميكروفون في هذه المرحلة.",
  },
  {
    key: "camera",
    label: "كاميرا",
    detail: "لا يطلب إذن الكاميرا في هذه المرحلة.",
  },
  {
    key: "screen_share",
    label: "مشاركة شاشة",
    detail: "لا يتم فتح مشاركة الشاشة قبل اعتماد الاجتماعات.",
  },
  {
    key: "leave_meeting",
    label: "مغادرة",
    detail: "زر مستقبلي لإنهاء الجلسة بشكل واضح.",
  },
];

export function buildMeetingControlsReadiness(input: MeetingControlsReadinessInput = {}): MeetingControlsReadiness {
  const readyCount = REQUIREMENTS.filter((requirement) => Boolean(input[requirement.key])).length;
  const totalCount = REQUIREMENTS.length;
  const missingRequirements = REQUIREMENTS
    .filter((requirement) => !input[requirement.key])
    .map((requirement) => requirement.label);
  const missingCount = missingRequirements.length;
  const canEnableMeetingControls = missingCount === 0;
  const status: MeetingControlStatus = canEnableMeetingControls ? "ready" : readyCount > 0 ? "preview" : "blocked";
  const disabledReason = canEnableMeetingControls
    ? "الأزرار تبقى معطلة في مرحلة المعاينة حتى يبدأ تنفيذ WebRTC منفصل."
    : "بانتظار اكتمال بوابات الأمان والخصوصية.";

  return {
    status,
    title: canEnableMeetingControls ? "أزرار الاجتماع جاهزة للتنفيذ" : "أزرار الاجتماع غير مفعّلة",
    summary: canEnableMeetingControls
      ? "اكتملت بوابات الأمان، لكن هذه المرحلة لا تشغّل الصوت أو الفيديو."
      : `تبقى ${missingCount} متطلبات قبل تمكين اجتماعات الصوت والفيديو.`,
    actionLabel: canEnableMeetingControls ? "الانتقال إلى تنفيذ WebRTC" : "استكمال المتطلبات أولاً",
    readyCount,
    totalCount,
    missingCount,
    canShowDisabledControls: true,
    canEnableMeetingControls,
    controls: CONTROLS.map((control) => ({ ...control, disabled: true, disabledReason })),
    missingRequirements,
  };
}

export function canEnableMeetingControls(input: MeetingControlsReadinessInput = {}): boolean {
  return buildMeetingControlsReadiness(input).canEnableMeetingControls;
}
