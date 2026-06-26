export type MeetingRoomGovernanceMode = "inactive" | "text_only" | "approval_required";
export type MeetingRoomGovernanceAudience = "owner" | "manager" | "employee";
export type MeetingRoomGovernanceStatus = "available" | "limited" | "locked";

export interface MeetingRoomGovernanceInput {
  officeNumber: number;
  officeName?: string | null;
  audience?: MeetingRoomGovernanceAudience;
  isBoard?: boolean;
  isUnassigned?: boolean;
  mode?: MeetingRoomGovernanceMode;
  hasApproval?: boolean;
  hasLinkedTeam?: boolean;
}

export interface MeetingRoomGovernanceResult {
  status: MeetingRoomGovernanceStatus;
  title: string;
  detail: string;
  actionLabel: string;
  canPrepareTextRoom: boolean;
  canStartLiveRoom: boolean;
  requiresApproval: boolean;
}

function labelForOffice(officeNumber: number, officeName?: string | null): string {
  const numberLabel = `OFFICE ${String(Math.max(0, officeNumber)).padStart(2, "0")}`;
  const name = officeName?.trim();
  return name ? `${numberLabel} · ${name}` : numberLabel;
}

export function resolveMeetingRoomGovernance(
  input: MeetingRoomGovernanceInput,
): MeetingRoomGovernanceResult {
  const office = labelForOffice(input.officeNumber, input.officeName);
  const audience = input.audience ?? "owner";
  const mode = input.mode ?? "inactive";

  if (input.isUnassigned) {
    return {
      status: "locked",
      title: "غرفة غير مفعلة",
      detail: `${office} يحتاج الربط قبل تجهيز غرفة اجتماع.`,
      actionLabel: "ربط المكتب",
      canPrepareTextRoom: false,
      canStartLiveRoom: false,
      requiresApproval: true,
    };
  }

  if (audience === "employee") {
    return {
      status: "limited",
      title: "غرفة محدودة",
      detail: `${office} يسمح للموظف بعرض حالة الغرفة فقط دون تجهيز دعوات.`,
      actionLabel: "عرض الحالة",
      canPrepareTextRoom: false,
      canStartLiveRoom: false,
      requiresApproval: true,
    };
  }

  if (mode === "inactive") {
    return {
      status: "limited",
      title: "غرفة جاهزة لاحقاً",
      detail: `${office} جاهز لمرحلة الغرف النصية بعد اعتماد الصلاحيات.`,
      actionLabel: "مراجعة الصلاحيات",
      canPrepareTextRoom: false,
      canStartLiveRoom: false,
      requiresApproval: true,
    };
  }

  if (mode === "approval_required" && input.hasApproval !== true) {
    return {
      status: "limited",
      title: "تتطلب اعتماداً",
      detail: `${office} يحتاج اعتماد المدير قبل تجهيز غرفة اجتماع نصية.`,
      actionLabel: "طلب الاعتماد",
      canPrepareTextRoom: false,
      canStartLiveRoom: false,
      requiresApproval: true,
    };
  }

  if (input.hasLinkedTeam === false && !input.isBoard) {
    return {
      status: "limited",
      title: "فريق غير مرتبط",
      detail: `${office} يحتاج فريقاً مرتبطاً قبل تجهيز غرفة نصية.`,
      actionLabel: "مراجعة الربط",
      canPrepareTextRoom: false,
      canStartLiveRoom: false,
      requiresApproval: mode === "approval_required",
    };
  }

  return {
    status: "available",
    title: input.isBoard ? "غرفة مجلس الإدارة" : "غرفة اجتماع نصية",
    detail: `${office} جاهز لتجهيز غرفة اجتماع نصية فقط دون بث أو حضور لحظي.`,
    actionLabel: "تجهيز غرفة نصية",
    canPrepareTextRoom: true,
    canStartLiveRoom: false,
    requiresApproval: mode === "approval_required",
  };
}

export function canPrepareTextMeetingRoom(input: MeetingRoomGovernanceInput): boolean {
  return resolveMeetingRoomGovernance(input).canPrepareTextRoom;
}
