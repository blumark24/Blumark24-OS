/**
 * Shared visual tokens for the client workspace (UI-only).
 * Static Tailwind class strings — no data fetching or business logic.
 */

export const WS_PAGE =
  "space-y-5 sm:space-y-6 min-w-0 max-w-full lg:pb-6";

/** Dashboard page ambient canvas (wrap WS_PAGE content — dashboard only) */
export const WS_DASHBOARD_CANVAS = "dashboard-canvas relative min-w-0";

/** Premium card shell — deep navy glass with cyan depth */
export const WS_CARD =
  "relative overflow-hidden rounded-[22px] border border-[rgba(148,163,184,0.16)] " +
  "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_38%),linear-gradient(145deg,rgba(16,38,68,0.88),rgba(7,18,35,0.96))] " +
  "shadow-[0_18px_45px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[16px] " +
  "transition-[transform,box-shadow,border-color] duration-[220ms] ease-out";

export const WS_SURFACE =
  "relative overflow-hidden rounded-[22px] border border-[rgba(148,163,184,0.16)] " +
  "bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%),linear-gradient(150deg,rgba(13,28,52,0.94),rgba(6,17,31,0.97))] " +
  "shadow-[0_18px_45px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[16px] " +
  "transition-[transform,box-shadow,border-color] duration-[220ms] ease-out";

/** Cyan-blue ambient overlay for hero / surface sections */
export const WS_SURFACE_GLOW =
  "pointer-events-none absolute inset-0 " +
  "bg-[radial-gradient(120%_120%_at_88%_-25%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(110%_120%_at_8%_125%,rgba(30,111,217,0.12),transparent_55%)]";

/** Safe hover lift for interactive dashboard cards */
export const WS_CARD_HOVER =
  "ws-card-hover hover:-translate-y-0.5 hover:border-[rgba(34,211,238,0.34)] " +
  "hover:shadow-[0_22px_56px_rgba(0,0,0,0.32),0_0_28px_rgba(34,211,238,0.07),inset_0_1px_0_rgba(255,255,255,0.07)]";

export const WS_CARD_PADDING = "p-5 sm:p-6";

export const WS_CARD_SHEEN =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent";

export const WS_INNER_CARD =
  "rounded-2xl border border-[rgba(148,163,184,0.14)] bg-[rgba(15,35,65,0.42)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export const WS_SECTION_TITLE = "text-white font-heading font-semibold tracking-tight";
export const WS_MUTED = "text-[rgba(203,213,225,0.74)]";
export const WS_SUBTEXT = "text-[rgba(203,213,225,0.55)]";

export const WS_SECTION_HEADER_ROW = "flex items-start justify-between gap-3";
export const WS_SECTION_SUBTITLE = "text-[11px] sm:text-xs text-[rgba(203,213,225,0.55)] mt-0.5 leading-snug";

export const WS_METRIC_VALUE =
  "font-heading font-extrabold tracking-tight text-white leading-none " +
  "text-[clamp(1.875rem,4vw,2.75rem)]";

export const WS_METRIC_LABEL =
  "text-[13px] font-semibold text-[rgba(226,232,240,0.92)] leading-snug";

export const WS_STATUS_CHIP =
  "inline-flex items-center gap-1.5 min-h-[26px] px-2.5 py-0.5 rounded-full " +
  "text-[11px] font-semibold text-[rgba(226,232,240,0.92)] " +
  "bg-[rgba(15,35,65,0.62)] border border-[rgba(148,163,184,0.16)]";

export const WS_ALERT_CHIP =
  "inline-flex items-center gap-1.5 min-h-[26px] px-2.5 py-0.5 rounded-full " +
  "text-[11px] font-semibold text-[#ffb899] " +
  "bg-[rgba(255,122,61,0.12)] border border-[rgba(255,122,61,0.28)]";

export const WS_PERIOD_CHIP =
  "inline-flex items-center rounded-lg border border-[rgba(148,163,184,0.14)] " +
  "bg-[rgba(15,35,65,0.45)] px-2.5 py-1 text-[11px] font-medium text-[rgba(203,213,225,0.74)]";

export const WS_ICON_ORB =
  "grid place-items-center rounded-[15px] " +
  "bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_32%),linear-gradient(135deg,rgba(34,211,238,0.18),rgba(30,111,217,0.12))] " +
  "border border-[rgba(34,211,238,0.24)] " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_22px_rgba(34,211,238,0.08)]";

export const WS_ICON_TILE_SM = "w-8 h-8 shrink-0";
export const WS_ICON_TILE_MD = "w-11 h-11 shrink-0";

export const WS_SUMMARY_ROW =
  "flex items-center justify-between border-b border-[rgba(148,163,184,0.10)] py-2.5 last:border-0";

export const WS_TABLE_HEAD =
  "border-b border-[rgba(148,163,184,0.12)] text-[rgba(203,213,225,0.74)]";

export const WS_TABLE_ROW =
  "table-row border-b border-[rgba(148,163,184,0.08)] last:border-0";

export const WS_LIST_ROW =
  "flex items-start gap-3 border-b border-[rgba(148,163,184,0.08)] pb-3 last:border-0 last:pb-0";

