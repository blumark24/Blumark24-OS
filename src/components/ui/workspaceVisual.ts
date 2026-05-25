/**
 * Shared visual tokens for the client workspace (UI-only).
 * Static Tailwind class strings — no data fetching or business logic.
 */

export const WS_PAGE =
  "space-y-5 sm:space-y-6 min-w-0 max-w-full lg:pb-6";

export const WS_CARD =
  "relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#070d20]/90 lg:bg-[#070d20]/80 backdrop-blur-xl";

/** Softer premium panel — matches KPI language without heavy glow overload. */
export const WS_DASHBOARD_PANEL =
  "group relative block w-full min-w-0 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#070d20]/88 backdrop-blur-xl shadow-[0_14px_40px_-18px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-white/[0.10] hover:shadow-[0_18px_48px_-16px_rgba(34,211,238,0.10)] active:scale-[0.995] cursor-pointer touch-manipulation text-right select-none";

export const WS_DASHBOARD_PANEL_HEADER = "mb-4 sm:mb-5 flex items-center justify-between gap-3 min-w-0";

export const WS_SURFACE =
  "relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[linear-gradient(150deg,rgba(13,25,48,0.92),rgba(7,15,32,0.95))] backdrop-blur-xl";

export const WS_SECTION_TITLE = "text-white font-heading font-semibold";
export const WS_MUTED = "text-[#8ba3c7]";
export const WS_SUBTEXT = "text-[#9db1cf]";

export const WS_ICON_ORB =
  "grid place-items-center rounded-2xl backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

export const WS_GLASS_MODAL =
  "glass-card w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[#0b1e3a]/95 p-4 sm:p-6 max-h-[90vh] overflow-y-auto";

export const WS_AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition-colors hover:bg-violet-500/15";

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
    glow: "shadow-[0_18px_52px_-14px_rgba(34,211,238,0.65),0_0_0_1px_rgba(34,211,238,0.12)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(34,211,238,0.20),transparent_55%)]",
    orb: "bg-cyan-400/10 ring-1 ring-cyan-300/25",
    iconColor: "text-cyan-300",
    accent: "text-cyan-200/85",
    livePill: "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/25",
    iconTile: "bg-cyan-400/15 border border-cyan-300/30",
    panelBorder: "border-cyan-300/45 shadow-[0_0_50px_rgba(34,211,238,.18)]",
    spark: "text-cyan-400/70",
  },
  emerald: {
    glow: "shadow-[0_18px_52px_-14px_rgba(16,185,129,0.65),0_0_0_1px_rgba(16,185,129,0.12)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(16,185,129,0.20),transparent_55%)]",
    orb: "bg-emerald-400/10 ring-1 ring-emerald-300/25",
    iconColor: "text-emerald-300",
    accent: "text-emerald-200/85",
    livePill: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/25",
    iconTile: "bg-emerald-400/15 border border-emerald-300/30",
    panelBorder: "border-emerald-300/45 shadow-[0_0_50px_rgba(16,185,129,.18)]",
    spark: "text-emerald-400/70",
  },
  amber: {
    glow: "shadow-[0_18px_52px_-14px_rgba(251,191,36,0.6),0_0_0_1px_rgba(251,191,36,0.12)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(251,191,36,0.18),transparent_55%)]",
    orb: "bg-amber-400/10 ring-1 ring-amber-300/25",
    iconColor: "text-amber-300",
    accent: "text-amber-200/85",
    livePill: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/25",
    iconTile: "bg-amber-400/15 border border-amber-300/30",
    panelBorder: "border-amber-300/45 shadow-[0_0_50px_rgba(251,191,36,.18)]",
    spark: "text-amber-400/70",
  },
  rose: {
    glow: "shadow-[0_18px_52px_-14px_rgba(244,63,94,0.6),0_0_0_1px_rgba(244,63,94,0.12)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(244,63,94,0.18),transparent_55%)]",
    orb: "bg-rose-400/10 ring-1 ring-rose-300/25",
    iconColor: "text-rose-300",
    accent: "text-rose-200/85",
    livePill: "bg-rose-400/10 text-rose-200 ring-1 ring-rose-300/25",
    iconTile: "bg-rose-400/15 border border-rose-300/30",
    panelBorder: "border-rose-300/45 shadow-[0_0_50px_rgba(244,63,94,.18)]",
    spark: "text-rose-400/70",
  },
  violet: {
    glow: "shadow-[0_14px_44px_-18px_rgba(168,85,247,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(168,85,247,0.18),transparent_55%)]",
    orb: "bg-violet-400/10 ring-1 ring-violet-300/25",
    iconColor: "text-violet-300",
    accent: "text-violet-200/85",
    livePill: "bg-violet-400/10 text-violet-200 ring-1 ring-violet-300/25",
    iconTile: "bg-violet-400/15 border border-violet-300/30",
    panelBorder: "border-violet-300/45 shadow-[0_0_50px_rgba(168,85,247,.18)]",
    spark: "text-violet-400/70",
  },
  sky: {
    glow: "shadow-[0_14px_44px_-18px_rgba(56,189,248,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(56,189,248,0.18),transparent_55%)]",
    orb: "bg-sky-400/10 ring-1 ring-sky-300/25",
    iconColor: "text-sky-300",
    accent: "text-sky-200/85",
    livePill: "bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/25",
    iconTile: "bg-sky-400/15 border border-sky-300/30",
    panelBorder: "border-sky-300/45 shadow-[0_0_50px_rgba(56,189,248,.18)]",
    spark: "text-sky-400/70",
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
  activeClients: KPI_THEMES.cyan,
  completedTasks: KPI_THEMES.emerald,
  incompleteTasks: KPI_THEMES.amber,
  overdueTasks: KPI_THEMES.rose,
};

export const SPARK_POINTS =
  "0,24 12,18 24,21 36,10 48,15 60,6 72,13 84,9 96,16 108,8 120,14";
