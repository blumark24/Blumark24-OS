"use client";

import { Box, Diamond, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanSlug } from "@/lib/features/packageFeatures";
import { getOrgLimits } from "@/lib/org/orgPackageLimits";

export interface OrgPackageUsage {
  agencies: number;
  managements: number;
  departments: number;
}

interface OrgPackageCardsProps {
  activePlan: PlanSlug;
  /** Display-only usage counts (does not affect limits logic). */
  usage?: OrgPackageUsage;
}

const PLAN_ORDER: PlanSlug[] = ["basic", "growth", "advanced"];

const PLAN_META: Record<
  PlanSlug,
  {
    title: string;
    badgeDefault: string;
    icon: typeof Box;
    theme: {
      gradient: string;
      border: string;
      glow: string;
      iconBg: string;
      iconColor: string;
      progress: string;
      badge: string;
      badgeActive: string;
    };
  }
> = {
  basic: {
    title: "باقة بسيط",
    badgeDefault: "بداية مثالية",
    icon: Box,
    theme: {
      gradient:
        "linear-gradient(145deg, rgba(6, 28, 58, 0.92) 0%, rgba(8, 47, 88, 0.88) 45%, rgba(14, 116, 144, 0.22) 100%)",
      border: "rgba(34, 211, 238, 0.45)",
      glow: "0 0 48px -8px rgba(34, 211, 238, 0.55), 0 24px 48px -28px rgba(14, 116, 178, 0.45)",
      iconBg: "linear-gradient(135deg, rgba(34, 211, 238, 0.35), rgba(30, 111, 217, 0.5))",
      iconColor: "#a5f3fc",
      progress: "linear-gradient(90deg, #0e7490, #22d3ee, #67e8f9)",
      badge: "bg-cyan-500/15 text-cyan-100 border-cyan-400/35",
      badgeActive: "bg-cyan-400/25 text-cyan-50 border-cyan-300/50 shadow-[0_0_20px_rgba(34,211,238,0.35)]",
    },
  },
  growth: {
    title: "باقة نمو",
    badgeDefault: "موصى به",
    icon: TrendingUp,
    theme: {
      gradient:
        "linear-gradient(145deg, rgba(30, 18, 58, 0.94) 0%, rgba(55, 28, 110, 0.9) 50%, rgba(99, 102, 241, 0.28) 100%)",
      border: "rgba(167, 139, 250, 0.5)",
      glow: "0 0 52px -8px rgba(139, 92, 246, 0.55), 0 24px 48px -28px rgba(79, 70, 229, 0.4)",
      iconBg: "linear-gradient(135deg, rgba(167, 139, 250, 0.4), rgba(99, 102, 241, 0.55))",
      iconColor: "#ddd6fe",
      progress: "linear-gradient(90deg, #5b21b6, #8b5cf6, #a78bfa)",
      badge: "bg-violet-500/15 text-violet-100 border-violet-400/35",
      badgeActive: "bg-violet-400/25 text-violet-50 border-violet-300/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]",
    },
  },
  advanced: {
    title: "باقة متقدم",
    badgeDefault: "الأكثر مرونة",
    icon: Diamond,
    theme: {
      gradient:
        "linear-gradient(145deg, rgba(48, 28, 8, 0.94) 0%, rgba(92, 48, 12, 0.9) 48%, rgba(180, 120, 20, 0.25) 100%)",
      border: "rgba(251, 191, 36, 0.5)",
      glow: "0 0 52px -8px rgba(245, 158, 11, 0.5), 0 24px 48px -28px rgba(180, 83, 9, 0.42)",
      iconBg: "linear-gradient(135deg, rgba(251, 191, 36, 0.45), rgba(217, 119, 6, 0.55))",
      iconColor: "#fde68a",
      progress: "linear-gradient(90deg, #b45309, #f59e0b, #fcd34d)",
      badge: "bg-amber-500/15 text-amber-100 border-amber-400/35",
      badgeActive: "bg-amber-400/25 text-amber-50 border-amber-300/50 shadow-[0_0_20px_rgba(245,158,11,0.38)]",
    },
  },
};

