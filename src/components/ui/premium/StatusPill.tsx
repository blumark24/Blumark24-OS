import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_PILL_CLASSES, type StatusPillVariant } from "@/lib/design/tokens";

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusPillVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const StatusPill = forwardRef<HTMLSpanElement, StatusPillProps>(function StatusPill(
  { variant = "neutral", icon, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      dir="rtl"
      className={cn(
        "inline-flex items-center gap-premium-2 rounded-full px-premium-3 py-1 text-xs font-medium",
        STATUS_PILL_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {icon ? <span className="inline-flex shrink-0 items-center">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
});

export default StatusPill;
