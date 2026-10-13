/**
 * Shared visual tokens for the client workspace (UI-only).
 * Static Tailwind class strings — no data fetching or business logic.
 */

export const WS_PAGE =
  "space-y-3 sm:space-y-4 min-w-0 max-w-full lg:pb-5";

export const WS_CARD =
  "bm-glass-card relative overflow-hidden rounded-[14px] " +
  "transition-[transform,box-shadow,border-color] duration-200 ease-out";

export const WS_SURFACE =
  "bm-glass-surface relative overflow-hidden rounded-[16px] " +
  "transition-[transform,box-shadow,border-color] duration-200 ease-out";

/** Safe hover lift for interactive dashboard cards */
export const WS_CARD_HOVER =
  "ws-card-hover hover:-translate-y-px hover:border-ds-border-strong " +
  "hover:shadow-[0_16px_40px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.05)]";

export const WS_INNER_CARD =
  "bm-glass-inset rounded-2xl";

export const WS_SECTION_TITLE = "text-ds-text-1 font-heading font-semibold";
export const WS_MUTED = "text-ds-text-2";
export const WS_SUBTEXT = "text-ds-text-2";

export const WS_METRIC_VALUE =
  "font-heading font-extrabold tracking-tight text-ds-text-1 leading-none " +
  "text-[clamp(1.75rem,3vw,2.625rem)]";

export const WS_METRIC_LABEL =
  "text-[13px] font-medium text-ds-text-2 leading-snug";

export const WS_STATUS_CHIP =
  "inline-flex items-center gap-1.5 min-h-[26px] px-2.5 py-0.5 rounded-full " +
  "text-xs font-semibold text-ds-text-2 bm-glass-inset";

export const WS_MOBILE_PAGE =
  "mx-auto w-full max-w-md space-y-3 sm:max-w-none sm:space-y-5";

export const WS_MOBILE_TOUCH_TARGET =
  "min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70";

export const WS_ICON_ORB =
  "grid place-items-center rounded-[11px] " +
  "bg-white/[0.035] border border-ds-border-soft " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

export const WS_GLASS_MODAL =
  "bm-glass-surface w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto";

export const WS_AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/15";

export const WS_LIVE_PILL =
  "inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium";

export type KpiAccent = "cyan" | "emerald" | "amber" | "rose" | "violet" | "sky";

export type KpiTheme = {
  glow: string;
  ambient: string;
  orb: string;
  iconColor: string;
  accent: string;
  livePill: string;
  iconTile: string;
  panelBorder: string;
  spark: string;
};

