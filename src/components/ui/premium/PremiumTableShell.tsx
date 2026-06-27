import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PremiumTableShellProps {
  caption?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** When true, removes the rounded corners on mobile and lets the
   *  shell stretch to the viewport edges. Useful for dense tables. */
  edgeOnMobile?: boolean;
  className?: string;
}

export default function PremiumTableShell({
  caption,
  header,
  children,
  footer,
  edgeOnMobile = false,
  className,
}: PremiumTableShellProps) {
  return (
    <section
      dir="rtl"
      className={cn(
        "overflow-hidden border border-white/10 bg-[#0B1F3A]/50 shadow-[0_8px_32px_rgba(2,8,23,0.4)] backdrop-blur-xl",
        edgeOnMobile
          ? "rounded-none premium-tablet:rounded-premium-lg"
          : "rounded-premium-lg",
        className,
      )}
    >
      {caption ? (
        <div className="border-b border-white/5 px-premium-5 py-premium-4 text-sm text-[#94A3B8]">
          {caption}
        </div>
      ) : null}
      {header ? (
        <div className="grid items-center gap-premium-3 border-b border-white/10 bg-white/[0.02] px-premium-5 py-premium-3 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
          {header}
        </div>
      ) : null}
      <div className="divide-y divide-white/5">{children}</div>
      {footer ? (
        <div className="border-t border-white/5 bg-white/[0.02] px-premium-5 py-premium-3 text-xs text-[#94A3B8]">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
