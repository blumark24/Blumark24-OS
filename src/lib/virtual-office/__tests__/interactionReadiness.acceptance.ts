import {
  canEnableInteraction,
  getInteractionCapability,
  isAudioVideoInteractionBlocked,
  requiresExplicitConsent,
} from "../interactionReadiness";

export function assertVirtualOfficeInteractionReadiness(): boolean {
  const micro = getInteractionCapability("micro_interactions");
  const invites = getInteractionCapability("meeting_invites");
  const live = getInteractionCapability("live_meetings");

  return (
    canEnableInteraction("micro_interactions") === true &&
    micro.requiresAudioVideo === false &&
    invites.enabled === false &&
    requiresExplicitConsent("meeting_invites") === true &&
    live.enabled === false &&
    requiresExplicitConsent("live_meetings") === true &&
    isAudioVideoInteractionBlocked("live_meetings") === true
  );
}
