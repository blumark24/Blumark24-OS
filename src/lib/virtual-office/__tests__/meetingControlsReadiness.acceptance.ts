import { buildMeetingControlsReadiness, canEnableMeetingControls } from "../meetingControlsReadiness";

export function assertMeetingControlsReadiness(): boolean {
  const blocked = buildMeetingControlsReadiness();

  const preview = buildMeetingControlsReadiness({
    livePresenceReady: true,
    consentApproved: true,
    tenantScopeReady: true,
  });

  const readyInput = {
    livePresenceReady: true,
    consentApproved: true,
    tenantScopeReady: true,
    officeScopeReady: true,
    serverValidationReady: true,
    rlsReady: true,
    mediaPermissionPolicyReady: true,
    stopControlReady: true,
  };
  const ready = buildMeetingControlsReadiness(readyInput);

  return (
    blocked.status === "blocked" &&
    blocked.canShowDisabledControls === true &&
    blocked.canEnableMeetingControls === false &&
    blocked.controls.length === 5 &&
    blocked.controls.every((control) => control.disabled === true) &&
    preview.status === "preview" &&
    preview.readyCount === 3 &&
    preview.canEnableMeetingControls === false &&
    preview.missingRequirements.includes("نطاق المكتب") &&
    ready.status === "ready" &&
    ready.canEnableMeetingControls === true &&
    ready.missingCount === 0 &&
    ready.controls.every((control) => control.disabled === true) &&
    ready.controls.some((control) => control.key === "microphone" && control.label === "مايك") &&
    canEnableMeetingControls(readyInput) === true &&
    canEnableMeetingControls({ livePresenceReady: true }) === false
  );
}
