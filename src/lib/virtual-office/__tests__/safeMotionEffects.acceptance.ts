import {
  canUseSafeMotionEffect,
  resolveSafeMotionEffect,
} from "../safeMotionEffects";

export function assertSafeMotionEffects(): boolean {
  const reduced = resolveSafeMotionEffect({
    mode: "polished",
    reducedMotion: true,
  });

  const drift = resolveSafeMotionEffect({
    mode: "polished",
    preservesCoordinates: false,
  });

  const heavy = resolveSafeMotionEffect({
    mode: "polished",
    heavyEffectRequested: true,
  });

  const mobile = resolveSafeMotionEffect({
    mode: "polished",
    mobile: true,
    preservesCoordinates: true,
  });

  const polished = resolveSafeMotionEffect({
    mode: "polished",
    mobile: false,
    preservesCoordinates: true,
  });

  return (
    reduced.status === "disabled" &&
    reduced.canAnimateTransform === false &&
    drift.status === "blocked" &&
    drift.blockedReason === "coordinate_drift" &&
    heavy.status === "blocked" &&
    heavy.blockedReason === "heavy_effect" &&
    mobile.status === "safe" &&
    mobile.canAnimateTransform === false &&
    mobile.canAnimateShadow === true &&
    mobile.durationMs <= 160 &&
    polished.status === "safe" &&
    polished.glowOpacity <= 0.32 &&
    canUseSafeMotionEffect({ mode: "safe", preservesCoordinates: true }) === true &&
    canUseSafeMotionEffect({ mode: "safe", preservesCoordinates: false }) === false
  );
}
