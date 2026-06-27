import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  /** Column counts per breakpoint. */
  cols?: {
    mobile?: 1 | 2;
    tablet?: 1 | 2 | 3 | 4;
    laptop?: 1 | 2 | 3 | 4 | 5 | 6;
    desktop?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  /** Gap token, defaults to 16px (premium-4). */
  gap?: "premium-2" | "premium-3" | "premium-4" | "premium-5" | "premium-6";
  children: ReactNode;
}

const MOBILE_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};
const TABLET_COLS: Record<number, string> = {
  1: "premium-tablet:grid-cols-1",
  2: "premium-tablet:grid-cols-2",
  3: "premium-tablet:grid-cols-3",
  4: "premium-tablet:grid-cols-4",
};
const LAPTOP_COLS: Record<number, string> = {
  1: "premium-laptop:grid-cols-1",
  2: "premium-laptop:grid-cols-2",
  3: "premium-laptop:grid-cols-3",
  4: "premium-laptop:grid-cols-4",
  5: "premium-laptop:grid-cols-5",
  6: "premium-laptop:grid-cols-6",
};
const DESKTOP_COLS: Record<number, string> = {
  1: "premium-desktop:grid-cols-1",
  2: "premium-desktop:grid-cols-2",
  3: "premium-desktop:grid-cols-3",
  4: "premium-desktop:grid-cols-4",
  5: "premium-desktop:grid-cols-5",
  6: "premium-desktop:grid-cols-6",
};
const GAP_CLASSES: Record<string, string> = {
  "premium-2": "gap-premium-2",
  "premium-3": "gap-premium-3",
  "premium-4": "gap-premium-4",
  "premium-5": "gap-premium-5",
  "premium-6": "gap-premium-6",
};

export default function ResponsiveGrid({
  cols,
  gap = "premium-4",
  className,
  children,
  ...rest
}: ResponsiveGridProps) {
  const { mobile = 1, tablet = 2, laptop = 3, desktop = 4 } = cols ?? {};
  return (
    <div
      dir="rtl"
      className={cn(
        "grid w-full",
        MOBILE_COLS[mobile],
        TABLET_COLS[tablet],
        LAPTOP_COLS[laptop],
        DESKTOP_COLS[desktop],
        GAP_CLASSES[gap],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
