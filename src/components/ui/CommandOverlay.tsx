"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Premium glass surface — matches /org package card language. */
export function CommandSurface({
  children,
  className,
  accent = "cyan",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "cyan" | "violet";
  style?: React.CSSProperties;
}) {
  const orb =
    accent === "violet"
      ? "rgba(168,85,247,0.32)"
      : "rgba(34,211,238,0.28)";
  const border =
    accent === "violet" ? "border-violet-400/30" : "border-cyan-400/28";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.65rem] border backdrop-blur-xl",
        border,
        "bg-[linear-gradient(155deg,rgba(10,22,42,0.92)_0%,rgba(7,15,32,0.96)_55%,rgba(8,18,36,0.94)_100%)]",
        "shadow-[0_0_0_1px_rgba(34,211,238,0.06),0_22px_52px_-18px_rgba(0,0,0,0.72),0_0_36px_-18px_rgba(34,211,238,0.12)]",
        className,
      )}
      style={style}
    >
      <div
        className="pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full blur-2xl opacity-50"
        style={{ background: orb }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-20 rounded-full blur-2xl opacity-30"
        style={{ background: orb }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(34,211,238,0.07),transparent_55%)]" />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

/** Subtle scrim — dashboard stays recognizable behind overlays. */
export function CommandOverlayBackdrop({
  onClose,
  zIndex = 58,
  className,
}: {
  onClose?: () => void;
  zIndex?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="إغلاق"
      className={cn(
        "fixed inset-0 bg-[#030913]/30 backdrop-blur-[2px] transition-opacity",
        className,
      )}
      style={{ zIndex }}
      onClick={onClose}
    />
  );
}

export type CommandFloatingPlacement = "center" | "bottom-float" | "fab-orbit";

export interface CommandFloatingOverlayProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  /** Header right slot (e.g. mark-all-read) */
  headerAction?: ReactNode;
  /** Show X close in header */
  showClose?: boolean;
  width?: string;
  maxWidth?: number;
  maxHeight?: string;
  placement?: CommandFloatingPlacement;
  className?: string;
  accent?: "cyan" | "violet";
  /** Lock body scroll while open */
  lockScroll?: boolean;
}

/**
 * Premium floating command card — profile, notifications on mobile.
 * Not a full-width bottom sheet; compact card integrated with the dashboard.
 */
export function CommandFloatingOverlay({
  open,
  onClose,
  children,
  title,
  headerAction,
  showClose = true,
  width = "92vw",
  maxWidth = 420,
  maxHeight = "72vh",
  placement = "bottom-float",
  className,
  accent = "cyan",
  lockScroll = true,
}: CommandFloatingOverlayProps) {
  useEffect(() => {
    if (!open || !lockScroll) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, lockScroll]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const placementClass =
    placement === "center"
      ? "fixed inset-0 z-[62] flex items-center justify-center px-3 py-6"
      : placement === "fab-orbit"
        ? "fixed left-1/2 z-[62] -translate-x-1/2 px-2"
        : "fixed inset-x-0 z-[62] flex justify-center px-3";

  const placementStyle: React.CSSProperties =
    placement === "fab-orbit"
      ? { bottom: "calc(5.75rem + env(safe-area-inset-bottom, 0px))" }
      : placement === "bottom-float"
        ? { bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))", position: "fixed", left: 0, right: 0 }
        : {};

  return createPortal(
    <>
      <CommandOverlayBackdrop onClose={onClose} zIndex={58} />
      <div
        role="dialog"
        aria-modal="true"
        dir="rtl"
        className={cn(placementClass, className)}
        style={placement === "center" ? undefined : placementStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <CommandSurface
          accent={accent}
          className="flex flex-col w-full animate-in fade-in zoom-in-95 duration-200"
          style={{
            width,
            maxWidth,
            maxHeight,
          }}
        >
          {(title || headerAction || showClose) && (
            <div
              className={cn(
                "flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.07]",
                title || headerAction ? "px-3.5 py-2.5" : "px-2 py-1.5 justify-end",
              )}
            >
              <div className="min-w-0 flex items-center gap-2">
                {title && (
                  <h2 className="text-[13px] font-semibold text-white truncate">{title}</h2>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {headerAction}
                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#8ba3c7] hover:bg-white/[0.06] hover:text-white transition-colors"
                    aria-label="إغلاق"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </CommandSurface>
      </div>
    </>,
    document.body,
  );
}

/** Compact panel anchored to the mobile FAB — command orb style. */
export function CommandOrbPanel({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <CommandOverlayBackdrop onClose={onClose} zIndex={58} />
      <div
        className={cn(
          "fixed left-1/2 z-[62] -translate-x-1/2 w-[min(300px,88vw)]",
          "animate-in fade-in slide-in-from-bottom-2 duration-200",
          className,
        )}
        style={{ bottom: "calc(5.85rem + env(safe-area-inset-bottom, 0px))" }}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <CommandSurface accent="violet" className="overflow-hidden">
          {title && (
            <div className="border-b border-white/[0.07] px-3.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/70">
                {title}
              </p>
            </div>
          )}
          {children}
          {/* Visual stem connecting to FAB */}
          <div
            className="pointer-events-none absolute left-1/2 -bottom-2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-violet-400/25 bg-[#0a1628]/95"
            aria-hidden
          />
        </CommandSurface>
      </div>
    </>,
    document.body,
  );
}

/** Inline desktop popover wrapper — no backdrop. */
export function CommandPopover({
  children,
  className,
  width = "min(320px, 92vw)",
}: {
  children: ReactNode;
  className?: string;
  width?: string;
}) {
  return (
    <CommandSurface
      accent="cyan"
      className={cn("overflow-hidden", className)}
      style={{ width } as React.CSSProperties}
    >
      {children}
    </CommandSurface>
  );
}
