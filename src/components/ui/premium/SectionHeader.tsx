import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-side actions (Arabic RTL — visually appears on the LEFT of the row). */
  actions?: ReactNode;
  /** Optional small badge/pill before the title. */
  badge?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  actions,
  badge,
  className,
}: SectionHeaderProps) {
  return (
    <header
      dir="rtl"
      className={cn(
        "flex flex-col gap-premium-3 premium-tablet:flex-row premium-tablet:items-start premium-tablet:justify-between premium-tablet:gap-premium-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-premium-2">
        {badge ? <div>{badge}</div> : null}
        <h2 className="text-xl font-bold leading-tight text-[#F8FAFC] premium-tablet:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-[#94A3B8]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-premium-2 premium-tablet:shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
