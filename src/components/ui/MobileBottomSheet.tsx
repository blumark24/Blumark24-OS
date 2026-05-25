"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Extra classes on the sheet panel */
  className?: string;
}

/**
 * RTL-safe bottom sheet for mobile overlays (profile, notifications, quick actions).
 * Renders above bottom nav (z-60+) with scroll-safe content.
 */
export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: MobileBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="إغلاق"
        className="fixed inset-0 z-[60] bg-[#030913]/65 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir="rtl"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61] lg:hidden",
          "mx-auto w-full max-w-lg",
          "rounded-t-[1.35rem] border border-white/[0.12] border-b-0",
          "bg-[rgba(8,18,32,0.97)] backdrop-blur-2xl",
          "shadow-[0_-24px_60px_-20px_rgba(0,0,0,0.85)]",
          "max-h-[min(88vh,640px)] flex flex-col",
          "animate-in slide-in-from-bottom duration-200",
          className,
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
          {title ? (
            <h2 className="text-sm font-semibold text-white">{title}</h2>
          ) : (
            <span className="mx-auto h-1 w-10 rounded-full bg-white/20" aria-hidden />
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#8ba3c7] hover:bg-white/[0.06] hover:text-white transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </>,
    document.body,
  );
}
