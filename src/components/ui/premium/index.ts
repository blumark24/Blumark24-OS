/**
 * Premium UI foundation — Sprint 2B.
 *
 * Barrel export for the new design-system primitives. Adopt one
 * component at a time; the existing components under
 * `src/components/ui/` keep working unchanged.
 */

export { default as AppShell } from "./AppShell";
export type { AppShellProps } from "./AppShell";

export { default as GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { default as MetricCard } from "./MetricCard";
export type { MetricCardProps } from "./MetricCard";

export { default as StatusPill } from "./StatusPill";
export type { StatusPillProps } from "./StatusPill";

export { default as SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export { default as QuickActionButton } from "./QuickActionButton";
export type { QuickActionButtonProps } from "./QuickActionButton";

export { default as EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { default as LoadingState } from "./LoadingState";
export type { LoadingStateProps } from "./LoadingState";

export { default as ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export { default as PremiumButton } from "./PremiumButton";
export type { PremiumButtonProps } from "./PremiumButton";

export { default as PremiumInput } from "./PremiumInput";
export type { PremiumInputProps } from "./PremiumInput";

export { default as PremiumTableShell } from "./PremiumTableShell";
export type { PremiumTableShellProps } from "./PremiumTableShell";

export { default as ResponsiveGrid } from "./ResponsiveGrid";
export type { ResponsiveGridProps } from "./ResponsiveGrid";

export { default as DeviceVisibilityHelper } from "./DeviceVisibilityHelper";
export type {
  DeviceVisibilityHelperProps,
  PremiumDevice,
} from "./DeviceVisibilityHelper";

export { default as AIOrbVisual } from "./AIOrbVisual";
export type { AIOrbVisualProps } from "./AIOrbVisual";

export {
  PREMIUM_COLORS,
  PREMIUM_SPACING,
  PREMIUM_RADIUS,
  PREMIUM_BREAKPOINTS,
  PREMIUM_TOKENS,
  GLASS_CARD_CLASSES,
  PREMIUM_BUTTON_CLASSES,
  STATUS_PILL_CLASSES,
} from "@/lib/design/tokens";
export type {
  PremiumColor,
  PremiumSpacing,
  PremiumRadius,
  PremiumBreakpoint,
  GlassCardVariant,
  PremiumButtonVariant,
  StatusPillVariant,
} from "@/lib/design/tokens";
