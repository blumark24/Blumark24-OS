"use client";

import { KPI_DEFINITIONS, OWNER_AI_TRACKING_DISABLED, OWNER_UNAVAILABLE_HINT } from "../_data";
import { ACCENT } from "../_accent";
import type { OwnerKpiValue } from "../_lib/ownerTruthQueries";
import { cn } from "@/lib/utils";

interface Props {
  activeOrgCount?: number;
  mrr?: OwnerKpiValue;
  staffCount?: OwnerKpiValue;
  loading?: boolean;
}

function resolveKpi(
  id: string,
  activeOrgCount: number | undefined,
  mrr: OwnerKpiValue | undefined,
  staffCount: OwnerKpiValue | undefined,
  loading: boolean,
) {
  if (loading) {
    return { display: "—", available: false, hint: null as string | null };
  }

  switch (id) {
    case "orgs":
      if (activeOrgCount === undefined) {
        return { display: "—", available: false, hint: OWNER_UNAVAILABLE_HINT };
      }
      return { display: String(activeOrgCount), available: true, hint: null };
    case "mrr":
      if (!mrr) {
        return { display: "—", available: false, hint: OWNER_UNAVAILABLE_HINT };
      }
      return {
        display: mrr.display,
        available: mrr.available,
        hint: mrr.available ? null : OWNER_UNAVAILABLE_HINT,
      };
    case "staff":
      if (!staffCount) {
        return { display: "—", available: false, hint: OWNER_UNAVAILABLE_HINT };
      }
      return {
        display: staffCount.display,
        available: staffCount.available,
        hint: staffCount.available ? null : OWNER_UNAVAILABLE_HINT,
      };
    case "ai":
      return { display: "—", available: false, hint: OWNER_AI_TRACKING_DISABLED };
    default:
      return { display: "—", available: false, hint: OWNER_UNAVAILABLE_HINT };
  }
}

export default function KpiCards({ activeOrgCount, mrr, staffCount, loading }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPI_DEFINITIONS.map((kpi) => {
        const a = ACCENT[kpi.accent];
        const Icon = kpi.icon;
        const resolved = resolveKpi(kpi.id, activeOrgCount, mrr, staffCount, loading ?? false);

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
              {!resolved.available && !loading && resolved.hint && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/[0.06] text-[#8ba3c7] max-w-[120px] text-right leading-tight">
                  {resolved.hint}
                </span>
              )}
            </div>

            <div className="relative mt-4">
              <div
                className={cn(
                  "font-heading text-2xl font-bold tracking-tight",
                  resolved.available ? "text-white" : "text-[#8ba3c7]",
                  loading && "opacity-40 animate-pulse",
                )}
              >
                {resolved.display}
              </div>
              <div className="mt-1 text-[12.5px] text-[#8ba3c7]">{kpi.label}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
