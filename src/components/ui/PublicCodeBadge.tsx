import { cn } from "@/lib/utils";

interface PublicCodeBadgeProps {
  code?: string | null;
  className?: string;
}

/** Read-only tenant/public identifier chip (ORG, CLI, EMP, TSK, DEP). */
export function PublicCodeBadge({ code, className }: PublicCodeBadgeProps) {
  const trimmed = typeof code === "string" ? code.trim() : "";
  if (!trimmed) return null;

  return (
    <span
      dir="ltr"
      title={trimmed}
      className={cn(
        "inline-block max-w-[8.5rem] truncate rounded-md border border-[#22d3ee]/30",
        "bg-[#22d3ee]/[0.08] px-1.5 py-0.5 font-mono text-[10px] leading-tight text-[#67e8f9] tabular-nums",
        className,
      )}
    >
      {trimmed}
    </span>
  );
}
