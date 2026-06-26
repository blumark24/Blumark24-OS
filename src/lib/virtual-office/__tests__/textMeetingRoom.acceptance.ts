import {
  buildTextMeetingRoom,
  canOpenTextMeetingRoom,
} from "../textMeetingRoom";

export function assertTextMeetingRoom(): boolean {
  const unassigned = buildTextMeetingRoom({
    officeNumber: 9,
    isUnassigned: true,
    participantCount: 2,
  });

  const employee = buildTextMeetingRoom({
    officeNumber: 1,
    audience: "employee",
    participantCount: 2,
  });

  const approval = buildTextMeetingRoom({
    officeNumber: 2,
    audience: "manager",
    requiresApproval: true,
    hasApproval: false,
    participantCount: 2,
  });

  const emptyTeam = buildTextMeetingRoom({
    officeNumber: 3,
    audience: "manager",
    participantCount: 0,
  });

  const liveMedia = buildTextMeetingRoom({
    officeNumber: 4,
    audience: "manager",
    participantCount: 3,
    includesAudioVideo: true,
  });

  const realtime = buildTextMeetingRoom({
    officeNumber: 5,
    isBoard: true,
    audience: "owner",
    includesRealtime: true,
  });

  const ready = buildTextMeetingRoom({
    officeNumber: 6,
    audience: "manager",
    participantCount: 3,
    topic: "متابعة إنجازات المكتب",
  });

  const board = buildTextMeetingRoom({
    officeNumber: 5,
    isBoard: true,
    audience: "owner",
    participantCount: 0,
  });

  return (
    unassigned.status === "blocked" &&
    unassigned.blockedReason === "unassigned_office" &&
    employee.blockedReason === "insufficient_role" &&
    approval.blockedReason === "approval_required" &&
    emptyTeam.blockedReason === "empty_team" &&
    liveMedia.blockedReason === "live_media_requested" &&
    realtime.blockedReason === "realtime_requested" &&
    ready.status === "ready" &&
    ready.canOpenTextRoom === true &&
    ready.canStartLiveRoom === false &&
    ready.safetyNote.includes("نصية فقط") &&
    board.status === "ready" &&
    canOpenTextMeetingRoom({ officeNumber: 7, audience: "manager", participantCount: 2 }) === true &&
    canOpenTextMeetingRoom({ officeNumber: 8, audience: "employee", participantCount: 2 }) === false
  );
}
