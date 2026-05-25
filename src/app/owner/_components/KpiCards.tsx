"use client";

import { KPI_DEFINITIONS } from "../_data";
import { ACCENT } from "../_accent";
import {
  AI_TRACKING_DISABLED_MSG,
  UNAVAILABLE_KPI_HINT,
  UNAVAILABLE_KPI_VALUE,
  type OwnerKpiAggregates,
} from "../_lib/ownerTruthQueries";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  kpis?: OwnerKpiAggregates;
  loading?: boolean;
}

function resolveKpiDisplay(
  id: string,
  kpis: OwnerKpiAggregates | undefined,
  loading: boolean,
): { value: string; hint: string | null; available: boolean; pulsing: boolean } {
  if (loading || !kpis) {
    return {
      value: UNAVAILABLE_KPI_VALUE,
      hint: null,
      available: false,
      pulsing: true,
    };
  }

  switch (id) {
    case "orgs":
      return {
        value: String(kpis.activeOrgCount),
        hint: null,
        available: true,
        pulsing: false,
      };
    case "mrr":
      if (kpis.monthlyRecurringRevenueSar == null) {
        return {
          value: UNAVAILABLE_KPI_VALUE,
          hint: UNAVAILABLE_KPI_HINT,
          available: false,
          pulsing: false,
        };
      }
      return {
        value: `${formatCurrency(kpis.monthlyRecurringRevenueSar)} SAR`,
        hint: null,
        available: true,
        pulsing: false,
      };
    case "staff":
      if (kpis.totalCustomerStaff == null) {
        return {
          value: UNAVAILABLE_KPI_VALUE,
          hint: UNAVAILABLE_KPI_HINT,
          available: false,
          pulsing: false,
        };
      }
      return {
        value: String(kpis.totalCustomerStaff),
        hint: null,
        available: true,
        pulsing: false,
      };
    case "ai":
      if (!kpis.aiTrackingEnabled) {
        return {
          value: UNAVAILABLE_KPI_VALUE,
          hint: AI_TRACKING_DISABLED_MSG,
          available: false,
          pulsing: false,
        };
      }
      if (kpis.aiUsageRequestCount == null) {
        return {
          value: UNAVAILABLE_KPI_VALUE,
          hint: UNAVAILABLE_KPI_HINT,
          available: false,
          pulsing: false,
        };
      }
      return {
        value: String(kpis.aiUsageRequestCount),
        hint: "طلبات مسجّلة",
        available: true,
        pulsing: false,
      };
    default:
      return {
        value: UNAVAILABLE_KPI_VALUE,
        hint: UNAVAILABLE_KPI_HINT,
        available: false,
        pulsing: false,
      };
  }
}

export default function KpiCards({ kpis, loading = false }: Props) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {KPI_DEFINITIONS.map((kpi) => {
        const a = ACCENT[kpi.accent];
        const Icon = kpi.icon;
        const display = resolveKpiDisplay(kpi.id, kpis, loading);

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
              {!display.available && !display.pulsing && display.hint && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-white/[0.06] text-[#8ba3c7] max-w-[120px] text-right leading-tight">
                  {kpi.id === "ai" ? "غير مفعّل" : UNAVAILABLE_KPI_HINT}
                </span>
              )}
            </div>

            <div className="relative mt-4">
              <div
                className={cn(
                  "font-heading text-2xl font-bold tracking-tight",
                  display.available ? "text-white" : "text-[#8ba3c7]",
                  display.pulsing && "opacity-40 animate-pulse",
                )}
              >
                {display.value}
              </div>
              <div className="mt-1 text-[12.5px] text-[#8ba3c7]">{kpi.label}</div>
              {display.hint && (
                <div className="mt-1 text-[11px] text-[#5f7798] leading-relaxed">{display.hint}</div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
