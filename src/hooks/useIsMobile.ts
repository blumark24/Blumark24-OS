"use client";

import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 768;

/** True when viewport width is at most 768px (mobile / small tablet). */
export function useIsMobile(breakpoint = MOBILE_MAX_WIDTH): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpoint]);

  return mobile;
}

export { MOBILE_MAX_WIDTH };
