export type VirtualOfficeMotionState = "idle" | "hover" | "focus" | "disabled";
export type VirtualOfficeMotionIntensity = "none" | "subtle" | "standard";

export interface VirtualOfficeMotionToken {
  state: VirtualOfficeMotionState;
  intensity: VirtualOfficeMotionIntensity;
  durationMs: number;
  easing: string;
  transform: string;
  opacity: number;
  outline: string;
}

export interface VirtualOfficeMotionOptions {
  state?: VirtualOfficeMotionState;
  reducedMotion?: boolean;
  disabled?: boolean;
}

const EASING_STANDARD = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const EASING_REDUCED = "linear";

export const VIRTUAL_OFFICE_MOTION_TOKENS: Record<VirtualOfficeMotionState, VirtualOfficeMotionToken> = {
  idle: {
    state: "idle",
    intensity: "subtle",
    durationMs: 160,
    easing: EASING_STANDARD,
    transform: "translateY(0px) scale(1)",
    opacity: 1,
    outline: "none",
  },
  hover: {
    state: "hover",
    intensity: "subtle",
    durationMs: 180,
    easing: EASING_STANDARD,
    transform: "translateY(-1px) scale(1.005)",
    opacity: 1,
    outline: "none",
  },
  focus: {
    state: "focus",
    intensity: "subtle",
    durationMs: 160,
    easing: EASING_STANDARD,
    transform: "translateY(0px) scale(1)",
    opacity: 1,
    outline: "1px solid rgba(34,211,238,0.35)",
  },
  disabled: {
    state: "disabled",
    intensity: "none",
    durationMs: 0,
    easing: EASING_REDUCED,
    transform: "translateY(0px) scale(1)",
    opacity: 0.55,
    outline: "none",
  },
};

export function getVirtualOfficeMotionToken(options: VirtualOfficeMotionOptions = {}): VirtualOfficeMotionToken {
  if (options.disabled) return VIRTUAL_OFFICE_MOTION_TOKENS.disabled;

  const base = VIRTUAL_OFFICE_MOTION_TOKENS[options.state ?? "idle"] ?? VIRTUAL_OFFICE_MOTION_TOKENS.idle;

  if (!options.reducedMotion) return base;

  return {
    ...base,
    intensity: base.intensity === "none" ? "none" : "subtle",
    durationMs: Math.min(base.durationMs, 80),
    easing: EASING_REDUCED,
    transform: "translateY(0px) scale(1)",
  };
}

export function virtualOfficeTransition(token: VirtualOfficeMotionToken): string {
  if (token.durationMs <= 0) return "none";
  return `transform ${token.durationMs}ms ${token.easing}, opacity ${token.durationMs}ms ${token.easing}, border-color ${token.durationMs}ms ${token.easing}`;
}

export function isMotionAllowed(options: VirtualOfficeMotionOptions = {}): boolean {
  return !options.disabled && !options.reducedMotion;
}
