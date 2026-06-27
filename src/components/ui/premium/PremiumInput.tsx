import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PremiumInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconStart?: ReactNode;
  /** Force the input to display numeric content as LTR while keeping
   *  the label and hint in RTL. Use for currency/IDs/phone fields. */
  numericLtr?: boolean;
}

const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  function PremiumInput(
    { label, hint, error, iconStart, numericLtr, className, id, ...rest },
    ref,
  ) {
    const inputId = id ?? rest.name ?? undefined;
    return (
      <div dir="rtl" className="flex w-full flex-col gap-premium-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#F8FAFC]"
          >
            {label}
          </label>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-premium-2 rounded-premium-md border bg-[#0B1F3A]/70 px-premium-4 py-premium-3 transition-colors",
            error
              ? "border-[#EF4444]/50 focus-within:border-[#EF4444]"
              : "border-white/10 focus-within:border-[#00D9FF]/60",
          )}
        >
          {iconStart ? (
            <span className="inline-flex shrink-0 text-[#94A3B8]">
              {iconStart}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            dir={numericLtr ? "ltr" : "rtl"}
            className={cn(
              "w-full bg-transparent text-sm text-[#F8FAFC] placeholder:text-[#94A3B8]/70 focus:outline-none",
              numericLtr && "text-right tabular-nums",
              className,
            )}
            {...rest}
          />
        </div>
        {error ? (
          <p className="text-xs text-[#FCA5A5]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#94A3B8]">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export default PremiumInput;
