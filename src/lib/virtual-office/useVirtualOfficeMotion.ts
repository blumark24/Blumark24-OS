"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getVirtualOfficeMotionToken,
  virtualOfficeTransition,
  type VirtualOfficeMotionState,
} from "./interactionMotion";

export interface VirtualOfficeMotionStyleOptions {
  state?: VirtualOfficeMotionState;
  disabled?: boolean;
}

export interface VirtualOfficeMotionStyleResult {
  reducedMotion: boolean;
  style: Pick<CSSProperties, "opacity" | "outline" | "transform" | "transition">;
}

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useVirtualOfficeReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return reducedMotion;
}

export function useVirtualOfficeMotionStyle(
  options: VirtualOfficeMotionStyleOptions = {},
): VirtualOfficeMotionStyleResult {
  const reducedMotion = useVirtualOfficeReducedMotion();

  const style = useMemo(() => {
    const token = getVirtualOfficeMotionToken({
      state: options.state ?? "idle",
      disabled: options.disabled,
      reducedMotion,
    });

    return {
      opacity: token.opacity,
      outline: token.outline,
      transform: token.transform,
      transition: virtualOfficeTransition(token),
    } satisfies VirtualOfficeMotionStyleResult["style"];
  }, [options.disabled, options.state, reducedMotion]);

  return { reducedMotion, style };
}

export function getVirtualOfficeMotionStyle(
  options: VirtualOfficeMotionStyleOptions & { reducedMotion?: boolean } = {},
): VirtualOfficeMotionStyleResult["style"] {
  const token = getVirtualOfficeMotionToken({
    state: options.state ?? "idle",
    disabled: options.disabled,
    reducedMotion: options.reducedMotion ?? readReducedMotion(),
  });

  return {
    opacity: token.opacity,
    outline: token.outline,
    transform: token.transform,
    transition: virtualOfficeTransition(token),
  };
}
