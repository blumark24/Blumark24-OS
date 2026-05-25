"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { KPIS } from "../_data";
import { ACCENT } from "../_accent";
import { cn } from "@/lib/utils";
import type { OwnerKpiAggregates } from "../_lib/ownerQueries";

interface Props {
  activeOrgCount?: number;
  kpiAggregates?: OwnerKpiAggregates | null;
  loading?: boolean;
}

export default function KpiCards({ activeOrgCount, kpiAggregates, loading }: Props) {
  const valueOverrides: Record<string, string | undefined> = {
    orgs: activeOrgCount !== undefined ? String(activeOrgCount) : undefined,
    mrr: kpiAggregates?.mrrLabel,
    ai: kpiAggregates?.aiUsagePct,
    staff: kpiAggregates?.staffTotal,
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPIS.map((kpi) => {
        const a = ACCENT[kpi.accent];
        const Icon = kpi.icon;
        const Trend = kpi.trendUp ? TrendingUp : TrendingDown;
        const override = valueOverrides[kpi.id];
        const displayValue = override ?? kpi.value;
        const isLive = override !== undefined;
        return (
          <div
            key={kpi.id}
            className={cn(
              "glass-card glass-card-hover relative overflow-hidden p-5 border",
              a.border,
            )}
          >
            <div className={cn("pointer-events-none absolute -top-10 -left-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-60", a.ring)} />

            <div className="relative flex items-start justify-between">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", a.iconBg, a.glow)}>
                <Icon size={20} className={a.text} />
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  kpi.trendUp ? "bg-[#10b981]/12 text-[#34d399]" : "bg-[#ef4444]/12 text-[#f87171]",
                )}
              >
                <Trend size={11} />
                {isLive ? "مباشر" : kpi.trend}
              </span>
            </div>

            <div className="relative mt-4">
              <div
                className={cn(
                  "font-heading text-2xl font-bold text-white tracking-tight",
                  loading && isLive && "opacity-40 animate-pulse",
                )}
              >
                {displayValue}
              </div>
              <div className="mt-1 text-[12.5px] text-[#8ba3c7]">{kpi.label}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
