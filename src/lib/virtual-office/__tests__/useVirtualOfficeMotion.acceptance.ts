import { getVirtualOfficeMotionStyle } from "../useVirtualOfficeMotion";

export function assertVirtualOfficeMotionStyleAdapter(): boolean {
  const idle = getVirtualOfficeMotionStyle({ state: "idle", reducedMotion: false });
  const hover = getVirtualOfficeMotionStyle({ state: "hover", reducedMotion: false });
  const reducedHover = getVirtualOfficeMotionStyle({ state: "hover", reducedMotion: true });
  const disabled = getVirtualOfficeMotionStyle({ state: "hover", disabled: true, reducedMotion: false });

  return (
    typeof idle.transition === "string" &&
    hover.transform !== idle.transform &&
    reducedHover.transform === idle.transform &&
    disabled.transition === "none" &&
    disabled.opacity === 0.55
  );
}
