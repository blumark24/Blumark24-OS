import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface QuickActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
}

const QuickActionButton = forwardRef<HTMLButtonElement, QuickActionButtonProps>(
  function QuickActionButton({ icon, label, hint, className, type, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        dir="rtl"
        className={cn(
          "group flex w-full items-center gap-premium-3 rounded-premium-lg border border-white/10 bg-[#0B1F3A]/60 p-premium-4 text-right transition-all duration-200 hover:border-[#00D9FF]/40 hover:bg-[#0B1F3A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60",
          className,
        )}
        {...rest}
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-gradient-to-br from-[#147CFF]/25 to-[#00D9FF]/15 text-[#7DDCFF] transition-transform duration-200 group-hover:scale-105">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-[#F8FAFC]">
            {label}
          </span>
          {hint ? (
            <span className="truncate text-xs text-[#94A3B8]">{hint}</span>
          ) : null}
        </span>
      </button>
    );
  },
);

export default QuickActionButton;
