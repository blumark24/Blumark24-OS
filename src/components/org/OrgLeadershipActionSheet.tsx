"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WS_GLASS_MODAL } from "@/components/ui/workspaceVisual";
import type { LeadershipActionId } from "@/lib/org/buildLeadershipActionPreviews";
import { accentForAction } from "./leadershipActionVisual";

interface OrgLeadershipActionSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  accentId?: LeadershipActionId;
  children: React.ReactNode;
}

export function OrgLeadershipActionSheet({
  open,
  title,
  onClose,
  accentId,
  children,
}: OrgLeadershipActionSheetProps) {
  if (!open) return null;

  const accent = accentId ? accentForAction(accentId) : null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leadership-action-sheet-title"
      onClick={onClose}
    >
      <div
        className="flex min-h-[100dvh] items-end justify-center p-2 sm:items-center sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            WS_GLASS_MODAL,
            "w-full max-w-lg rounded-t-2xl sm:rounded-2xl",
            "pb-[max(calc(5rem+env(safe-area-inset-bottom,0px)),1rem)] sm:pb-6",
            "border-white/[0.12]",
            accent?.sheetShadow ?? "shadow-[0_30px_80px_-45px_rgba(34,211,238,0.45)]",
          )}
        >
          <div
            className={cn(
              "mb-5 flex items-center justify-between gap-3 sticky top-0 z-10 pb-3 -mx-1 px-1",
              accent?.headerBar ?? "border-b border-white/[0.08]",
            )}
            style={{ background: "linear-gradient(180deg, rgba(11,30,58,0.98) 0%, rgba(11,30,58,0.92) 100%)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {accent ? (
                <span
                  className={cn("h-2 w-2 rounded-full shrink-0", accent.headerDot)}
                  aria-hidden
                />
              ) : null}
              <h3
                id="leadership-action-sheet-title"
                className="text-base sm:text-lg font-bold text-white truncate"
              >
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-[#8ba3c7] hover:text-white hover:bg-white/10 touch-manipulation min-h-10 min-w-10 flex items-center justify-center"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 min-w-0 overflow-x-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LeadershipPreviewFooter({
  label,
  accentId,
}: {
  label: string;
  accentId?: LeadershipActionId;
}) {
  const accent = accentId ? accentForAction(accentId) : null;
  return (
    <button
      type="button"
      disabled
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-xs leading-relaxed cursor-not-allowed touch-manipulation",
        "text-[#8ba3c7]",
        accent?.footerBorder ?? "border-[#1e3a5f]",
        accent?.footerBg ?? "bg-[#0a1628]/60",
      )}
    >
      {label}
    </button>
  );
}

export const leadershipSelectClass = "input-dark w-full min-h-11 text-sm max-w-full";

export const leadershipLabelClass = "mb-1.5 block text-xs text-[#8ba3c7] font-medium";

export function LeadershipImpactBox({
  title,
  accentId,
  children,
}: {
  title: string;
  accentId?: LeadershipActionId;
  children: React.ReactNode;
}) {
  const accent = accentId ? accentForAction(accentId) : null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 space-y-1.5 min-w-0",
        accent?.impactBox ?? "border-[#22d3ee]/20 bg-[#22d3ee]/5",
      )}
      dir="rtl"
    >
      <p
        className={cn(
          "text-[10px] font-semibold tracking-wide",
          accent?.impactTitle ?? "text-[#22d3ee]/80",
        )}
      >
        {title}
      </p>
      <div className="text-[11px] sm:text-xs text-[#b8cce8] leading-relaxed break-words space-y-1">
        {children}
      </div>
    </div>
  );
}
