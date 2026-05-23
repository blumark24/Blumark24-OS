"use client";

import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Activity, Bot, Clock, ListChecks, Plus, Sparkles, ArrowLeft, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { WS_TINTS, type KpiAccent } from "@/components/ui/workspaceVisual";
import { QuickActionTile } from "@/components/ui/workspaceUi";
import { useDashboardUi } from "./DashboardUiProvider";
import {
  DASH_AI_PILL,
  DASH_BODY,
  DASH_CARD,
  DASH_ICON_ORB,
  DASH_MUTED,
  DASH_SUBTLE,
  DASH_SURFACE,
  DASH_TITLE,
  dashChartTooltipStyle,
} from "./dashboardTokens";

const CHART_TICK = { fill: "var(--dash-text-secondary)", fontSize: 11 };

export function DashboardPremiumEmpty({
  title,
  subtitle,
  hint,
  accent = "cyan" as KpiAccent,
  className,
}: {
  title?: string;
  subtitle?: string;
  hint?: string;
  accent?: KpiAccent;
  className?: string;
}) {
  const { copy } = useDashboardUi();
  const e = copy.empty;
  const t = WS_TINTS[accent];
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-10 text-center", className)}>
      <span className={cn(DASH_ICON_ORB, "h-12 w-12", t.orb)}>
        <Activity size={22} className={t.icon} />
      </span>
      <p className={cn("text-sm font-semibold", DASH_TITLE)}>{title ?? e.title}</p>
      <p className={cn(DASH_MUTED, "max-w-xs text-xs")}>{subtitle ?? e.subtitle}</p>
      <p className={cn("text-[11px] text-[var(--dash-text-accent)] opacity-70")}>{hint ?? e.hint}</p>
    </div>
  );
}

