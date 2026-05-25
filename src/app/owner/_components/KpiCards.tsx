"use client";

import { KPI_DEFINITIONS } from "../_data";
import { ACCENT } from "../_accent";
import { UNAVAILABLE_KPI_HINT, UNAVAILABLE_KPI_VALUE } from "../_lib/ownerTruthQueries";
import { cn } from "@/lib/utils";

interface Props {
  activeOrgCount?: number;
  loading?: boolean;
}

export default function KpiCards({ activeOrgCount, loading }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPI_DEFINITIONS.map((kpi) => {
        const a = ACCENT[kpi.accent];
        const Icon = kpi.icon;
        const isOrgKpi = kpi.id === "orgs";
        const isOrgLoading = isOrgKpi && loading;
        const hasRealOrgValue = isOrgKpi && activeOrgCount !== undefined && !loading;
        const showUnavailable = !isOrgKpi || (!hasRealOrgValue && !isOrgLoading);
        const displayValue = hasRealOrgValue ? String(activeOrgCount) : UNAVAILABLE_KPI_VALUE;
        const hint = showUnavailable && !isOrgLoading ? UNAVAILABLE_KPI_HINT : null;

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
              {showUnavailable && !isOrgLoading && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-white/[0.06] text-[#8ba3c7]">
                  {UNAVAILABLE_KPI_HINT}
                </span>
              )}
            </div>

            <div className="relative mt-4">
              <div
                className={cn(
                  "font-heading text-2xl font-bold tracking-tight",
                  hasRealOrgValue ? "text-white" : "text-[#8ba3c7]",
                  isOrgLoading && "opacity-40 animate-pulse",
                )}
              >
                {displayValue}
              </div>
              <div className="mt-1 text-[12.5px] text-[#8ba3c7]">{kpi.label}</div>
              {hint && (
                <div className="mt-1 text-[11px] text-[#5f7798]">{hint}</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
