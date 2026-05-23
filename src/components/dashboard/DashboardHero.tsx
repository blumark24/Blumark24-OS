"use client";

import Link from "next/link";
import { Activity, Building2, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { WS_AI_PILL, WS_HERO_SHELL, WS_ICON_ORB, type KpiAccent } from "@/components/ui/workspaceVisual";
import { StatPill } from "@/components/ui/workspaceUi";

export type DashboardHeroProps = {
  userName: string;
  roleLabel: string;
  department?: string;
  orgLine: string;
  dateLabel: string;
  operationalStatus: string;
  operationalTint: KpiAccent;
  teamPerformance: string;
  completionPct: number;
  aiInsight: string;
};

export default function DashboardHero({
  userName,
  roleLabel,
  department,
  orgLine,
  dateLabel,
  operationalStatus,
  operationalTint,
  teamPerformance,
  completionPct,
  aiInsight,
}: DashboardHeroProps) {
  return (
    <section className={cn(WS_HERO_SHELL, "dashboard-hero p-4 sm:p-5 lg:p-6")}>
      <div className="dashboard-hero__mesh pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_92%_-15%,rgba(34,211,238,0.2),transparent_52%),radial-gradient(100%_90%_at_6%_110%,rgba(124,58,237,0.16),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rotate-45 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.03] blur-sm dashboard-hero__diamond"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#8ba3c7]">مرحباً بك 👋</p>
          <h1 className="mt-0.5 truncate text-xl font-heading font-bold text-white sm:text-2xl lg:text-[1.65rem]">
            {userName}
          </h1>
          <p className="mt-1 truncate text-sm text-cyan-200/80">{orgLine}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8ba3c7]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-cyan-300" />
              {roleLabel}
            </span>
            {department ? (
              <span className="inline-flex max-w-full items-center gap-1.5">
                <Building2 size={13} className="shrink-0 text-cyan-300" />
                <span className="truncate">{department}</span>
              </span>
            ) : (
              <span className="text-[#6b87ab]">لم يُحدد القسم بعد</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatPill icon={Activity} label="حالة التشغيل" value={operationalStatus} tint={operationalTint} />
            <StatPill icon={TrendingUp} label="معدل الإنجاز" value={`${completionPct}%`} tint="cyan" />
            <StatPill icon={Zap} label="أداء الفريق" value={teamPerformance} tint="emerald" />
          </div>
        </div>

        <div className="dashboard-hero__insight w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-md lg:max-w-[320px] lg:shrink-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={cn(WS_ICON_ORB, "h-9 w-9 shrink-0 bg-violet-400/10 ring-1 ring-violet-300/25")}>
              <Sparkles size={16} className="text-violet-300" />
            </span>
            <div className="text-[12px] font-semibold text-cyan-100/95">رؤية ذكية من النظام</div>
          </div>
          <p className="text-sm leading-relaxed text-[#dbe6f7]">{aiInsight}</p>
          <Link href="/ai" className={cn("mt-3", WS_AI_PILL)}>
            عرض التفاصيل
          </Link>
        </div>
      </div>
    </section>
  );
}
