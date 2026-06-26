import {
  isVirtualOfficeFutureActionDisabled,
  resolveVirtualOfficeActionState,
} from "../officeInteractionState";

export function assertVirtualOfficeInteractionStateBridge(): boolean {
  const linked = resolveVirtualOfficeActionState({ id: "office-01", isOpen: true }, "enter_office");
  const boardModal = resolveVirtualOfficeActionState({ id: "office-05", isCenter: true }, "open_modal");
  const boardEnter = resolveVirtualOfficeActionState({ id: "office-05", isCenter: true }, "enter_office");
  const unassignedModal = resolveVirtualOfficeActionState({ id: "office-09", isUnassigned: true }, "open_modal");
  const unassignedEnter = resolveVirtualOfficeActionState({ id: "office-09", isUnassigned: true }, "enter_office");
  const future = resolveVirtualOfficeActionState({ id: "office-01" }, "future_action");

  return (
    linked.disabled === false &&
    linked.canEnterFullscreen === true &&
    boardModal.disabled === false &&
    boardModal.canOpenModal === true &&
    boardEnter.disabled === true &&
    boardEnter.reason === "board" &&
    unassignedModal.disabled === false &&
    unassignedModal.canOpenModal === true &&
    unassignedEnter.disabled === true &&
    unassignedEnter.reason === "unassigned" &&
    future.disabled === true &&
    future.motionState === "disabled" &&
    isVirtualOfficeFutureActionDisabled("future_action") === true
  );
}
