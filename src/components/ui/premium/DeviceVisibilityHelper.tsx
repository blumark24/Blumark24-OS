import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PremiumDevice = "mobile" | "tablet" | "laptop" | "desktop" | "wide";

export interface DeviceVisibilityHelperProps
  extends HTMLAttributes<HTMLDivElement> {
  /** Devices on which the wrapped content should render. */
  visibleOn: PremiumDevice[];
  children: ReactNode;
}

/**
 * Show/hide content per premium breakpoint. Lightweight — relies on
 * Tailwind's hidden/block utilities at the documented `premium-*`
 * breakpoints. Does not mount/unmount conditionally, so screen-reader
 * users at any breakpoint still see the same DOM.
 */
export default function DeviceVisibilityHelper({
  visibleOn,
  className,
  children,
  ...rest
}: DeviceVisibilityHelperProps) {
  const cls: string[] = [];
  const wantMobile = visibleOn.includes("mobile");
  const wantTablet = visibleOn.includes("tablet");
  const wantLaptop = visibleOn.includes("laptop");
  const wantDesktop = visibleOn.includes("desktop");
  const wantWide = visibleOn.includes("wide");

  cls.push(wantMobile ? "block" : "hidden");
  cls.push(wantTablet ? "premium-tablet:block" : "premium-tablet:hidden");
  cls.push(wantLaptop ? "premium-laptop:block" : "premium-laptop:hidden");
  cls.push(wantDesktop ? "premium-desktop:block" : "premium-desktop:hidden");
  cls.push(wantWide ? "premium-wide:block" : "premium-wide:hidden");

  return (
    <div className={cn(cls.join(" "), className)} {...rest}>
      {children}
    </div>
  );
}
