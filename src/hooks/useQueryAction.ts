"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Runs `onMatch` once when `paramKey` equals `paramValue` (or any value in the array),
 * then strips the param from the URL without scrolling.
 */
export function useQueryAction(
  paramKey: string,
  paramValue: string | string[],
  onMatch: () => void,
  enabled = true,
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (!enabled || handled.current) return;

    const current = searchParams.get(paramKey);
    const matches = Array.isArray(paramValue)
      ? paramValue.includes(current ?? "")
      : current === paramValue;

    if (!matches) return;

    handled.current = true;
    onMatch();

    const next = new URLSearchParams(searchParams.toString());
    next.delete(paramKey);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [enabled, onMatch, paramKey, paramValue, pathname, router, searchParams]);
}
