"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import AgencyCommandPanel from "@/components/agency/AgencyCommandPanel";
import { AGENCY_COMMAND_LABEL } from "@/lib/features/packageFeatures";

interface AgencyCommandModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AgencyCommandModal({ open, onClose }: AgencyCommandModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-[var(--dash-overlay,rgba(2,8,23,0.72))] px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={AGENCY_COMMAND_LABEL}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative max-h-[90dvh] w-[calc(100vw-24px)] overflow-hidden rounded-[28px] border border-cyan-400/25",
          "bg-[linear-gradient(165deg,rgba(8,18,38,0.97),rgba(12,32,62,0.92))] shadow-[0_24px_80px_-24px_rgba(34,211,238,0.45)] backdrop-blur-2xl",
          "sm:w-full sm:max-w-6xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0a1628]/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] text-cyan-200/70">لوحة قيادة ذكية</p>
            <h2 className="truncate text-lg font-bold text-white sm:text-xl">{AGENCY_COMMAND_LABEL}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="inline-flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-white/10 text-white/70 hover:border-cyan-400/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90dvh-4rem)] px-3 py-4 sm:px-6 sm:py-5">
          <AgencyCommandPanel variant="modal" />
        </div>
      </div>
    </div>
  );
}
