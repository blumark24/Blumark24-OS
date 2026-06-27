import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  PREMIUM_BUTTON_CLASSES,
  type PremiumButtonVariant,
} from "@/lib/design/tokens";

export interface PremiumButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PremiumButtonVariant;
  size?: "sm" | "md" | "lg";
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /** Renders a full-width button on mobile only. */
  fullWidthOnMobile?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<PremiumButtonProps["size"]>, string> = {
  sm: "px-premium-3 py-premium-2 text-xs",
  md: "px-premium-5 py-premium-3 text-sm",
  lg: "px-premium-6 py-premium-4 text-base",
};

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  function PremiumButton(
    {
      variant = "primary",
      size = "md",
      iconStart,
      iconEnd,
      fullWidthOnMobile,
      className,
      children,
      type,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        dir="rtl"
        className={cn(
          "inline-flex select-none items-center justify-center gap-premium-2 rounded-premium-md font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817] disabled:cursor-not-allowed disabled:opacity-50",
          SIZE_CLASSES[size],
          PREMIUM_BUTTON_CLASSES[variant],
          fullWidthOnMobile && "w-full premium-tablet:w-auto",
          className,
        )}
        {...rest}
      >
        {iconStart ? <span className="inline-flex shrink-0">{iconStart}</span> : null}
        <span>{children}</span>
        {iconEnd ? <span className="inline-flex shrink-0">{iconEnd}</span> : null}
      </button>
    );
  },
);

export default PremiumButton;
