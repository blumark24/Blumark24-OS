export type OfficeTextMeetingInviteStatus = "draft" | "ready" | "blocked";
export type OfficeTextMeetingInviteChannel = "internal_note" | "email" | "whatsapp";

export interface OfficeTextMeetingInviteInput {
  officeNumber: number;
  officeName?: string | null;
  requesterName?: string | null;
  participantCount?: number | null;
  topic?: string | null;
  channel?: OfficeTextMeetingInviteChannel;
  hasConsent?: boolean;
  includesAudioVideo?: boolean;
  includesRealtime?: boolean;
}

export interface OfficeTextMeetingInviteDraft {
  status: OfficeTextMeetingInviteStatus;
  channel: OfficeTextMeetingInviteChannel;
  title: string;
  body: string;
  actionLabel: string;
  blockedReason: string | null;
  requiresConsent: boolean;
  includesAudioVideo: boolean;
  includesRealtime: boolean;
}

function safeText(value: string | null | undefined, fallback: string): string {
  const cleaned = value?.trim();
  return cleaned ? cleaned : fallback;
}

function safeCount(value: number | null | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function officeLabel(officeNumber: number, officeName?: string | null): string {
  const numberLabel = `OFFICE ${String(Math.max(0, officeNumber)).padStart(2, "0")}`;
  const name = officeName?.trim();
  return name ? `${numberLabel} · ${name}` : numberLabel;
}

export function buildOfficeTextMeetingInvite(
  input: OfficeTextMeetingInviteInput,
): OfficeTextMeetingInviteDraft {
  const channel = input.channel ?? "internal_note";
  const includesAudioVideo = input.includesAudioVideo === true;
  const includesRealtime = input.includesRealtime === true;
  const requiresConsent = channel !== "internal_note" || includesAudioVideo || includesRealtime;

  if (includesAudioVideo || includesRealtime) {
    return {
      status: "blocked",
      channel,
      title: "دعوة محجوبة",
      body: "دعوات هذا الإصدار نصية فقط ولا تتضمن صوتاً أو فيديو أو حضوراً لحظياً.",
      actionLabel: "استخدام دعوة نصية",
      blockedReason: "audio_video_or_realtime_blocked",
      requiresConsent,
      includesAudioVideo,
      includesRealtime,
    };
  }

  if (requiresConsent && input.hasConsent !== true) {
    return {
      status: "blocked",
      channel,
      title: "تتطلب موافقة",
      body: "إرسال الدعوات خارج النظام يتطلب موافقة صريحة قبل المتابعة.",
      actionLabel: "طلب الموافقة",
      blockedReason: "consent_required",
      requiresConsent,
      includesAudioVideo: false,
      includesRealtime: false,
    };
  }

  const office = officeLabel(input.officeNumber, input.officeName);
  const requester = safeText(input.requesterName, "فريق التشغيل");
  const topic = safeText(input.topic, "متابعة تشغيل المكتب");
  const count = safeCount(input.participantCount);
  const participantsText = count > 0 ? `${count} مشاركين` : "المشاركون غير محددين";

  return {
    status: "ready",
    channel,
    title: `دعوة نصية · ${office}`,
    body: `${requester} يدعوكم إلى تنسيق اجتماع نصي حول: ${topic}. المكتب: ${office}. ${participantsText}. هذه دعوة نصية فقط ولا تتضمن صوتاً أو فيديو أو حضوراً لحظياً.`,
    actionLabel: "تجهيز الدعوة النصية",
    blockedReason: null,
    requiresConsent,
    includesAudioVideo: false,
    includesRealtime: false,
  };
}

export function isOfficeTextMeetingInviteSafe(input: OfficeTextMeetingInviteInput): boolean {
  return buildOfficeTextMeetingInvite(input).status === "ready";
}