export function DashboardTaskDistribution({
  completed,
  pending,
  overdue,
  total,
  pct,
}: {
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  pct: (n: number) => string;
}) {
  const { copy } = useDashboardUi();
  const s = copy.sections.taskDistribution;
  const empty = total === 0;

  return (
    <div className={cn(DASH_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0 dash-section-header">
          <h3 className={cn(DASH_TITLE, "text-sm")}>{s.title}</h3>
          <p className={cn("mt-0.5 text-[11px]", DASH_SUBTLE)}>{s.subtitle}</p>
        </div>
        <span className={cn(DASH_ICON_ORB, "h-9 w-9 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/25")}>
          <ListChecks size={16} className="text-cyan-300" />
        </span>
      </div>

      {empty ? (
        <DashboardPremiumEmpty accent="amber" className="py-6" />
      ) : (
        <>
          <div className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              {completed > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="3"
                  strokeDasharray={`${(completed / total) * 97} 97`}
                  strokeLinecap="round"
                />
              )}
              {pending > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray={`${(pending / total) * 97} 97`}
                  strokeDashoffset={`${-(completed / total) * 97}`}
                  strokeLinecap="round"
                />
              )}
              {overdue > 0 && (
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="3"
                  strokeDasharray={`${(overdue / total) * 97} 97`}
                  strokeDashoffset={`${-((completed + pending) / total) * 97}`}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-xl font-bold", DASH_TITLE)}>{total}</span>
              <span className={cn("text-[10px]", DASH_MUTED)}>{s.total}</span>
            </div>
          </div>

          <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[var(--dash-surface-inset)]">
            <div className="bg-emerald-400/85" style={{ width: pct(completed) }} />
            <div className="bg-amber-400/85" style={{ width: pct(pending) }} />
            <div className="bg-rose-400/85" style={{ width: pct(overdue) }} />
          </div>

          <div className="space-y-2.5">
            {[
              { label: s.completed, value: completed, dot: "bg-emerald-400", hint: s.hints.completed },
              { label: s.pending, value: pending, dot: "bg-amber-400", hint: s.hints.pending },
              { label: s.overdue, value: overdue, dot: "bg-rose-400", hint: s.hints.overdue },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                <span className={cn("flex min-w-0 items-center gap-2", DASH_MUTED)}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", row.dot)} />
                  <span>
                    {row.label}
                    <span className="me-1.5 ms-1.5 text-[10px] opacity-40">· {row.hint}</span>
                  </span>
                </span>
                <span className={cn("shrink-0 font-bold", DASH_TITLE)}>{row.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardAnalytics({
  salesData,
  currentYear,
  hasRevenueData,
  customTooltip,
}: {
  salesData: { month: string; current: number; previous: number }[];
  currentYear: number;
  hasRevenueData: boolean;
  customTooltip: React.ReactElement;
}) {
  const { copy } = useDashboardUi();
  const a = copy.sections.analytics;

  return (
    <div className={cn(DASH_CARD, "p-4 sm:p-5 lg:col-span-2")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2 dash-section-header">
        <div>
          <h3 className={DASH_TITLE}>{a.title}</h3>
          <p className={cn("mt-0.5 text-[11px]", DASH_SUBTLE)}>{a.subtitle}</p>
        </div>
        <span className={cn("rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2 py-1 text-xs", DASH_MUTED)}>
          {a.period}
        </span>
      </div>

      {!hasRevenueData ? (
        <DashboardPremiumEmpty accent="cyan" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-chart-grid)" />
            <XAxis dataKey="month" tick={CHART_TICK} />
            <YAxis tick={CHART_TICK} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={customTooltip} />
            <Legend formatter={(v) => (v === "current" ? String(currentYear) : String(currentYear - 1))} />
            <Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" />
            <Line
              type="monotone"
              dataKey="previous"
              stroke="#1e3a5f"
              strokeWidth={1.5}
              dot={false}
              name="previous"
              strokeDasharray="4 2"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DashboardActivityFeed({
  loading,
  activities,
  activityIcons,
}: {
  loading: boolean;
  activities: { id: string; description: string; type: string; timestamp: string | Date }[];
  activityIcons: Record<string, ReactNode>;
}) {
  const { copy } = useDashboardUi();
  const act = copy.sections.activity;
  const e = copy.empty;

  return (
    <div className={cn(DASH_CARD, "flex flex-col p-4 sm:p-5")}>
      <div className="mb-4 dash-section-header">
        <h3 className={cn(DASH_TITLE, "text-sm")}>{act.title}</h3>
        <p className={cn("mt-0.5 text-[11px]", DASH_SUBTLE)}>{act.subtitle}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--dash-surface-inset)]" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <DashboardPremiumEmpty
          title={e.activityTitle}
          subtitle={e.activitySubtitle}
          hint={e.activityHint}
          accent="violet"
          className="py-6"
        />
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] p-2.5 transition-colors hover:border-[var(--dash-border-strong)]"
            >
              <div className={cn(DASH_ICON_ORB, "h-9 w-9 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/20 text-[var(--dash-accent-cyan)]")}>
                {activityIcons[activity.type] ?? <Activity size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm leading-snug", DASH_TITLE)}>{activity.description}</p>
                <div className={cn("mt-1 flex items-center gap-1 text-[11px]", DASH_SUBTLE)}>
                  <Clock size={10} />
                  <span>{timeAgo(String(activity.timestamp))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardInsightsSection({
  insights,
  showInternalEmployees,
  employeeNames,
}: {
  insights: { icon: ElementType; tint: KpiAccent; text: string }[];
  showInternalEmployees: boolean;
  employeeNames: string[];
}) {
  const { copy, isRtl } = useDashboardUi();
  const ins = copy.insights;

  return (
    <section className={cn(DASH_SURFACE, "p-4 sm:p-5 md:p-6")}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_92%_-20%,rgba(124,58,237,0.16),transparent_55%),radial-gradient(110%_120%_at_5%_120%,rgba(34,211,238,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center sm:w-20",
            isRtl ? "order-first sm:order-last" : "order-first sm:order-first",
          )}
        >
          <div className="relative grid h-16 w-16 place-items-center rounded-full bg-violet-500/10 ring-1 ring-violet-300/25">
            <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.45),transparent_70%)] blur-md" />
            <Bot size={28} className="relative text-violet-200" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles size={16} className="shrink-0 text-violet-300" />
              <div className="min-w-0 dash-section-header">
                <h2 className={cn(DASH_TITLE, "text-sm")}>{ins.title}</h2>
                <p className={cn("text-[11px]", DASH_SUBTLE)}>{ins.subtitle}</p>
              </div>
            </div>
            <Link href="/ai" className={cn("shrink-0", DASH_AI_PILL)}>
              {ins.viewAll} <ArrowLeft size={14} className={isRtl ? "" : "rotate-180"} />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="flex min-w-0 items-start gap-2.5 rounded-2xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] p-3 backdrop-blur-sm"
              >
                <span className={cn(DASH_ICON_ORB, "h-8 w-8 shrink-0", WS_TINTS[insight.tint].orb)}>
                  <insight.icon size={15} className={WS_TINTS[insight.tint].icon} />
                </span>
                <p className={cn("min-w-0 text-sm leading-snug", DASH_BODY)}>{insight.text}</p>
              </li>
            ))}
          </ul>
          {showInternalEmployees && employeeNames.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn("text-[11px]", DASH_MUTED)}>{ins.activeEmployeesLabel}</span>
              {employeeNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2.5 py-1 text-[11px] text-[var(--dash-text-primary)] opacity-90"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function DashboardQuickActions({
  actions,
}: {
  actions: { href: string; label: string; icon: ElementType; tint: KpiAccent }[];
}) {
  const { copy } = useDashboardUi();
  const q = copy.sections.quickActions;

  return (
    <section className={cn(DASH_SURFACE, "p-4 sm:p-5 md:p-6")}>
      <div className="mb-4 dash-section-header">
        <h2 className={cn(DASH_TITLE, "text-sm")}>{q.title}</h2>
        <p className={cn("text-[11px]", DASH_SUBTLE)}>{q.subtitle}</p>
      </div>
      <div className="flex items-stretch gap-3">
        <Link
          href="/tasks"
          aria-label={q.create}
          className="grid h-auto min-h-[72px] w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_14px_34px_-12px_rgba(124,58,237,0.75)] transition hover:opacity-90 sm:w-16"
        >
          <Plus size={26} strokeWidth={2.2} />
        </Link>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map((a) => (
            <QuickActionTile key={a.label} href={a.href} label={a.label} icon={a.icon} tint={a.tint} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardDeptChart({
  data,
  activeCount,
}: {
  data: { date: string; users: number }[];
  activeCount: number;
}) {
  const { copy } = useDashboardUi();
  const d = copy.sections.dept;
  const tooltipStyle = dashChartTooltipStyle();

  return (
    <div className={cn(DASH_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between dash-section-header">
        <div>
          <h3 className={cn(DASH_TITLE, "text-sm")}>{d.title}</h3>
          <p className={cn("text-[11px]", DASH_SUBTLE)}>{d.subtitle}</p>
        </div>
        <span className={cn("rounded-lg bg-[var(--dash-surface-inset)] px-2 py-1 text-xs", DASH_MUTED)}>
          {d.active(activeCount)}
        </span>
      </div>
      {data.length === 0 ? (
        <DashboardPremiumEmpty accent="cyan" className="py-4" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-chart-grid)" />
            <XAxis dataKey="date" tick={{ ...CHART_TICK, fontSize: 10 }} />
            <YAxis tick={CHART_TICK} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--dash-text-secondary)" }} cursor={{ fill: "var(--dash-surface-inset)" }} />
            <Bar dataKey="users" fill="#1e6fd9" radius={[6, 6, 0, 0]} name="موظف نشط" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function DashboardSummaryCard({
  employeesCount,
  activeEmployees,
  clientsCount,
  netProfit,
}: {
  employeesCount: number;
  activeEmployees: number;
  clientsCount: number;
  netProfit: number;
}) {
  const { copy } = useDashboardUi();
  const s = copy.sections.summary;

  return (
    <div className={cn(DASH_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={cn(DASH_TITLE, "text-sm")}>{s.title}</h3>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
          {s.live}
        </span>
      </div>
      <div className="space-y-3">
        {[
          [s.totalEmployees, String(employeesCount), DASH_TITLE],
          [s.activeEmployees, String(activeEmployees), "text-emerald-400"],
          [s.totalClients, String(clientsCount), "text-[var(--dash-accent-cyan)]"],
          [s.netIncome, `${formatCurrency(netProfit)} SAR`, netProfit >= 0 ? "text-emerald-400" : "text-rose-400"],
        ].map(([label, val, color]) => (
          <div key={String(label)} className="flex items-center justify-between border-b border-[var(--dash-border-glass)] py-2 last:border-0">
            <span className={cn("text-xs", DASH_MUTED)}>{label}</span>
            <span className={cn("text-sm font-bold", color)}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSatisfactionRing({ pct, clientsLine }: { pct: number; clientsLine: string }) {
  const { copy } = useDashboardUi();
  const sat = copy.sections.satisfaction;
  const label =
    pct >= 70 ? sat.excellent : pct >= 40 ? sat.average : sat.needsWork;

  return (
    <div className={cn(DASH_CARD, "flex flex-col items-center justify-center p-4 sm:p-5")}>
      <h3 className={cn("mb-1 text-sm", DASH_MUTED)}>{sat.title}</h3>
      <p className={cn("mb-4 text-[10px]", DASH_SUBTLE)}>{sat.subtitle}</p>
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="url(#dashSatGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50 * (pct / 100)} ${2 * Math.PI * 50 * (1 - pct / 100)}`}
          />
          <defs>
            <linearGradient id="dashSatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-heading font-bold sm:text-3xl", DASH_TITLE)}>{pct}%</span>
          <span
            className="text-[10px] font-medium"
            style={{ color: pct >= 70 ? "var(--dash-accent-emerald)" : pct >= 40 ? "var(--dash-accent-amber)" : "var(--dash-accent-rose)" }}
          >
            {label}
          </span>
        </div>
      </div>
      <p className={cn("mt-3 text-center text-xs", DASH_MUTED)}>{clientsLine}</p>
    </div>
  );
}
