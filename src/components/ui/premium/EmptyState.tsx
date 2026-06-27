import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      dir="rtl"
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-premium-3 rounded-premium-lg border border-dashed border-white/10 bg-[#0B1F3A]/40 p-premium-8 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#7DDCFF]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-[#94A3B8]">{description}</p>
      ) : null}
      {action ? <div className="pt-premium-2">{action}</div> : null}
    </div>
  );
}
