import type { LeadershipActionId } from "@/lib/org/buildLeadershipActionPreviews";

export type LeadershipActionAccent = {
  /** Card */
  cardBorder: string;
  cardBorderHover: string;
  cardGlow: string;
  cardGradient: string;
  cardHighlight: string;
  iconWrap: string;
  iconColor: string;
  badge: string;
  metric: string;
  cta: string;
  ctaHover: string;
  activeRing: string;
  /** Modal */
  sheetShadow: string;
  headerBar: string;
  headerDot: string;
  impactBox: string;
  impactTitle: string;
  footerBorder: string;
  footerBg: string;
};

export const LEADERSHIP_ACTION_ACCENTS: Record<LeadershipActionId, LeadershipActionAccent> = {
  transfer_employee: {
    cardBorder: "border-cyan-400/35",
    cardBorderHover: "hover:border-cyan-300/55 active:border-cyan-300/60",
    cardGlow:
      "shadow-[0_0_28px_-8px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]",
    cardGradient:
      "bg-gradient-to-br from-cyan-500/[0.12] via-[#0a1628]/90 to-[#070d20]/95",
    cardHighlight: "before:bg-[radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.22),transparent_55%)]",
    iconWrap: "bg-cyan-500/15 border-cyan-400/35",
    iconColor: "text-cyan-300",
    badge: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100",
    metric: "text-cyan-200",
    cta: "text-cyan-200/90",
    ctaHover: "group-hover:text-cyan-100",
    activeRing: "active:ring-2 active:ring-cyan-400/40",
    sheetShadow: "shadow-[0_30px_80px_-45px_rgba(34,211,238,0.55)]",
    headerBar: "border-b border-cyan-400/20",
    headerDot: "bg-cyan-400",
    impactBox: "border-cyan-400/25 bg-cyan-500/[0.08]",
    impactTitle: "text-cyan-200/90",
    footerBorder: "border-cyan-400/20",
    footerBg: "bg-cyan-950/30",
  },
  assign_responsible: {
    cardBorder: "border-violet-400/35",
    cardBorderHover: "hover:border-violet-300/55 active:border-violet-300/60",
    cardGlow:
      "shadow-[0_0_28px_-8px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]",
    cardGradient:
      "bg-gradient-to-br from-violet-500/[0.14] via-[#0a1628]/90 to-[#070d20]/95",
    cardHighlight: "before:bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,0.24),transparent_55%)]",
    iconWrap: "bg-violet-500/15 border-violet-400/35",
    iconColor: "text-violet-300",
    badge: "border-violet-400/35 bg-violet-500/15 text-violet-100",
    metric: "text-violet-200",
    cta: "text-violet-200/90",
    ctaHover: "group-hover:text-violet-100",
    activeRing: "active:ring-2 active:ring-violet-400/40",
    sheetShadow: "shadow-[0_30px_80px_-45px_rgba(139,92,246,0.5)]",
    headerBar: "border-b border-violet-400/20",
    headerDot: "bg-violet-400",
    impactBox: "border-violet-400/25 bg-violet-500/[0.08]",
    impactTitle: "text-violet-200/90",
    footerBorder: "border-violet-400/20",
    footerBg: "bg-violet-950/30",
  },
  distribute_tasks: {
    cardBorder: "border-amber-400/35",
    cardBorderHover: "hover:border-amber-300/55 active:border-amber-300/60",
    cardGlow:
      "shadow-[0_0_28px_-8px_rgba(245,158,11,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
    cardGradient:
      "bg-gradient-to-br from-amber-500/[0.12] via-[#0a1628]/90 to-[#070d20]/95",
    cardHighlight: "before:bg-[radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.22),transparent_55%)]",
    iconWrap: "bg-amber-500/15 border-amber-400/35",
    iconColor: "text-amber-300",
    badge: "border-amber-400/35 bg-amber-500/15 text-amber-100",
    metric: "text-amber-200",
    cta: "text-amber-200/90",
    ctaHover: "group-hover:text-amber-100",
    activeRing: "active:ring-2 active:ring-amber-400/40",
    sheetShadow: "shadow-[0_30px_80px_-45px_rgba(245,158,11,0.45)]",
    headerBar: "border-b border-amber-400/20",
    headerDot: "bg-amber-400",
    impactBox: "border-amber-400/25 bg-amber-500/[0.08]",
    impactTitle: "text-amber-200/90",
    footerBorder: "border-amber-400/20",
    footerBg: "bg-amber-950/25",
  },
  performance_review: {
    cardBorder: "border-emerald-400/35",
    cardBorderHover: "hover:border-emerald-300/55 active:border-emerald-300/60",
    cardGlow:
      "shadow-[0_0_28px_-8px_rgba(52,211,153,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
    cardGradient:
      "bg-gradient-to-br from-emerald-500/[0.12] via-[#0a1628]/90 to-[#070d20]/95",
    cardHighlight: "before:bg-[radial-gradient(circle_at_100%_0%,rgba(52,211,153,0.22),transparent_55%)]",
    iconWrap: "bg-emerald-500/15 border-emerald-400/35",
    iconColor: "text-emerald-300",
    badge: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
    metric: "text-emerald-200",
    cta: "text-emerald-200/90",
    ctaHover: "group-hover:text-emerald-100",
    activeRing: "active:ring-2 active:ring-emerald-400/40",
    sheetShadow: "shadow-[0_30px_80px_-45px_rgba(52,211,153,0.45)]",
    headerBar: "border-b border-emerald-400/20",
    headerDot: "bg-emerald-400",
    impactBox: "border-emerald-400/25 bg-emerald-500/[0.08]",
    impactTitle: "text-emerald-200/90",
    footerBorder: "border-emerald-400/20",
    footerBg: "bg-emerald-950/30",
  },
};

export function accentForAction(id: LeadershipActionId): LeadershipActionAccent {
  return LEADERSHIP_ACTION_ACCENTS[id];
}
