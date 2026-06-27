import { cn } from "@/lib/utils";

export interface AIOrbVisualProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Decorative only — set to false to expose to screen readers. */
  decorative?: boolean;
  /** Add the `label` text below the orb. Defaults to empty. */
  label?: string;
}

const SIZE_CLASSES: Record<NonNullable<AIOrbVisualProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

/**
 * Non-functional decorative orb used as a visual anchor for AI
 * surfaces. Pure CSS — no canvas, no event handlers, no audio/video,
 * no animation frame loops, no business logic.
 */
export default function AIOrbVisual({
  size = "md",
  className,
  decorative = true,
  label,
}: AIOrbVisualProps) {
  return (
    <div
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={!decorative && label ? label : undefined}
      className={cn("inline-flex flex-col items-center gap-premium-2", className)}
    >
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          SIZE_CLASSES[size],
        )}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[#7C3AED] via-[#147CFF] to-[#00D9FF] opacity-90"
        />
        <span
          aria-hidden
          className="absolute inset-1 rounded-full bg-gradient-to-tr from-[#00D9FF]/30 to-transparent"
        />
        <span
          aria-hidden
          className="absolute -inset-2 rounded-full bg-[#00D9FF]/20 blur-2xl"
        />
      </span>
      {label && !decorative ? (
        <span className="text-xs font-medium text-[#94A3B8]">{label}</span>
      ) : null}
    </div>
  );
}
