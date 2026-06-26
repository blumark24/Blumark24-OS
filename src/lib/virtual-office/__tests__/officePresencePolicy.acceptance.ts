import {
  canShowPresenceAsLive,
  resolveOfficePresencePolicy,
} from "../officePresencePolicy";

export function assertOfficePresencePolicy(): boolean {
  const disabled = resolveOfficePresencePolicy({ source: "none" });
  const pendingConsent = resolveOfficePresencePolicy({ source: "activity", consent: "not_requested" });
  const denied = resolveOfficePresencePolicy({ source: "manual", consent: "denied", manualStatus: "available" });
  const manual = resolveOfficePresencePolicy({ source: "manual", consent: "granted", manualStatus: "busy" });
  const active = resolveOfficePresencePolicy({
    source: "activity",
    consent: "granted",
    lastActivityAt: "2026-06-26T13:00:00.000Z",
    now: "2026-06-26T13:06:00.000Z",
  });
  const stale = resolveOfficePresencePolicy({
    source: "activity",
    consent: "granted",
    lastActivityAt: "2026-06-26T13:00:00.000Z",
    now: "2026-06-26T13:30:00.000Z",
  });
  const realtime = resolveOfficePresencePolicy({ source: "realtime", consent: "granted" });

  return (
    disabled.status === "unknown" &&
    disabled.isEnabled === false &&
    pendingConsent.requiresConsent === true &&
    pendingConsent.isEnabled === false &&
    denied.status === "unknown" &&
    manual.status === "busy" &&
    manual.canRenderAsLive === false &&
    active.status === "available" &&
    active.canRenderAsLive === false &&
    stale.status === "offline" &&
    realtime.isRealtime === true &&
    realtime.canRenderAsLive === false &&
    canShowPresenceAsLive({ source: "activity", consent: "granted" }) === false
  );
}
