"use client";

import { Sparkles, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PACKAGE_HIERARCHY_CARDS,
  type PackageHierarchyCard,
} from "@/lib/org/packageHierarchy";
import type { PlanSlug } from "@/lib/features/packageFeatures";

const PLAN_VISUAL: Record<
  PlanSlug,
  {
    icon: typeof Sparkles;
    gradient: string;
    border: string;
    orb: string;
    badge: string;
    chainClass: string;
  }
> = {
  basic: {
    icon: Zap,
    gradient:
      "linear-gradient(145deg, rgba(34,211,238,0.16) 0%, rgba(30,111,217,0.06) 48%, rgba(10,22,40,0.36) 100%)",
    border: "border-cyan-400/25",
    orb: "rgba(34,211,238,0.24)",
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-400/25",
    chainClass: "text-cyan-100",
  },
  growth: {
    icon: Sparkles,
    gradient:
      "linear-gradient(145deg, rgba(168,85,247,0.18) 0%, rgba(124,58,237,0.07) 52%, rgba(10,22,40,0.38) 100%)",
    border: "border-violet-400/25",
    orb: "rgba(168,85,247,0.26)",
    badge: "bg-violet-500/15 text-violet-200 border-violet-400/25",
    chainClass: "text-violet-100",
  },
  advanced: {
    icon: Crown,
    gradient:
      "linear-gradient(145deg, rgba(255,122,61,0.18) 0%, rgba(245,158,11,0.07) 50%, rgba(10,22,40,0.40) 100%)",
    border: "border-amber-400/25",
    orb: "rgba(255,122,61,0.24)",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    chainClass: "text-amber-50",
  },
  enterprise: {
    icon: Crown,
    gradient:
      "linear-gradient(145deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.07) 50%, rgba(10,22,40,0.40) 100%)",
    border: "border-emerald-400/25",
    orb: "rgba(16,185,129,0.24)",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/25",
    chainClass: "text-emerald-50",
  },
};

function PlanCard({
  card,
  active,
}: {
  card: PackageHierarchyCard;
  active: boolean;
}) {
  const visual = PLAN_VISUAL[card.plan];
  const Icon = visual.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border p-2.5 transition-all duration-200",
        "min-h-[88px] sm:min-h-[92px]",
        visual.border,
        active
          ? "shadow-[0_14px_32px_-24px_var(--plan-glow)] opacity-100"
          : "opacity-65 hover:opacity-85",
      )}
      style={{
        background: visual.gradient,
        boxShadow: active
          ? `0 0 0 1px ${card.accent}33, 0 18px 34px -26px ${card.accent}66`
          : undefined,
      }}
      aria-current={active ? "true" : undefined}
    >
      <div
        className="pointer-events-none absolute -top-8 -left-8 h-20 w-20 rounded-full blur-2xl opacity-45"
        style={{ background: visual.orb }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${card.accent}3f, ${card.accent}12)`,
            }}
          >
            <Icon size={13} style={{ color: card.accent }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-white/42">باقة</div>
            <div className="truncate text-xs font-bold text-white">{card.titleAr}</div>
          </div>
        </div>
        {active && (
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold", visual.badge)}>
            الحالية
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative mt-2 text-[11px] leading-relaxed line-clamp-2",
          active ? visual.chainClass : "text-white/68",
        )}
      >
        {card.chainAr.split("←").map((part, i, arr) => (
          <span key={i}>
            {part.trim()}
            {i < arr.length - 1 && (
              <span className="mx-1 text-white/22" aria-hidden>
                ←
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function OrgPackagePlanCards({ plan }: { plan: PlanSlug }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {PACKAGE_HIERARCHY_CARDS.map((card) => (
        <PlanCard key={card.plan} card={card} active={card.plan === plan} />
      ))}
    </div>
  );
}
