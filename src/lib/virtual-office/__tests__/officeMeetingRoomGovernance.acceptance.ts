import {
  canPrepareTextMeetingRoom,
  resolveMeetingRoomGovernance,
} from "../officeMeetingRoomGovernance";

export function assertOfficeMeetingRoomGovernance(): boolean {
  const unassigned = resolveMeetingRoomGovernance({
    officeNumber: 9,
    isUnassigned: true,
  });

  const employee = resolveMeetingRoomGovernance({
    officeNumber: 1,
    audience: "employee",
    mode: "text_only",
    hasLinkedTeam: true,
  });

  const inactive = resolveMeetingRoomGovernance({
    officeNumber: 2,
    audience: "manager",
    mode: "inactive",
    hasLinkedTeam: true,
  });

  const approval = resolveMeetingRoomGovernance({
    officeNumber: 3,
    audience: "manager",
    mode: "approval_required",
    hasApproval: false,
    hasLinkedTeam: true,
  });

  const ready = resolveMeetingRoomGovernance({
    officeNumber: 4,
    audience: "manager",
    mode: "text_only",
    hasLinkedTeam: true,
  });

  const board = resolveMeetingRoomGovernance({
    officeNumber: 5,
    isBoard: true,
    audience: "owner",
    mode: "text_only",
    hasLinkedTeam: false,
  });

  return (
    unassigned.status === "locked" &&
    unassigned.canPrepareTextRoom === false &&
    employee.status === "limited" &&
    employee.canPrepareTextRoom === false &&
    inactive.status === "limited" &&
    approval.requiresApproval === true &&
    approval.canPrepareTextRoom === false &&
    ready.status === "available" &&
    ready.canPrepareTextRoom === true &&
    ready.canStartLiveRoom === false &&
    board.status === "available" &&
    canPrepareTextMeetingRoom({ officeNumber: 6, mode: "text_only", hasLinkedTeam: true }) === true
  );
}
