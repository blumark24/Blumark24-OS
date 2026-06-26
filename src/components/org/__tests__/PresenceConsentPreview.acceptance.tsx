import PresenceConsentPreview from "../PresenceConsentPreview";
import { buildPresenceConsentPolicy } from "@/lib/virtual-office/presenceConsentPolicy";

export function assertPresenceConsentPreviewComponent(): boolean {
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

  return (
    typeof PresenceConsentPreview === "function" &&
    blocked.status === "blocked" &&
    preview.status === "preview" &&
    preview.canAskForConsent === true &&
    preview.canActivateAfterConsent === false
  );
}
