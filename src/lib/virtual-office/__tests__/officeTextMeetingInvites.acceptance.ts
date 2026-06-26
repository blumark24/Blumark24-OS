import {
  buildOfficeTextMeetingInvite,
  isOfficeTextMeetingInviteSafe,
} from "../officeTextMeetingInvites";

export function assertOfficeTextMeetingInvites(): boolean {
  const internal = buildOfficeTextMeetingInvite({
    officeNumber: 1,
    officeName: "المبيعات",
    requesterName: "مدير التشغيل",
    participantCount: 3,
    topic: "متابعة العملاء",
    channel: "internal_note",
  });

  const blockedMedia = buildOfficeTextMeetingInvite({
    officeNumber: 2,
    includesAudioVideo: true,
  });

  const blockedRealtime = buildOfficeTextMeetingInvite({
    officeNumber: 3,
    includesRealtime: true,
  });

  const blockedConsent = buildOfficeTextMeetingInvite({
    officeNumber: 4,
    channel: "whatsapp",
    hasConsent: false,
  });

  const approvedExternal = buildOfficeTextMeetingInvite({
    officeNumber: 5,
    channel: "email",
    hasConsent: true,
  });

  return (
    internal.status === "ready" &&
    internal.includesAudioVideo === false &&
    internal.includesRealtime === false &&
    internal.requiresConsent === false &&
    blockedMedia.status === "blocked" &&
    blockedMedia.blockedReason === "audio_video_or_realtime_blocked" &&
    blockedRealtime.status === "blocked" &&
    blockedRealtime.blockedReason === "audio_video_or_realtime_blocked" &&
    blockedConsent.status === "blocked" &&
    blockedConsent.blockedReason === "consent_required" &&
    approvedExternal.status === "ready" &&
    approvedExternal.requiresConsent === true &&
    isOfficeTextMeetingInviteSafe({ officeNumber: 6, channel: "internal_note" }) === true &&
    isOfficeTextMeetingInviteSafe({ officeNumber: 7, includesAudioVideo: true }) === false
  );
}
