/**
 * Crystal Glass workspace tokens — UI-only.
 *
 * All visual primitives consumed by the client workspace (DashboardLayout
 * subtree). Pure className strings; CSS custom properties live in
 * `workspaceTheme.css` and respond to `data-theme="dark|light"` on <html>.
 *
 * Semantic color map (consistent across every section):
 *   • cyan / sky / blue → primary, system, navigation
 *   • emerald           → success, completed, positive
 *   • amber / gold      → waiting, attention, pending
 *   • rose / red        → overdue, error, risk
 *   • violet / purple   → AI, automation, premium
 */

/* ─── Page rhythm ─────────────────────────────────────────────────────── */

/**
 * Vertical rhythm + mobile safe-area padding (bottom nav + FAB + iOS notch).
 * Uses logical properties; works in RTL today and LTR later without changes.
 */
export const WS_PAGE =
  "space-y-5 sm:space-y-6 min-w-0 max-w-full pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-6";

/* ─── Crystal levels ──────────────────────────────────────────────────── */

/** L1 — Hero / large sheet. Strongest backdrop, prism gradient fill. */
export const WS_HERO = "crystal crystal-l1 overflow-hidden rounded-[28px]";

/** L2 — Default glass card (KPIs without accent, panels, tables). */
export const WS_CARD = "crystal crystal-l2 overflow-hidden rounded-[24px]";

/** L1 alias (kept for backward compat with existing imports). */
export const WS_SURFACE = "crystal crystal-l1 overflow-hidden rounded-[28px]";

/** L3 — Accent KPI body. Combine with `WS_ACCENT(accent)` for prism wash. */
export const WS_CARD_ACCENT =
  "crystal crystal-l3 overflow-hidden rounded-[24px]";

/** L4 — Floating chrome: bottom nav, FAB menu, popovers. */
export const WS_FLOAT = "crystal crystal-l4 overflow-hidden rounded-2xl";

/** L5 — Modal dialog body. */
export const WS_GLASS_MODAL =
  "crystal crystal-l5 w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto";

/** Inset / nested surface (table body, kanban column inside a card). */
export const WS_INSET =
  "rounded-2xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-2)]";

/* ─── Typography ──────────────────────────────────────────────────────── */

export const WS_SECTION_TITLE =
  "font-heading font-semibold text-[color:var(--ws-text-primary)]";
export const WS_MUTED   = "text-[color:var(--ws-text-secondary)]";
export const WS_SUBTEXT = "text-[color:var(--ws-text-tertiary)]";

/* ─── Icon orbs ───────────────────────────────────────────────────────── */

/**
 * Base orb (icon tile). Compose with accent class:
 *   <span className={`${WS_ICON_ORB} w-10 h-10 ${orbAccent('cyan')}`} />
 */
export const WS_ICON_ORB =
  "grid place-items-center rounded-2xl backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

/* ─── AI pill (violet/cyan prism) ─────────────────────────────────────── */

export const WS_AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--ws-violet-ring)] ws-ai-prism px-3 py-1.5 text-xs font-medium text-[color:var(--ws-text-primary)] transition-colors hover:opacity-90";

/** Live status pill (paired with an accent theme). */
export const WS_LIVE_PILL =
  "inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium";

/* ─── Accent system ───────────────────────────────────────────────────── */

export type KpiAccent =
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "sky";

export type KpiTheme = {
  /* Crystal accent (outer glow + box-shadow) — apply on the card root */
  card: string;
  /* Inner soft prism wash, absolutely positioned <div className="ws-accent-wash absolute inset-0" /> */
  wash: string;
  /* Orb fill + ring */
  orb: string;
  /* Icon color (text-*) */
  iconColor: string;
  /* Subtle text accent (footer / live pill text) */
  accent: string;
  /* Full live pill (with bg, color, ring) */
  livePill: string;
  /* Icon tile (used inside drilldown modals) */
  iconTile: string;
  /* Panel border + glow (used by drilldown modals) */
  panelBorder: string;
  /* Sparkline color */
  spark: string;
  /* Legacy aliases preserved for compatibility */
  glow: string;
  ambient: string;
};

