import type { VirtualOfficeMotionState } from "./interactionMotion";

export type VirtualOfficeActionKind = "open_modal" | "enter_office" | "future_action";

export type VirtualOfficeInteractionReason =
  | "ready"
  | "board"
  | "unassigned"
  | "closed"
  | "demo"
  | "future_disabled";

export interface VirtualOfficeInteractableRoom {
  id?: string | null;
  officeNumber?: number | null;
  fixedRoomKey?: string | null;
  isCenter?: boolean | null;
  isDemo?: boolean | null;
  isUnassigned?: boolean | null;
  isOpen?: boolean | null;
}

export interface VirtualOfficeActionState {
  action: VirtualOfficeActionKind;
  disabled: boolean;
  reason: VirtualOfficeInteractionReason;
  label: string;
  motionState: VirtualOfficeMotionState;
  canOpenModal: boolean;
  canEnterFullscreen: boolean;
}

const LABEL_BY_REASON: Record<VirtualOfficeInteractionReason, string> = {
  ready: "جاهز",
  board: "مجلس الإدارة",
  unassigned: "جاهز بعد الربط",
  closed: "المكتب مغلق",
  demo: "غير مفعل تشغيلياً",
  future_disabled: "قريباً",
};

export function resolveVirtualOfficeActionState(
  room: VirtualOfficeInteractableRoom,
  action: VirtualOfficeActionKind = "open_modal",
): VirtualOfficeActionState {
  const isBoard = room.isCenter === true;
  const isDemo = room.isDemo === true;
  const isUnassigned = room.isUnassigned === true;
  const isClosed = room.isOpen === false;

  if (action === "future_action") {
    return toActionState(action, true, "future_disabled");
  }

  if (action === "open_modal") {
    if (isBoard) return toActionState(action, false, "board");
    if (isUnassigned) return toActionState(action, false, "unassigned");
    if (isDemo) return toActionState(action, false, "demo");
    if (isClosed) return toActionState(action, false, "closed");
    return toActionState(action, false, "ready");
  }

  if (isBoard) return toActionState(action, true, "board");
  if (isUnassigned) return toActionState(action, true, "unassigned");
  if (isDemo) return toActionState(action, true, "demo");
  if (isClosed) return toActionState(action, true, "closed");

  return toActionState(action, false, "ready");
}

function toActionState(
  action: VirtualOfficeActionKind,
  disabled: boolean,
  reason: VirtualOfficeInteractionReason,
): VirtualOfficeActionState {
  const canOpenModal = action === "open_modal" && !disabled;
  const canEnterFullscreen = action === "enter_office" && !disabled;

  return {
    action,
    disabled,
    reason,
    label: LABEL_BY_REASON[reason],
    motionState: disabled ? "disabled" : "idle",
    canOpenModal,
    canEnterFullscreen,
  };
}

export function isVirtualOfficeFutureActionDisabled(action: VirtualOfficeActionKind): boolean {
  return action === "future_action";
}
