import { buildLivePresenceReadiness, canEnableLivePresence } from "../livePresenceReadiness";

export function assertLivePresenceReadiness(): boolean {
  const blocked = buildLivePresenceReadiness();

  const partial = buildLivePresenceReadiness({
    tenantIsolationReady: true,
    explicitConsentReady: true,
    manualStatusReady: true,
    idleTimeoutReady: true,
    stopControlReady: true,
  });

  const readyInput = {
    tenantIsolationReady: true,
    explicitConsentReady: true,
    manualStatusReady: true,
    idleTimeoutReady: true,
    stopControlReady: true,
    rlsPolicyReady: true,
    privacyNoticeReady: true,
    serverValidationReady: true,
    noSilentTrackingReady: true,
  };
  const ready = buildLivePresenceReadiness(readyInput);

  return (
    blocked.status === "blocked" &&
    blocked.canEnableLivePresence === false &&
    blocked.completedCount === 0 &&
    blocked.missingCount === blocked.totalCount &&
    blocked.requirements.some((requirement) => requirement.key === "explicit_consent" && !requirement.ready) &&
    partial.status === "partial" &&
    partial.canEnableLivePresence === false &&
    partial.completedCount === 5 &&
    partial.missingCount === 4 &&
    ready.status === "ready" &&
    ready.canEnableLivePresence === true &&
    ready.missingCount === 0 &&
    ready.requirements.every((requirement) => requirement.ready) &&
    canEnableLivePresence(readyInput) === true &&
    canEnableLivePresence({ tenantIsolationReady: true }) === false
  );
}
