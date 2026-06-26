export type VirtualOfficeInteractionPhase =
  | "foundation"
  | "micro_interactions"
  | "smart_suggestions"
  | "presence"
  | "meeting_invites"
  | "live_meetings";

export interface VirtualOfficeInteractionCapability {
  key: VirtualOfficeInteractionPhase;
  enabled: boolean;
  requiresConsent: boolean;
  requiresRealtime: boolean;
  requiresAudioVideo: boolean;
  label: string;
  nextStep: string;
}

export const VIRTUAL_OFFICE_INTERACTION_CAPABILITIES: readonly VirtualOfficeInteractionCapability[] = [
  {
    key: "foundation",
    enabled: true,
    requiresConsent: false,
    requiresRealtime: false,
    requiresAudioVideo: false,
    label: "الربط التشغيلي",
    nextStep: "مكتمل",
  },
  {
    key: "micro_interactions",
    enabled: true,
    requiresConsent: false,
    requiresRealtime: false,
    requiresAudioVideo: false,
    label: "مؤثرات خفيفة",
    nextStep: "تفعيل تدريجي بدون تغيير الخريطة أو الإحداثيات",
  },
  {
    key: "smart_suggestions",
    enabled: false,
    requiresConsent: false,
    requiresRealtime: false,
    requiresAudioVideo: false,
    label: "اقتراحات ذكية",
    nextStep: "بعد تثبيت تجربة المؤثرات",
  },
  {
    key: "presence",
    enabled: false,
    requiresConsent: true,
    requiresRealtime: true,
    requiresAudioVideo: false,
    label: "حضور حقيقي",
    nextStep: "بعد تحديد سياسة الحضور والخصوصية",
  },
  {
    key: "meeting_invites",
    enabled: false,
    requiresConsent: true,
    requiresRealtime: false,
    requiresAudioVideo: false,
    label: "دعوات اجتماعات",
    nextStep: "بعد جاهزية الحضور الأساسي",
  },
  {
    key: "live_meetings",
    enabled: false,
    requiresConsent: true,
    requiresRealtime: true,
    requiresAudioVideo: true,
    label: "اجتماعات صوت وفيديو",
    nextStep: "مرحلة لاحقة فقط بعد الموافقة والإشعار الواضح",
  },
] as const;

export function getInteractionCapability(key: VirtualOfficeInteractionPhase): VirtualOfficeInteractionCapability {
  return VIRTUAL_OFFICE_INTERACTION_CAPABILITIES.find((item) => item.key === key) ?? VIRTUAL_OFFICE_INTERACTION_CAPABILITIES[0];
}

export function canEnableInteraction(key: VirtualOfficeInteractionPhase): boolean {
  return getInteractionCapability(key).enabled;
}

export function requiresExplicitConsent(key: VirtualOfficeInteractionPhase): boolean {
  return getInteractionCapability(key).requiresConsent;
}

export function isAudioVideoInteractionBlocked(key: VirtualOfficeInteractionPhase): boolean {
  return getInteractionCapability(key).requiresAudioVideo && !getInteractionCapability(key).enabled;
}
