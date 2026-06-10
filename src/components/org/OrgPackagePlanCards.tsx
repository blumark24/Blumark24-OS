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
      "linear-gradient(145deg, rgba(34,211,238,0.22) 0%, rgba(30,111,217,0.08) 45%, rgba(10,22,40,0.4) 100%)",
    border: "border-cyan-400/35",
    orb: "rgba(34,211,238,0.35)",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    chainClass: "text-cyan-100",
  },
  growth: {
    icon: Sparkles,
    gradient:
      "linear-gradient(145deg, rgba(168,85,247,0.28) 0%, rgba(124,58,237,0.1) 50%, rgba(10,22,40,0.45) 100%)",
    border: "border-violet-400/40",
    orb: "rgba(168,85,247,0.4)",
    badge: "bg-violet-500/15 text-violet-200 border-violet-400/35",
    chainClass: "text-violet-100",
  },
  advanced: {
    icon: Crown,
    gradient:
      "linear-gradient(145deg, rgba(255,122,61,0.26) 0%, rgba(245,158,11,0.12) 48%, rgba(10,22,40,0.5) 100%)",
    border: "border-amber-400/40",
    orb: "rgba(255,122,61,0.38)",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/35",
    chainClass: "text-amber-50",
  },
  enterprise: {
    icon: Crown,
    gradient:
      "linear-gradient(145deg, rgba(16,185,129,0.26) 0%, rgba(5,150,105,0.12) 48%, rgba(10,22,40,0.5) 100%)",
    border: "border-emerald-400/40",
    orb: "rgba(16,185,129,0.38)",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
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
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all duration-300",
        visual.border,
        active
          ? "scale-[1.02] shadow-[0_20px_50px_-20px_var(--plan-glow)]"
          : "opacity-75 hover:opacity-90",
      )}
      style={{
        background: visual.gradient,
        boxShadow: active
          ? `0 0 0 1px ${card.accent}44, 0 24px 48px -24px ${card.accent}55`
          : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute -top-10 -left-10 h-28 w-28 rounded-full blur-2xl opacity-60"
        style={{ background: visual.orb }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full blur-2xl opacity-40"
        style={{ background: card.accent }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${card.accent}44, ${card.accent}11)`,
          }}
        >
          <Icon size={18} style={{ color: card.accent }} />
        </div>
        {active && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2.5 py-1 rounded-full border",
              visual.badge,
            )}
          >
            باقتك الحالية
          </span>
        )}
      </div>

      <div className="relative mt-3">
        <div className="text-[11px] uppercase tracking-wide text-white/45 mb-1">
          باقة {card.titleAr}
        </div>
        <div
          className={cn(
            "text-sm sm:text-[15px] font-semibold leading-relaxed",
            active ? visual.chainClass : "text-white/75",
          )}
        >
          {card.chainAr.split("←").map((part, i, arr) => (
            <span key={i}>
              {part.trim()}
              {i < arr.length - 1 && (
                <span className="mx-1.5 text-white/25 font-normal" aria-hidden>
                  ←
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div
        className="relative mt-3 h-1 rounded-full overflow-hidden bg-white/[0.06]"
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: active ? "100%" : "35%",
            background: `linear-gradient(90deg, ${card.accent}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}

export default function OrgPackagePlanCards({ plan }: { plan: PlanSlug }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {PACKAGE_HIERARCHY_CARDS.map((card) => (
        <PlanCard key={card.plan} card={card} active={card.plan === plan} />
      ))}
    </div>
  );
}
