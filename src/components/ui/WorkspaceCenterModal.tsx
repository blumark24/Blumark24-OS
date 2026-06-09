"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Centered iPhone-style glass modal for the Customer Workspace add/edit/details
 * dialogs (Employees / Tasks / Clients). Premium dark navy glass frame with a
 * cyan border, soft outer glow and inner highlight. Always centered (never a
 * full-screen or bottom sheet); the body scrolls internally and the footer is
 * sticky. Presentation only — it renders children and calls onClose.
 *
 * Sizing: width calc(100vw - 32px), max-width 420px, max-height 84vh.
 */
export function WorkspaceCenterModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  closeOnBackdrop = true,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  bodyClassName?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex w-[calc(100vw-32px)] max-w-[420px] max-h-[84vh] flex-col overflow-hidden",
          "rounded-[24px] border border-[rgba(34,211,238,0.20)]",
          "bg-[linear-gradient(155deg,rgba(13,25,48,0.97),rgba(7,15,32,0.98))]",
          "shadow-[0_30px_80px_-28px_rgba(0,0,0,0.75),0_0_46px_rgba(34,211,238,0.07)]",
          "backdrop-blur-[18px]",
        )}
      >
        {/* inner highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />

        {/* Header — compact, RTL */}
        <div className="relative flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <div className="min-w-0">
            <h3 className="text-white font-heading font-bold text-base leading-snug truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-[#8ba3c7] mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="shrink-0 grid h-8 w-8 place-items-center rounded-lg text-[#8ba3c7] transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrolls internally */}
        <div className={cn("relative flex-1 overflow-y-auto px-5 py-4", bodyClassName)}>
          {children}
        </div>

        {/* Footer — sticky within the modal */}
        {footer && (
          <div className="relative shrink-0 border-t border-white/[0.06] bg-[rgba(7,15,32,0.65)] px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
