export type TextMeetingRoomAudience = "owner" | "manager" | "employee";
export type TextMeetingRoomStatus = "ready" | "blocked" | "draft";
export type TextMeetingRoomBlockReason =
  | "unassigned_office"
  | "insufficient_role"
  | "approval_required"
  | "empty_team"
  | "live_media_requested"
  | "realtime_requested"
  | "external_invite_requested";

export interface TextMeetingRoomInput {
  officeNumber: number;
  officeName?: string | null;
  audience?: TextMeetingRoomAudience;
  isBoard?: boolean;
  isUnassigned?: boolean;
  hasApproval?: boolean;
  requiresApproval?: boolean;
  participantCount?: number | null;
  topic?: string | null;
  includesAudioVideo?: boolean;
  includesRealtime?: boolean;
  externalInviteRequested?: boolean;
}

export interface TextMeetingRoomResult {
  status: TextMeetingRoomStatus;
  title: string;
  roomLabel: string;
  topic: string;
  participantLabel: string;
  agenda: string[];
  actionLabel: string;
  canOpenTextRoom: boolean;
  canStartLiveRoom: boolean;
  requiresApproval: boolean;
  blockedReason: TextMeetingRoomBlockReason | null;
  safetyNote: string;
}

function officeLabel(officeNumber: number, officeName?: string | null): string {
  const number = Number.isFinite(officeNumber) ? Math.max(0, officeNumber) : 0;
  const base = `OFFICE ${String(number).padStart(2, "0")}`;
  const cleanName = officeName?.trim();
  return cleanName ? `${base} · ${cleanName}` : base;
}

function participantLabel(count: number | null | undefined): string {
  const safeCount = Number.isFinite(count) ? Math.max(0, Number(count)) : 0;
  if (safeCount === 0) return "لا يوجد مشاركون مرتبطون";
  if (safeCount === 1) return "مشارك واحد مرتبط";
  if (safeCount === 2) return "مشاركان مرتبطان";
  return `${safeCount} مشاركين مرتبطين`;
}

function blocked(
  input: TextMeetingRoomInput,
  reason: TextMeetingRoomBlockReason,
  title: string,
  detail: string,
  actionLabel: string,
): TextMeetingRoomResult {
  const topic = input.topic?.trim() || "تنسيق متابعة المكتب";

  return {
    status: "blocked",
    title,
    roomLabel: officeLabel(input.officeNumber, input.officeName),
    topic,
    participantLabel: participantLabel(input.participantCount),
    agenda: [detail],
    actionLabel,
    canOpenTextRoom: false,
    canStartLiveRoom: false,
    requiresApproval: true,
    blockedReason: reason,
    safetyNote: "الغرفة النصية لا تفتح صوتاً أو فيديو أو حضوراً لحظياً.",
  };
}

export function buildTextMeetingRoom(input: TextMeetingRoomInput): TextMeetingRoomResult {
  const audience = input.audience ?? "manager";
  const topic = input.topic?.trim() || "تنسيق متابعة المكتب";
  const count = Number.isFinite(input.participantCount) ? Math.max(0, Number(input.participantCount)) : 0;
  const requiresApproval = input.requiresApproval === true;
  const label = officeLabel(input.officeNumber, input.officeName);

  if (input.includesAudioVideo) {
    return blocked(input, "live_media_requested", "الغرفة المباشرة محظورة", "تم طلب صوت أو فيديو، وهذا خارج نطاق الغرفة النصية.", "إزالة الصوت والفيديو");
  }

  if (input.includesRealtime) {
    return blocked(input, "realtime_requested", "الحضور اللحظي محظور", "تم طلب realtime أو حضور لحظي قبل مرحلة الموافقة.", "إزالة realtime");
  }

  if (input.externalInviteRequested) {
    return blocked(input, "external_invite_requested", "الإرسال الخارجي محظور", "الغرفة النصية لا ترسل دعوات خارجية تلقائياً.", "استخدام ملاحظة داخلية");
  }

  if (input.isUnassigned) {
    return blocked(input, "unassigned_office", "المكتب غير مرتبط", `${label} يحتاج ربطاً قبل تجهيز غرفة نصية.`, "ربط المكتب");
  }

  if (audience === "employee") {
    return blocked(input, "insufficient_role", "صلاحية محدودة", "الموظف يستطيع عرض الحالة فقط ولا يفتح غرفة نصية.", "طلب صلاحية");
  }

  if (requiresApproval && input.hasApproval !== true) {
    return blocked(input, "approval_required", "اعتماد مطلوب", "الغرفة النصية تحتاج اعتماد المدير قبل فتحها.", "طلب الاعتماد");
  }

  if (!input.isBoard && count <= 0) {
    return blocked(input, "empty_team", "الفريق غير مرتبط", "لا توجد أسماء مرتبطة بهذا المكتب لتجهيز الغرفة النصية.", "ربط الفريق");
  }

  return {
    status: "ready",
    title: input.isBoard ? "غرفة مجلس الإدارة النصية" : "غرفة اجتماع نصية جاهزة",
    roomLabel: label,
    topic,
    participantLabel: participantLabel(count),
    agenda: [
      "تحديد موضوع المتابعة.",
      "تدوين القرارات داخل الغرفة النصية.",
      "تحديث المهام بعد انتهاء النقاش.",
    ],
    actionLabel: "فتح غرفة نصية",
    canOpenTextRoom: true,
    canStartLiveRoom: false,
    requiresApproval,
    blockedReason: null,
    safetyNote: "هذه غرفة نصية فقط ولا تتضمن صوتاً أو فيديو أو حضوراً لحظياً.",
  };
}

export function canOpenTextMeetingRoom(input: TextMeetingRoomInput): boolean {
  return buildTextMeetingRoom(input).canOpenTextRoom;
}