function usageRatio(used: number, max: number): number {
  if (max <= 0) return used > 0 ? 1 : 0;
  return Math.min(1, used / max);
}

function combinedProgress(usage: OrgPackageUsage, limits: ReturnType<typeof getOrgLimits>): number {
  const parts = [
    usageRatio(usage.agencies, limits.agencies),
    usageRatio(usage.managements, limits.managements),
    usageRatio(usage.departments, limits.departments),
  ].filter((_, i) => [limits.agencies, limits.managements, limits.departments][i] > 0);
  if (parts.length === 0) return usage.departments > 0 ? 0.35 : 0.08;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function limitsLine(usage: OrgPackageUsage, limits: ReturnType<typeof getOrgLimits>): string {
  return `وكالة ${usage.agencies}/${limits.agencies} · إدارة ${usage.managements}/${limits.managements} · قسم ${usage.departments}/${limits.departments}`;
}

function badgeLabel(slug: PlanSlug, isActive: boolean): string {
  if (isActive) return "باقتك الحالية";
  return PLAN_META[slug].badgeDefault;
}

export default function OrgPackageCards({ activePlan, usage }: OrgPackageCardsProps) {
  const displayUsage: OrgPackageUsage = usage ?? { agencies: 0, managements: 0, departments: 0 };

  return (
    <section className="min-w-0 w-full max-w-5xl mx-auto" aria-labelledby="org-package-cards-heading">
      <h2
        id="org-package-cards-heading"
        className="text-white font-semibold mb-4 text-sm sm:text-base px-0.5"
      >
        اختر نمط الهيكل المناسب لك
      </h2>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-stretch min-w-0">
        {PLAN_ORDER.map((slug) => {
          const limits = getOrgLimits(slug);
          const meta = PLAN_META[slug];
          const Icon = meta.icon;
          const isActive = activePlan === slug;
          const progress = combinedProgress(displayUsage, limits);
          const progressPct = `${Math.round(progress * 100)}%`;

          return (
            <article
              key={slug}
              className={cn(
                "org-package-card relative flex flex-col min-h-[168px] rounded-[22px] border backdrop-blur-xl",
                "p-5 sm:p-6 transition-shadow duration-300",
                isActive && "org-package-card--active",
              )}
              style={{
                background: meta.theme.gradient,
                borderColor: meta.theme.border,
                boxShadow: isActive ? meta.theme.glow : "0 12px 40px -24px rgba(0,0,0,0.65)",
              }}
            >
              {/* Icon tile — top-right (RTL physical right) */}
              <div
                className="absolute top-4 right-4 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border border-white/15 shadow-lg"
                style={{ background: meta.theme.iconBg }}
                aria-hidden
              >
                <Icon size={22} style={{ color: meta.theme.iconColor }} strokeWidth={1.75} />
              </div>

              <div className="relative z-10 flex flex-col flex-1 min-w-0 pr-14 sm:pr-16 text-right">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight break-words">
                  {meta.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-white/75 leading-relaxed break-words">
                  {limits.flow}
                </p>

                <p className="mt-3 text-[11px] sm:text-xs font-medium text-white/55 tabular-nums leading-relaxed break-words">
                  {limitsLine(
                    isActive ? displayUsage : { agencies: 0, managements: 0, departments: 0 },
                    limits,
                  )}
                </p>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap",
                      isActive ? meta.theme.badgeActive : meta.theme.badge,
                    )}
                  >
                    {badgeLabel(slug, isActive)}
                  </span>
                </div>
              </div>

              {/* Glowing progress track */}
              <div
                className="org-package-progress-track mt-5 h-1.5 rounded-full overflow-hidden bg-black/25"
                role="presentation"
                aria-hidden
              >
                <div
                  className="org-package-progress-fill h-full rounded-full transition-all duration-500"
                  style={{
                    width: isActive ? progressPct : "12%",
                    background: meta.theme.progress,
                    boxShadow: `0 0 12px ${meta.theme.iconColor}`,
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
