"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WS_GLASS_MODAL } from "@/components/ui/workspaceVisual";

interface OrgLeadershipActionSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function OrgLeadershipActionSheet({
  open,
  title,
  onClose,
  children,
}: OrgLeadershipActionSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm"
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
            "w-full max-w-lg rounded-t-2xl sm:rounded-2xl pb-[max(calc(5rem+env(safe-area-inset-bottom,0px)),1rem)] sm:pb-6 shadow-[0_30px_80px_-45px_rgba(34,211,238,0.45)]",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-2 sticky top-0 bg-[#0b1e3a]/95 pb-2 z-10">
            <h3
              id="leadership-action-sheet-title"
              className="text-base font-bold text-white truncate"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-[#8ba3c7] hover:text-white touch-manipulation"
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

export function LeadershipPreviewFooter({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="w-full rounded-xl border border-[#1e3a5f] bg-[#0a1628]/60 px-4 py-2.5 text-xs text-[#6b87ab] cursor-not-allowed touch-manipulation"
    >
      {label}
    </button>
  );
}

export const leadershipSelectClass = "input-dark w-full min-h-11 text-sm max-w-full";

export const leadershipLabelClass = "mb-1.5 block text-xs text-[#8ba3c7]";

export function LeadershipImpactBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/5 px-3 py-2.5 space-y-1 min-w-0"
      dir="rtl"
    >
      <p className="text-[10px] text-[#22d3ee]/80 font-medium">{title}</p>
      <div className="text-[11px] text-[#b8cce8] leading-relaxed break-words space-y-0.5">
        {children}
      </div>
    </div>
  );
}
