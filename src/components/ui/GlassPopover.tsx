"use client";

import { cn } from "@/lib/utils";
import { CommandSurface } from "@/components/ui/CommandOverlay";

/** Shared floating glass surface for header dropdowns — uses CommandSurface. */
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
    <CommandSurface
      className={cn(
        "overflow-hidden",
        align === "end" && "left-0",
        align === "start" && "right-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className,
      )}
    >
      {children}
    </CommandSurface>
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 bg-[#030913]/40 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
