import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: ReactNode;
  className?: string;
  /** Number of skeleton bars to render below the spinner. */
  skeletonRows?: number;
}

export default function LoadingState({
  label = "جارٍ التحميل…",
  skeletonRows = 0,
  className,
}: LoadingStateProps) {
  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-premium-4 rounded-premium-lg border border-white/10 bg-[#0B1F3A]/40 p-premium-6 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#147CFF]/30 border-t-[#00D9FF]"
      />
      <p className="text-sm text-[#94A3B8]">{label}</p>
      {skeletonRows > 0 ? (
        <div className="flex w-full max-w-md flex-col gap-premium-2 pt-premium-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-full animate-pulse rounded-full bg-white/5"
              style={{ width: `${100 - i * 8}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
