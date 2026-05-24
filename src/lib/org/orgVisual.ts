import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { OrgPlanLimits } from "./orgPackageLimits";

export const ORG_CANVAS =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060f1c] shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]";

export const ORG_CANVAS_GLOW =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(124,58,237,0.08),transparent)]";

export const ORG_TOOLBAR =
  "flex flex-wrap items-center gap-2 p-3 rounded-xl border border-white/[0.08] bg-[rgba(10,22,40,0.85)] backdrop-blur-xl";

export function orgPlanBadgeClass(limits: OrgPlanLimits): string {
  return cn(
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border",
    limits.tierClass === "org-tier-basic" &&
      "border-[#22d3ee]/35 bg-[#22d3ee]/10 text-[#22d3ee]",
    limits.tierClass === "org-tier-growth" &&
      "border-[#a855f7]/35 bg-[#a855f7]/10 text-[#c4b5fd]",
    limits.tierClass === "org-tier-advanced" &&
      "border-[#f59e0b]/35 bg-[#f59e0b]/10 text-[#fcd34d]",
  );
}

export function orgNodeGlow(color: string, selected: boolean): CSSProperties {
  return {
    boxShadow: selected
      ? `0 0 0 1px ${color}88, 0 12px 40px ${color}33, inset 0 1px 0 rgba(255,255,255,0.08)`
      : `0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`,
  };
}