const KPI_THEMES: Record<KpiAccent, KpiTheme> = {
  cyan: {
    glow: "shadow-[0_14px_34px_-14px_rgba(92,220,231,0.30)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(92,220,231,0.14),transparent_55%)]",
    orb: "bg-[#5CDCE7]/10 ring-1 ring-[#5CDCE7]/18",
    iconColor: "text-[#5CDCE7]",
    accent: "text-[#5CDCE7]",
    livePill: "bg-[#5CDCE7]/10 text-[#54C8D2] border border-[#5CDCE7]/18",
    iconTile: "border-[#5CDCE7]/20",
    panelBorder: "border-[#5CDCE7]/20",
    spark: "text-[#5CDCE7]/65",
  },
  emerald: {
    glow: "shadow-[0_14px_34px_-14px_rgba(119,222,161,0.28)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(119,222,161,0.13),transparent_55%)]",
    orb: "bg-[#77DEA1]/10 ring-1 ring-[#77DEA1]/18",
    iconColor: "text-[#77DEA1]",
    accent: "text-[#77DEA1]",
    livePill: "bg-[#77DEA1]/10 text-[#64C98A] border border-[#77DEA1]/18",
    iconTile: "border-[#77DEA1]/20",
    panelBorder: "border-[#77DEA1]/20",
    spark: "text-[#77DEA1]/65",
  },
  amber: {
    glow: "shadow-[0_14px_34px_-14px_rgba(230,194,124,0.28)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(230,194,124,0.13),transparent_55%)]",
    orb: "bg-[#E6C27C]/10 ring-1 ring-[#E6C27C]/18",
    iconColor: "text-[#E6C27C]",
    accent: "text-[#E6C27C]",
    livePill: "bg-[#E6C27C]/10 text-[#CFA95F] border border-[#E6C27C]/18",
    iconTile: "border-[#E6C27C]/20",
    panelBorder: "border-[#E6C27C]/20",
    spark: "text-[#E6C27C]/65",
  },
  rose: {
    glow: "shadow-[0_16px_40px_-12px_rgba(244,63,94,0.28),0_0_0_1px_rgba(244,63,94,0.08)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(244,63,94,0.12),transparent_55%)]",
    orb: "bg-rose-400/10 ring-1 ring-rose-300/20",
    iconColor: "text-rose-300",
    accent: "text-rose-200/85",
    livePill: "bg-rose-400/10 text-rose-200 border border-rose-300/20",
    iconTile: "border-[rgba(244,63,94,0.22)]",
    panelBorder: "border-[rgba(244,63,94,0.28)]",
    spark: "text-rose-400/60",
  },
  violet: {
    glow: "shadow-[0_14px_34px_-14px_rgba(139,120,232,0.30)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(139,120,232,0.14),transparent_55%)]",
    orb: "bg-[#8B78E8]/10 ring-1 ring-[#8B78E8]/18",
    iconColor: "text-[#8B78E8]",
    accent: "text-[#8B78E8]",
    livePill: "bg-[#8B78E8]/10 text-[#806DDB] border border-[#8B78E8]/18",
    iconTile: "border-[#8B78E8]/20",
    panelBorder: "border-[#8B78E8]/20",
    spark: "text-[#8B78E8]/65",
  },
  sky: {
    glow: "shadow-[0_16px_40px_-12px_rgba(56,189,248,0.28),0_0_0_1px_rgba(56,189,248,0.08)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(56,189,248,0.12),transparent_55%)]",
    orb: "bg-sky-400/10 ring-1 ring-sky-300/20",
    iconColor: "text-sky-300",
    accent: "text-sky-200/85",
    livePill: "bg-sky-400/10 text-sky-200 border border-sky-300/20",
    iconTile: "border-[rgba(56,189,248,0.22)]",
    panelBorder: "border-[rgba(56,189,248,0.28)]",
    spark: "text-sky-400/60",
  },
};

export function kpiTheme(accent: KpiAccent): KpiTheme {
  return KPI_THEMES[accent];
}

export const WS_TINTS: Record<KpiAccent, { orb: string; icon: string }> = {
  cyan:    { orb: KPI_THEMES.cyan.orb,    icon: KPI_THEMES.cyan.iconColor },
  emerald: { orb: KPI_THEMES.emerald.orb, icon: KPI_THEMES.emerald.iconColor },
  amber:   { orb: KPI_THEMES.amber.orb,   icon: KPI_THEMES.amber.iconColor },
  rose:    { orb: KPI_THEMES.rose.orb,    icon: KPI_THEMES.rose.iconColor },
  violet:  { orb: KPI_THEMES.violet.orb,  icon: KPI_THEMES.violet.iconColor },
  sky:     { orb: KPI_THEMES.sky.orb,     icon: KPI_THEMES.sky.iconColor },
};

// Dashboard KPI board keys (same mapping as before)
export type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";

export const BOARD_THEME: Record<BoardKey, KpiTheme> = {
  activeClients: KPI_THEMES.violet,
  completedTasks: KPI_THEMES.cyan,
  incompleteTasks: KPI_THEMES.emerald,
  overdueTasks: KPI_THEMES.amber,
};

export const SPARK_POINTS =
  "0,24 12,18 24,21 36,10 48,15 60,6 72,13 84,9 96,16 108,8 120,14";
