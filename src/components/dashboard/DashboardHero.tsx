"use client";

import Link from "next/link";
import { Activity, Building2, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiAccent } from "@/components/ui/workspaceVisual";
import { useDashboardUi } from "./DashboardUiProvider";
import { DASH_AI_PILL, DASH_BODY, DASH_HERO, DASH_ICON_ORB, DASH_MUTED, DASH_SUBTLE, DASH_TITLE } from "./dashboardTokens";

export type DashboardHeroProps = {
  userName: string;
  roleLabel: string;
  department?: string;
  dateLabel: string;
  operationalStatus: string;
  operationalTint: KpiAccent;
  teamPerformance: string;
  completionPct: number;
  aiInsight: string;
};

function DashStatPill({
  icon: Icon,
  label,
  value,
  tintClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tintClass: string;
}) {
  return (
    <div className="dash-stat-pill inline-flex items-center gap-2 rounded-xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2.5 py-1.5">
      <span className={cn(DASH_ICON_ORB, "h-7 w-7 shrink-0", tintClass)}>
        <Icon size={13} className="current" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className={cn("whitespace-nowrap text-[10px]", DASH_SUBTLE)}>{label}</div>
        <div className={cn("whitespace-nowrap text-[13px] font-bold", DASH_TITLE)}>{value}</div>
      </div>
    </div>
  );
}

const TINT_ORB: Record<KpiAccent, string> = {
  cyan: "text-cyan-300 bg-cyan-400/10 ring-1 ring-cyan-300/25",
  emerald: "text-emerald-300 bg-emerald-400/10 ring-1 ring-emerald-300/25",
  amber: "text-amber-300 bg-amber-400/10 ring-1 ring-amber-300/25",
  rose: "text-rose-300 bg-rose-400/10 ring-1 ring-rose-300/25",
  violet: "text-violet-300 bg-violet-400/10 ring-1 ring-violet-300/25",
  sky: "text-sky-300 bg-sky-400/10 ring-1 ring-sky-300/25",
};

export default function DashboardHero({
  userName,
  roleLabel,
  department,
  dateLabel,
  operationalStatus,
  operationalTint,
  teamPerformance,
  completionPct,
  aiInsight,
}: DashboardHeroProps) {
  const { copy } = useDashboardUi();
  const h = copy.hero;

  return (
    <section className={cn(DASH_HERO, "dashboard-hero p-4 sm:p-5 lg:p-6 xl:p-7")}>
      <div className="dashboard-hero__mesh pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--dash-gradient-hero)" }}
        aria-hidden
      />
      <div
        className="dashboard-hero__diamond pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rotate-45 rounded-3xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] blur-sm"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between xl:gap-6">
        <div className="dash-section-header min-w-0 flex-1">
          <p className={cn("text-sm", DASH_MUTED)}>{h.welcome}</p>
          <h1 className={cn("mt-0.5 truncate text-xl sm:text-2xl lg:text-[1.65rem] xl:text-3xl", DASH_TITLE)}>
            {userName}
          </h1>
          <p className={cn("mt-1 truncate text-sm", "text-[var(--dash-text-accent)]")}>{h.orgLine}</p>

          <div className={cn("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", DASH_MUTED)}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[var(--dash-accent-cyan)]" />
              {roleLabel}
            </span>
            {department ? (
              <span className="inline-flex max-w-full items-center gap-1.5">
                <Building2 size={13} className="shrink-0 text-[var(--dash-accent-cyan)]" />
                <span className="truncate">{department}</span>
              </span>
            ) : (
              <span className={DASH_SUBTLE}>{h.noDepartment}</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <DashStatPill
              icon={Activity}
              label={h.chips.operational}
              value={operationalStatus}
              tintClass={TINT_ORB[operationalTint]}
            />
            <DashStatPill
              icon={TrendingUp}
              label={h.chips.completion}
              value={`${completionPct}%`}
              tintClass={TINT_ORB.cyan}
            />
            <DashStatPill
              icon={Zap}
              label={h.chips.team}
              value={teamPerformance}
              tintClass={TINT_ORB.emerald}
            />
          </div>
        </div>

        <div className="dashboard-hero__insight w-full rounded-[var(--dash-radius-inner)] border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] p-4 backdrop-blur-md lg:max-w-[320px] lg:shrink-0 xl:max-w-[360px]">
          <div className="mb-2 flex items-center gap-2">
            <span className={cn(DASH_ICON_ORB, "h-9 w-9 shrink-0", TINT_ORB.violet)}>
              <Sparkles size={16} />
            </span>
            <div className="text-[12px] font-semibold text-[var(--dash-text-accent)]">{h.aiTitle}</div>
          </div>
          <p className={cn("text-sm leading-relaxed", DASH_BODY)}>{aiInsight}</p>
          <Link href="/ai" className={cn("mt-3", DASH_AI_PILL)}>
            {h.viewDetails}
          </Link>
        </div>
      </div>
    </section>
  );
}