export const WS_CARD_MODAL =
  "rounded-[22px] border bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_38%),linear-gradient(145deg,rgba(16,38,68,0.92),rgba(6,17,31,0.96))] " +
  "backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.06)]";

export const WS_GLASS_MODAL =
  "glass-card w-full max-w-lg rounded-2xl border border-white/[0.10] bg-[#0b1e3a]/95 p-4 sm:p-6 max-h-[90vh] overflow-y-auto";

export const WS_AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,211,238,0.28)] " +
  "bg-[rgba(34,211,238,0.08)] px-3 py-1.5 text-xs font-medium text-cyan-100 " +
  "transition-colors hover:bg-[rgba(34,211,238,0.14)] hover:border-[rgba(34,211,238,0.38)]";

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
    glow: "shadow-[0_18px_48px_-12px_rgba(34,211,238,0.38),0_0_0_1px_rgba(34,211,238,0.10)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(34,211,238,0.16),transparent_55%)]",
    orb: "bg-cyan-400/10 ring-1 ring-cyan-300/22",
    iconColor: "text-cyan-300",
    accent: "text-cyan-200/90",
    livePill: "bg-cyan-400/10 text-cyan-200 border border-cyan-300/22",
    iconTile: "border-[rgba(34,211,238,0.28)]",
    panelBorder: "border-[rgba(34,211,238,0.32)]",
    spark: "text-cyan-400/70",
  },
  emerald: {
    glow: "shadow-[0_18px_48px_-12px_rgba(16,185,129,0.34),0_0_0_1px_rgba(16,185,129,0.10)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(16,185,129,0.16),transparent_55%)]",
    orb: "bg-emerald-400/10 ring-1 ring-emerald-300/22",
    iconColor: "text-emerald-300",
    accent: "text-emerald-200/90",
    livePill: "bg-emerald-400/10 text-emerald-200 border border-emerald-300/22",
    iconTile: "border-[rgba(16,185,129,0.28)]",
    panelBorder: "border-[rgba(16,185,129,0.32)]",
    spark: "text-emerald-400/70",
  },
  amber: {
    glow: "shadow-[0_18px_48px_-12px_rgba(255,122,61,0.30),0_0_0_1px_rgba(255,122,61,0.10)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(255,122,61,0.14),transparent_55%)]",
    orb: "bg-orange-400/10 ring-1 ring-orange-300/22",
    iconColor: "text-orange-300",
    accent: "text-orange-200/90",
    livePill: "bg-orange-400/10 text-orange-200 border border-orange-300/22",
    iconTile: "border-[rgba(255,122,61,0.28)]",
    panelBorder: "border-[rgba(255,122,61,0.32)]",
    spark: "text-orange-400/70",
  },
  rose: {
    glow: "shadow-[0_18px_48px_-12px_rgba(244,63,94,0.30),0_0_0_1px_rgba(244,63,94,0.10)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(244,63,94,0.14),transparent_55%)]",
    orb: "bg-rose-400/10 ring-1 ring-rose-300/22",
    iconColor: "text-rose-300",
    accent: "text-rose-200/90",
    livePill: "bg-rose-400/10 text-rose-200 border border-rose-300/22",
    iconTile: "border-[rgba(244,63,94,0.28)]",
    panelBorder: "border-[rgba(244,63,94,0.32)]",
    spark: "text-rose-400/70",
  },
  violet: {
    glow: "shadow-[0_18px_48px_-12px_rgba(168,85,247,0.24),0_0_0_1px_rgba(168,85,247,0.08)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(168,85,247,0.10),transparent_55%)]",
    orb: "bg-violet-400/10 ring-1 ring-violet-300/18",
    iconColor: "text-violet-300",
    accent: "text-violet-200/85",
    livePill: "bg-violet-400/10 text-violet-200 border border-violet-300/18",
    iconTile: "border-[rgba(168,85,247,0.20)]",
    panelBorder: "border-[rgba(168,85,247,0.24)]",
    spark: "text-violet-400/60",
  },
  sky: {
    glow: "shadow-[0_18px_48px_-12px_rgba(56,189,248,0.32),0_0_0_1px_rgba(56,189,248,0.10)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(56,189,248,0.14),transparent_55%)]",
    orb: "bg-sky-400/10 ring-1 ring-sky-300/22",
    iconColor: "text-sky-300",
    accent: "text-sky-200/90",
    livePill: "bg-sky-400/10 text-sky-200 border border-sky-300/22",
    iconTile: "border-[rgba(56,189,248,0.28)]",
    panelBorder: "border-[rgba(56,189,248,0.32)]",
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

export type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";

export const BOARD_THEME: Record<BoardKey, KpiTheme> = {
  activeClients: KPI_THEMES.cyan,
  completedTasks: KPI_THEMES.emerald,
  incompleteTasks: KPI_THEMES.sky,
  overdueTasks: KPI_THEMES.amber,
};

export const SPARK_POINTS =
  "0,24 12,18 24,21 36,10 48,15 60,6 72,13 84,9 96,16 108,8 120,14";
