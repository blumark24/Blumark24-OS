import { buildPresenceConsentPolicy, canActivatePresenceAfterConsent } from "../presenceConsentPolicy";

export function assertPresenceConsentPolicy(): boolean {
  const blocked = buildPresenceConsentPolicy({
    hasTenantScope: true,
    hasOfficeScope: true,
  });

  const preview = buildPresenceConsentPolicy({
    hasTenantScope: true,
    hasOfficeScope: true,
    hasManualStatus: true,
    canStopSharing: true,
    hasTimeout: true,
    noAudioVideo: true,
    noSilentTracking: true,
  });

  const approved = buildPresenceConsentPolicy({
    hasTenantScope: true,
    hasOfficeScope: true,
    hasManualStatus: true,
    canStopSharing: true,
    hasTimeout: true,
    noAudioVideo: true,
    noSilentTracking: true,
    userAccepted: true,
  });

  return (
    blocked.status === "blocked" &&
    blocked.canAskForConsent === false &&
    blocked.canActivateAfterConsent === false &&
    blocked.missingCount === 5 &&
    preview.status === "preview" &&
    preview.canAskForConsent === true &&
    preview.canActivateAfterConsent === false &&
    preview.accepted === false &&
    approved.status === "approved" &&
    approved.canAskForConsent === true &&
    approved.canActivateAfterConsent === true &&
    approved.accepted === true &&
    approved.items.every((item) => item.ready) &&
    canActivatePresenceAfterConsent({
      hasTenantScope: true,
      hasOfficeScope: true,
      hasManualStatus: true,
      canStopSharing: true,
      hasTimeout: true,
      noAudioVideo: true,
      noSilentTracking: true,
      userAccepted: true,
    }) === true &&
    canActivatePresenceAfterConsent({
      hasTenantScope: true,
      hasOfficeScope: true,
      userAccepted: true,
    }) === false
  );
}
