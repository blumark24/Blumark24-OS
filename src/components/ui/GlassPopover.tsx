"use client";

import { cn } from "@/lib/utils";

/** Shared floating glass surface for header dropdowns and menus. */
export function GlassPopover({
  children,
  className,
  align = "start",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.12] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] overflow-hidden",
        "bg-[rgba(8,18,32,0.94)] backdrop-blur-2xl",
        align === "end" && "left-0",
        align === "start" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}

export function GlassModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 bg-[#030913]/70 backdrop-blur-md"
      dir="rtl"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
