/**
 * Premium design tokens — Sprint 2B foundation.
 *
 * Canonical source for the premium palette, spacing scale, radii, and
 * responsive breakpoints. Additive only: existing brand colors in
 * `tailwind.config.ts` and `globals.css` are not replaced. New
 * components (under `src/components/ui/premium/`) consume these
 * tokens; existing pages continue to use the legacy palette until
 * they are migrated in a later sprint.
 *
 * No business logic, no Supabase, no Auth dependencies.
 */

// ─── Palette ──────────────────────────────────────────────────────────────────

export const PREMIUM_COLORS = {
  /** Deep navy, page-level background */
  navyDeep: "#020817",
  /** Slightly lifted background for stacked surfaces */
  navyMidnight: "#071426",
  /** Royal navy for elevated surfaces, sidebar */
  navyRoyal: "#0B1F3A",
  /** Electric blue — primary accent */
  blueElectric: "#147CFF",
  /** Cyber cyan — secondary accent and AI glow */
  cyanCyber: "#00D9FF",
  /** Ice blue — soft accent for inactive chips and dividers */
  blueIce: "#7DDCFF",
  /** AI violet — reserved for AI surfaces */
  violetAi: "#7C3AED",
  /** Status: success */
  emerald: "#10B981",
  /** Status: warning */
  amber: "#F59E0B",
  /** Status: critical */
  red: "#EF4444",
  /** Secondary text */
  textMuted: "#94A3B8",
  /** Primary text */
  textPrimary: "#F8FAFC",
} as const;

export type PremiumColor = keyof typeof PREMIUM_COLORS;

// ─── Spacing ──────────────────────────────────────────────────────────────────

/** Spacing scale in px. Use with `style={{ padding: SPACING.md }}` or as a
 *  reference for Tailwind padding/margin classes. */
export const PREMIUM_SPACING = {
  xs2: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xl2: 32,
  xl3: 40,
} as const;

export type PremiumSpacing = keyof typeof PREMIUM_SPACING;

// ─── Radii ────────────────────────────────────────────────────────────────────

export const PREMIUM_RADIUS = {
  md: 12,
  lg: 16,
  xl: 24,
  xl2: 32,
  full: 9999,
} as const;

export type PremiumRadius = keyof typeof PREMIUM_RADIUS;

// ─── Breakpoints ──────────────────────────────────────────────────────────────

/** Responsive breakpoints in px, min-width based. Matches what the
 *  premium components query through Tailwind's screens config. */
export const PREMIUM_BREAKPOINTS = {
  /** 360–430 — mobile range (smartphones) */
  mobile: 360,
  /** 768–1024 — tablet range */
  tablet: 768,
  /** 1280 — laptop baseline */
  laptop: 1280,
  /** 1440 — desktop baseline */
  desktop: 1440,
  /** 1920 — wide displays */
  wide: 1920,
} as const;

export type PremiumBreakpoint = keyof typeof PREMIUM_BREAKPOINTS;

// ─── Glass card variants ──────────────────────────────────────────────────────

export type GlassCardVariant =
  | "default"
  | "critical"
  | "success"
  | "warning"
  | "ai"
  | "revenue";

/** Tailwind class string per variant. Components compose with `cn()`
 *  so callers can append layout classes. All variants share a glass
 *  base (backdrop blur + soft border) and only differ in tint. */
export const GLASS_CARD_CLASSES: Record<GlassCardVariant, string> = {
  default:
    "border border-white/10 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(2,8,23,0.4)]",
  critical:
    "border border-[#EF4444]/30 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(239,68,68,0.18)]",
  success:
    "border border-[#10B981]/30 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(16,185,129,0.18)]",
  warning:
    "border border-[#F59E0B]/30 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(245,158,11,0.18)]",
  ai:
    "border border-[#7C3AED]/30 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(124,58,237,0.22)]",
  revenue:
    "border border-[#147CFF]/30 bg-[#0B1F3A]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(20,124,255,0.22)]",
};

// ─── Button variants ──────────────────────────────────────────────────────────

export type PremiumButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "premium";

export const PREMIUM_BUTTON_CLASSES: Record<PremiumButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#147CFF] to-[#00D9FF] text-white shadow-[0_4px_18px_rgba(20,124,255,0.35)] hover:shadow-[0_6px_22px_rgba(0,217,255,0.5)]",
  secondary:
    "bg-[#0B1F3A]/70 text-[#7DDCFF] border border-[#147CFF]/30 hover:border-[#00D9FF]/60 hover:bg-[#0B1F3A]/90",
  ghost:
    "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5",
  danger:
    "bg-[#EF4444]/15 text-[#FCA5A5] border border-[#EF4444]/40 hover:bg-[#EF4444]/25 hover:text-[#FECACA]",
  premium:
    "bg-gradient-to-r from-[#7C3AED] via-[#147CFF] to-[#00D9FF] text-white shadow-[0_6px_28px_rgba(124,58,237,0.4)] hover:shadow-[0_10px_36px_rgba(0,217,255,0.55)]",
};

// ─── Status pill variants ─────────────────────────────────────────────────────

export type StatusPillVariant =
  | "active"
  | "warning"
  | "critical"
  | "neutral"
  | "premium";

export const STATUS_PILL_CLASSES: Record<StatusPillVariant, string> = {
  active:
    "bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30",
  warning:
    "bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30",
  critical:
    "bg-[#EF4444]/15 text-[#FCA5A5] border border-[#EF4444]/30",
  neutral:
    "bg-white/5 text-[#94A3B8] border border-white/10",
  premium:
    "bg-gradient-to-r from-[#7C3AED]/20 to-[#00D9FF]/20 text-[#7DDCFF] border border-[#7C3AED]/30",
};

// ─── Convenience aggregate ────────────────────────────────────────────────────

export const PREMIUM_TOKENS = {
  colors: PREMIUM_COLORS,
  spacing: PREMIUM_SPACING,
  radius: PREMIUM_RADIUS,
  breakpoints: PREMIUM_BREAKPOINTS,
} as const;
