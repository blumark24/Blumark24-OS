import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { GLASS_CARD_CLASSES, type GlassCardVariant } from "@/lib/design/tokens";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  /** When true, lifts on hover. Off by default for static surfaces. */
  hoverable?: boolean;
  /** When true, hugs viewport edges on mobile (no horizontal padding). */
  edgeOnMobile?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { variant = "default", hoverable = false, edgeOnMobile = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      dir="rtl"
      className={cn(
        "rounded-premium-lg p-premium-5",
        edgeOnMobile && "premium-mobile:rounded-none premium-mobile:p-premium-4",
        GLASS_CARD_CLASSES[variant],
        hoverable &&
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export default GlassCard;