const THEMES: Record<KpiAccent, KpiTheme> = {
  cyan: {
    card: "crystal-accent-cyan",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-cyan-soft)] ring-1 ring-[var(--ws-cyan-ring)]",
    iconColor: "text-cyan-300",
    accent: "text-cyan-200/85",
    livePill: "bg-[var(--ws-cyan-soft)] text-cyan-200 ring-1 ring-[var(--ws-cyan-ring)]",
    iconTile: "bg-[var(--ws-cyan-soft)] border border-[var(--ws-cyan-ring)]",
    panelBorder: "border-cyan-300/45 shadow-[0_0_50px_rgba(34,211,238,.18)]",
    spark: "text-cyan-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(34,211,238,0.5)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(34,211,238,0.20),transparent_55%)]",
  },
  emerald: {
    card: "crystal-accent-emerald",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-emerald-soft)] ring-1 ring-[var(--ws-emerald-ring)]",
    iconColor: "text-emerald-300",
    accent: "text-emerald-200/85",
    livePill: "bg-[var(--ws-emerald-soft)] text-emerald-200 ring-1 ring-[var(--ws-emerald-ring)]",
    iconTile: "bg-[var(--ws-emerald-soft)] border border-[var(--ws-emerald-ring)]",
    panelBorder: "border-emerald-300/45 shadow-[0_0_50px_rgba(16,185,129,.18)]",
    spark: "text-emerald-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(16,185,129,0.5)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(16,185,129,0.20),transparent_55%)]",
  },
  amber: {
    card: "crystal-accent-amber",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-amber-soft)] ring-1 ring-[var(--ws-amber-ring)]",
    iconColor: "text-amber-300",
    accent: "text-amber-200/85",
    livePill: "bg-[var(--ws-amber-soft)] text-amber-200 ring-1 ring-[var(--ws-amber-ring)]",
    iconTile: "bg-[var(--ws-amber-soft)] border border-[var(--ws-amber-ring)]",
    panelBorder: "border-amber-300/45 shadow-[0_0_50px_rgba(251,191,36,.18)]",
    spark: "text-amber-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(251,191,36,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(251,191,36,0.18),transparent_55%)]",
  },
  rose: {
    card: "crystal-accent-rose",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-rose-soft)] ring-1 ring-[var(--ws-rose-ring)]",
    iconColor: "text-rose-300",
    accent: "text-rose-200/85",
    livePill: "bg-[var(--ws-rose-soft)] text-rose-200 ring-1 ring-[var(--ws-rose-ring)]",
    iconTile: "bg-[var(--ws-rose-soft)] border border-[var(--ws-rose-ring)]",
    panelBorder: "border-rose-300/45 shadow-[0_0_50px_rgba(244,63,94,.18)]",
    spark: "text-rose-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(244,63,94,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(244,63,94,0.18),transparent_55%)]",
  },
  violet: {
    card: "crystal-accent-violet",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-violet-soft)] ring-1 ring-[var(--ws-violet-ring)]",
    iconColor: "text-violet-300",
    accent: "text-violet-200/85",
    livePill: "bg-[var(--ws-violet-soft)] text-violet-200 ring-1 ring-[var(--ws-violet-ring)]",
    iconTile: "bg-[var(--ws-violet-soft)] border border-[var(--ws-violet-ring)]",
    panelBorder: "border-violet-300/45 shadow-[0_0_50px_rgba(168,85,247,.18)]",
    spark: "text-violet-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(168,85,247,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(168,85,247,0.18),transparent_55%)]",
  },
  sky: {
    card: "crystal-accent-sky",
    wash: "ws-accent-wash",
    orb: "bg-[var(--ws-sky-soft)] ring-1 ring-[var(--ws-sky-ring)]",
    iconColor: "text-sky-300",
    accent: "text-sky-200/85",
    livePill: "bg-[var(--ws-sky-soft)] text-sky-200 ring-1 ring-[var(--ws-sky-ring)]",
    iconTile: "bg-[var(--ws-sky-soft)] border border-[var(--ws-sky-ring)]",
    panelBorder: "border-sky-300/45 shadow-[0_0_50px_rgba(56,189,248,.18)]",
    spark: "text-sky-400/70",
    glow: "shadow-[0_14px_44px_-18px_rgba(56,189,248,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(56,189,248,0.18),transparent_55%)]",
  },
};

export function kpiTheme(accent: KpiAccent): KpiTheme {
  return THEMES[accent];
}

/** Compact tint map for pills / orbs that just need {orb, icon}. */
export const WS_TINTS: Record<KpiAccent, { orb: string; icon: string }> = {
  cyan:    { orb: THEMES.cyan.orb,    icon: THEMES.cyan.iconColor },
  emerald: { orb: THEMES.emerald.orb, icon: THEMES.emerald.iconColor },
  amber:   { orb: THEMES.amber.orb,   icon: THEMES.amber.iconColor },
  rose:    { orb: THEMES.rose.orb,    icon: THEMES.rose.iconColor },
  violet:  { orb: THEMES.violet.orb,  icon: THEMES.violet.iconColor },
  sky:     { orb: THEMES.sky.orb,     icon: THEMES.sky.iconColor },
};

/* ─── Dashboard KPI board keys ────────────────────────────────────────── */

export type BoardKey =
  | "activeClients"
  | "completedTasks"
  | "incompleteTasks"
  | "overdueTasks";

export const BOARD_THEME: Record<BoardKey, KpiTheme> = {
  activeClients:   THEMES.cyan,
  completedTasks:  THEMES.emerald,
  incompleteTasks: THEMES.amber,
  overdueTasks:    THEMES.rose,
};

export const SPARK_POINTS =
  "0,24 12,18 24,21 36,10 48,15 60,6 72,13 84,9 96,16 108,8 120,14";
