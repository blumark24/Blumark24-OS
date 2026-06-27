import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  /** Top header — keep simple, place actions on the right (RTL = left visually). */
  header?: ReactNode;
  /** Side region. Renders as a column on `premium-laptop` and up,
   *  stacked above main content on mobile/tablet. */
  side?: ReactNode;
  /** Main content. */
  children: ReactNode;
  /** Optional footer. */
  footer?: ReactNode;
  /** Page-wide max width. Defaults to 1280px container. */
  maxWidth?: "narrow" | "default" | "wide" | "full";
  className?: string;
}

const MAX_WIDTH: Record<NonNullable<AppShellProps["maxWidth"]>, string> = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[1440px]",
  full: "max-w-none",
};

/**
 * Layout primitive only. Owns the page background, vertical stacking,
 * and the optional sidebar slot. Does NOT mount routing, nav state,
 * or any business data. Adopters compose their own `side` content.
 */
export default function AppShell({
  header,
  side,
  children,
  footer,
  maxWidth = "default",
  className,
}: AppShellProps) {
  return (
    <div
      dir="rtl"
      className={cn(
        "min-h-screen w-full bg-[#020817] text-[#F8FAFC] antialiased",
        className,
      )}
    >
      {header ? (
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#071426]/80 backdrop-blur-xl">
          <div className={cn("mx-auto w-full px-premium-4 py-premium-3", MAX_WIDTH[maxWidth])}>
            {header}
          </div>
        </header>
      ) : null}

      <div className={cn("mx-auto w-full px-premium-4 py-premium-5", MAX_WIDTH[maxWidth])}>
        <div
          className={cn(
            "flex flex-col gap-premium-6",
            side && "premium-laptop:flex-row-reverse premium-laptop:items-start",
          )}
        >
          {side ? (
            <aside className="w-full premium-laptop:w-64 premium-laptop:shrink-0">
              {side}
            </aside>
          ) : null}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      {footer ? (
        <footer className="border-t border-white/5 bg-[#071426]/60">
          <div className={cn("mx-auto w-full px-premium-4 py-premium-4 text-xs text-[#94A3B8]", MAX_WIDTH[maxWidth])}>
            {footer}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
