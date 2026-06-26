import {
  getVirtualOfficeMotionToken,
  isMotionAllowed,
  virtualOfficeTransition,
} from "../interactionMotion";

export function assertVirtualOfficeMotionTokens(): boolean {
  const idle = getVirtualOfficeMotionToken({ state: "idle" });
  const hover = getVirtualOfficeMotionToken({ state: "hover" });
  const reducedHover = getVirtualOfficeMotionToken({ state: "hover", reducedMotion: true });
  const disabled = getVirtualOfficeMotionToken({ state: "hover", disabled: true });

  return (
    idle.intensity === "subtle" &&
    hover.transform !== idle.transform &&
    reducedHover.transform === idle.transform &&
    reducedHover.durationMs <= hover.durationMs &&
    disabled.intensity === "none" &&
    disabled.durationMs === 0 &&
    virtualOfficeTransition(disabled) === "none" &&
    isMotionAllowed({ state: "hover" }) === true &&
    isMotionAllowed({ state: "hover", reducedMotion: true }) === false &&
    isMotionAllowed({ state: "hover", disabled: true }) === false
  );
}
