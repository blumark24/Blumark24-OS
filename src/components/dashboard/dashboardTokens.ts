/**
 * Dashboard layout & surface tokens (Tailwind + CSS variables from dashboardTheme.css).
 */

import type { BoardKey } from "@/components/ui/workspaceVisual";

/** Page shell — responsive max-width + safe-area + breakpoint spacing */
export const DASH_SHELL =
  "dashboard-shell mx-auto w-full min-w-0 max-w-[100rem] space-y-4 px-0 sm:space-y-5 md:space-y-6 lg:space-y-7";

export const DASH_PAGE_PAD =
  "pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-8";

/** KPI grid: 2-col mobile → 4-col desktop */
export const DASH_GRID_KPI =
  "grid grid-cols-2 gap-3 min-[430px]:gap-3.5 sm:gap-4 md:grid-cols-4 md:gap-5";

/** Main analytics row */
export const DASH_GRID_ANALYTICS =
  "grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3";

/** Secondary metrics row */
export const DASH_GRID_METRICS =
  "grid grid-cols-1 gap-4 min-[768px]:grid-cols-2 lg:grid-cols-3 md:gap-5";

/** Projects + activity */
export const DASH_GRID_ACTIVITY =
  "grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3";

export const DASH_CARD =
  "relative overflow-hidden rounded-[var(--dash-radius-card)] border border-[var(--dash-border-glass)] bg-[var(--dash-surface-card)] shadow-[var(--dash-glow-soft)] backdrop-blur-xl";

export const DASH_SURFACE =
  "relative overflow-hidden rounded-[var(--dash-radius-card)] border border-[var(--dash-border-glass)] bg-[var(--dash-surface-elevated)] shadow-[var(--dash-glow-soft)] backdrop-blur-xl";

export const DASH_HERO =
  "relative overflow-hidden rounded-[var(--dash-radius-card)] border border-[var(--dash-border-strong)] bg-[var(--dash-surface-glass)] shadow-[var(--dash-glow-hero)] backdrop-blur-xl";

export const DASH_TITLE = "font-heading font-semibold text-[var(--dash-text-primary)]";
export const DASH_MUTED = "text-[var(--dash-text-secondary)]";
export const DASH_SUBTLE = "text-[var(--dash-text-tertiary)]";
export const DASH_BODY = "text-[var(--dash-text-on-glass)]";

export const DASH_ICON_ORB =
  "grid place-items-center rounded-2xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm";

export const DASH_AI_PILL =
  "inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition-colors hover:bg-violet-500/15";

export const DASH_KPI_FRAME: Record<BoardKey, string> = {
  activeClients: "dash-kpi-frame--cyan",
  completedTasks: "dash-kpi-frame--emerald",
  incompleteTasks: "dash-kpi-frame--amber",
  overdueTasks: "dash-kpi-frame--rose",
};

/** Recharts tooltip inline styles (theme-aware via CSS vars) */
export function dashChartTooltipStyle() {
  return {
    background: "var(--dash-tooltip-bg)",
    border: "1px solid var(--dash-tooltip-border)",
    borderRadius: "10px",
    color: "var(--dash-text-primary)",
  };
}
