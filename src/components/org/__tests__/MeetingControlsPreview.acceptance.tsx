import MeetingControlsPreview from "../MeetingControlsPreview";
import { buildMeetingControlsReadiness } from "@/lib/virtual-office/meetingControlsReadiness";

export function assertMeetingControlsPreviewComponent(): boolean {
  const blocked = buildMeetingControlsReadiness();

  const ready = buildMeetingControlsReadiness({
    livePresenceReady: true,
    consentApproved: true,
    tenantScopeReady: true,
    officeScopeReady: true,
    serverValidationReady: true,
    rlsReady: true,
    mediaPermissionPolicyReady: true,
    stopControlReady: true,
  });

  return (
    typeof MeetingControlsPreview === "function" &&
    blocked.status === "blocked" &&
    blocked.controls.every((control) => control.disabled === true) &&
    ready.status === "ready" &&
    ready.canEnableMeetingControls === true &&
    ready.controls.every((control) => control.disabled === true)
  );
}
