"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHero from "@/components/dashboard/DashboardHero";
import PremiumKpiCard from "@/components/dashboard/PremiumKpiCard";
import {
  DashboardTaskDistribution,
  DashboardAnalytics,
  DashboardActivityFeed,
  DashboardInsightsSection,
  DashboardQuickActions,
  DashboardDeptChart,
  DashboardSummaryCard,
  DashboardSatisfactionRing,
} from "@/components/dashboard/DashboardSections";
import { DashboardUiProvider, useDashboardUi } from "@/components/dashboard/DashboardUiProvider";
import {
  formatDashboardDate,
  tenantSafeRoleLabel,
} from "@/components/dashboard/dashboardCopy";
import {
  DASH_CARD,
  DASH_GRID_ACTIVITY,
  DASH_GRID_ANALYTICS,
  DASH_GRID_KPI,
  DASH_GRID_METRICS,
  DASH_PAGE_PAD,
  DASH_SHELL,
  DASH_TITLE,
  dashChartTooltipStyle,
} from "@/components/dashboard/dashboardTokens";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Activity,
  UserCheck, DollarSign, CheckCircle, X, Timer, Siren,
  CheckSquare, UserPlus, FileText, Wallet, BarChart3, Sparkles, ListChecks,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { BOARD_THEME, type BoardKey, type KpiAccent } from "@/components/ui/workspaceVisual";
import { WorkspaceEmptyInline } from "@/components/ui/workspaceUi";
import AgencyCommandDashboardCard from "@/components/agency/AgencyCommandDashboardCard";

const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;

const statusColors: Record<string, string> = {
  "قيد_التنفيذ": "status-pending",
  "مكتمل":       "status-completed",
  "متوقف":       "status-inactive",
};

const activityIcons: Record<string, React.ReactNode> = {
  employee: <Users size={14} />,
  task:     <CheckCircle2 size={14} />,
  client:   <UserCheck size={14} />,
  finance:  <DollarSign size={14} />,
  project:  <Activity size={14} />,
};

function CustomTooltip({
  active, payload, label,
}: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const now = new Date().getFullYear();
  const style = dashChartTooltipStyle();
  return (
    <div className="rounded-xl border p-3 text-sm backdrop-blur-md" style={style}>
      <p className="mb-1 text-[var(--dash-text-secondary)]">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "var(--dash-accent-cyan)" : "var(--dash-text-secondary)" }}>
          {entry.name === "current" ? `${now}: ` : `${now - 1}: `}{formatCurrency(entry.value)} SAR
        </p>
      ))}
    </div>
  );
}

function DashboardPageContent() {
  const { copy, dir, locale } = useDashboardUi();
  const { user, loading } = useAuth();
  const { userRole } = usePermissions();
  const { isInternal } = useTenantWorkspace();
  const { kpi, loading: kpiLoading } = useDashboardKPI();
  const { data: projects, loading: projLoad } = useProjects();
  const { data: activities, loading: actLoad } = useActivities();
  const { data: transactions } = useTransactions();
  const { data: employees } = useEmployees();
  const { data: clients } = useClients();
  const { data: tasks } = useTasks();

  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  const currentYear = new Date().getFullYear();
  const months = copy.months;

  const salesData = useMemo(() => {
    const byMonth: Record<number, number> = {};
    transactions
      .filter((t) => t.type === "دخل")
      .forEach((t) => {
        const m = new Date(t.date).getMonth();
        if (!isNaN(m)) byMonth[m] = (byMonth[m] ?? 0) + t.amount;
      });
    return months.map((month, i) => ({ month, current: byMonth[i] ?? 0, previous: 0 }));
  }, [transactions, months]);

  const hasRevenueData = useMemo(
    () => salesData.some((d) => d.current > 0),
    [salesData],
  );

  const activeUsersData = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department))).slice(0, 6);
    return depts.map((dept) => ({
      date: dept,
      users: employees.filter((e) => e.department === dept && e.status === "نشط").length,
    }));
  }, [employees]);

  const satisfactionPct = useMemo(() => {
    if (!clients.length) return 0;
    const active = clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length;
    return Math.round((active / clients.length) * 100);
  }, [clients]);

  const mappedRole = user?.role ? mapAuthRoleToUserRole(user.role) : userRole;
  const roleLabel = tenantSafeRoleLabel(locale, mappedRole ?? undefined, user?.role, isInternal, ROLE_LABELS);

  const activeEmployeeNames = useMemo(() => {
    if (!isSuperAdmin) return [];
    return employees.filter((e) => e.status === "نشط").slice(0, 3).map((e) => e.name);
  }, [employees, isSuperAdmin]);

  const latestCompletedTask = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "مكتملة");
    if (!completed.length) return null;
    return completed.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  }, [tasks]);

  const nearestDeadlineTask = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = tasks
      .filter((t) => t.status !== "مكتملة" && t.dueDate)
      .filter((t) => {
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && d.getTime() >= today.getTime();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming[0] ?? null;
  }, [tasks]);

  const mostOverdueTask = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks
      .filter((t) =>
        t.status === "متأخرة" ||
        (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < today),
      )
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return overdue[0] ?? null;
  }, [tasks]);

  function shortDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "نشط").length;
  const potentialClients = clients.filter((c) => c.status === "محتمل").length;
  const contractedClients = clients.filter((c) => c.status === "متعاقد").length;
  const pausedClients = clients.filter((c) => c.status === "متوقف").length;
  const latestClient = clients.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0] ?? null;
  const latestFiveClients = clients.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);

  const completedTasks = tasks.filter((t) => t.status === "مكتملة");
  const incompleteTasks = tasks.filter((t) => t.status !== "مكتملة");
  const overdueTasks = tasks.filter(
    (t) => t.status === "متأخرة" || (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < new Date()),
  );
  const latestFiveCompletedTasks = completedTasks.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
  const topFiveIncompleteTasks = incompleteTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);
  const topFiveOverdueTasks = overdueTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);

  const activeEmployees = employees.filter((e) => e.status === "نشط").length;

  const taskDistribution = (() => {
    const completed = completedTasks.length;
    const overdue = overdueTasks.length;
    const pending = Math.max(0, incompleteTasks.length - overdue);
    const total = tasks.length || 1;
    const pct = (n: number) => `${(n / total) * 100}%`;
    return { completed, overdue, pending, total: tasks.length, pct };
  })();

  const aiInsight =
    kpi.overdueTasks > 0
      ? copy.aiInsight.overdue(kpi.overdueTasks)
      : kpi.incompleteTasks > 0
        ? copy.aiInsight.inProgress(kpi.incompleteTasks, kpi.completedTasksPct)
        : copy.aiInsight.allDone;

  const smartInsights: { icon: React.ElementType; tint: KpiAccent; text: string }[] = [];
  if (kpi.overdueTasks > 0)
    smartInsights.push({ icon: Siren, tint: "rose", text: copy.insights.overdue(kpi.overdueTasks) });
  if (kpi.incompleteTasks > 0)
    smartInsights.push({ icon: Timer, tint: "amber", text: copy.insights.remaining(kpi.incompleteTasks) });
  smartInsights.push({ icon: CheckCircle2, tint: "emerald", text: copy.insights.completion(kpi.completedTasksPct) });
  if (kpi.activeClients > 0)
    smartInsights.push({ icon: Users, tint: "cyan", text: copy.insights.activeClients(kpi.activeClients) });

  const h = copy.hero.status;
  const operationalStatus = kpi.overdueTasks > 0 ? h.needsAttention : h.stable;
  const operationalTint: KpiAccent = kpi.overdueTasks > 0 ? "amber" : "emerald";
  const teamPerformance =
    kpi.completedTasksPct >= 80 ? h.excellent : kpi.completedTasksPct >= 50 ? h.good : kpi.completedTasksPct > 0 ? h.average : h.none;

  const [activeBoard, setActiveBoard] = useState<BoardKey | null>(null);

  const quickActions = useMemo(
    () => [
      { href: "/tasks", label: copy.sections.quickActions.items.newTask, icon: CheckSquare, tint: "cyan" as const },
      { href: "/clients", label: copy.sections.quickActions.items.newClient, icon: UserPlus, tint: "emerald" as const },
      { href: "/finance", label: copy.sections.quickActions.items.newInvoice, icon: FileText, tint: "sky" as const },
      { href: "/finance", label: copy.sections.quickActions.items.newExpense, icon: Wallet, tint: "rose" as const },
      { href: "/employees", label: copy.sections.quickActions.items.newEmployee, icon: Users, tint: "violet" as const },
      { href: "/reports", label: copy.sections.quickActions.items.newReport, icon: BarChart3, tint: "amber" as const },
    ],
    [copy],
  );

  const kpiCards = useMemo(() => {
    const k = copy.kpi;
    return [
      {
        key: "overdueTasks" as const,
        label: k.overdue.title,
        insight: k.overdue.insight,
        value: kpi.overdueTasks.toString(),
        footer: kpi.overdueTasks > 0 ? k.overdue.footerUrgent : k.overdue.footerClear,
        icon: AlertTriangle,
        iconColor: kpi.overdueTasks > 0 ? "text-rose-300" : "text-emerald-300",
      },
      {
        key: "incompleteTasks" as const,
        label: k.remaining.title,
        insight: k.remaining.insight,
        value: kpi.incompleteTasks.toString(),
        footer: k.remaining.footer(kpi.incompleteTasks, tasks.length || 0),
        icon: XCircle,
        iconColor: "text-amber-300",
      },
      {
        key: "completedTasks" as const,
        label: k.completed.title,
        insight: k.completed.insight,
        value: `${kpi.completedTasksPct}%`,
        footer: k.completed.footer,
        icon: CheckCircle2,
        iconColor: "text-emerald-300",
      },
      {
        key: "activeClients" as const,
        label: k.clients.title,
        insight: k.clients.insight,
        value: kpi.activeClients.toString(),
        footer: latestClient ? k.clients.footerLatest(latestClient.name) : k.clients.footerNone,
        icon: Users,
        iconColor: "text-cyan-300",
      },
    ];
  }, [copy, kpi, tasks.length, latestClient]);

  const kpiCopy = copy.kpi;
  const dashboardBoards = {
    activeClients: {
      summary: [
        `${copy.sections.summary.totalClients}: ${totalClients}`,
        `${kpiCopy.clients.title}: ${activeClients}`,
        `${potentialClients}`,
        latestClient ? `${latestClient.name}` : copy.modal.noData,
      ],
      detailRows: [
        [copy.sections.summary.totalClients, String(totalClients)],
        [kpiCopy.clients.title, String(activeClients)],
        ["", String(potentialClients)],
        ["", String(contractedClients)],
        ["", String(pausedClients)],
      ],
      detailList: latestFiveClients.map((c) => `${c.name} • ${c.status}${c.city ? ` • ${c.city}` : ""}`),
    },
    completedTasks: {
      summary: [
        `${kpi.completedTasksPct}%`,
        latestCompletedTask ? latestCompletedTask.title : copy.modal.noData,
      ],
      detailRows: [
        [kpiCopy.completed.title, String(completedTasks.length)],
        [copy.hero.chips.completion, `${kpi.completedTasksPct}%`],
      ],
      detailList: latestFiveCompletedTasks.map((t) => t.title),
    },
    incompleteTasks: {
      summary: [
        String(kpi.incompleteTasks),
        nearestDeadlineTask ? `${nearestDeadlineTask.title} (${shortDate(nearestDeadlineTask.dueDate)})` : copy.modal.noData,
      ],
      detailRows: [
        [kpiCopy.remaining.title, String(kpi.incompleteTasks)],
        ["Deadline", nearestDeadlineTask ? `${nearestDeadlineTask.title} (${shortDate(nearestDeadlineTask.dueDate)})` : "—"],
      ],
      detailList: topFiveIncompleteTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortDate(t.dueDate)}` : ""}`),
    },
    overdueTasks: {
      summary: [
        String(kpi.overdueTasks),
        mostOverdueTask ? mostOverdueTask.title : copy.modal.noData,
      ],
      detailRows: [
        [kpiCopy.overdue.title, String(kpi.overdueTasks)],
        [kpiCopy.overdue.insight, mostOverdueTask ? `${mostOverdueTask.title}${mostOverdueTask.dueDate ? ` (${shortDate(mostOverdueTask.dueDate)})` : ""}` : "—"],
      ],
      detailList: topFiveOverdueTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortDate(t.dueDate)}` : ""}`),
    },
  } as const;

  if (loading || !user) {
    return (
      <div className={DASH_SHELL} dir={dir}>
        <div className={cn(DASH_CARD, "h-40 animate-pulse")} />
        <div className={DASH_GRID_KPI}>
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton height={220} />
          <ChartSkeleton height={220} />
        </div>
      </div>
    );
  }

  const m = copy.modal;
  const proj = copy.sections.projects;
  const activeContracted = clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length;

  return (
    <div className={cn(DASH_SHELL, DASH_PAGE_PAD)} dir={dir}>
      <DashboardHero
        userName={user?.name ?? "..."}
        roleLabel={roleLabel}
        department={user?.department}
        dateLabel={formatDashboardDate(locale)}
        operationalStatus={operationalStatus}
        operationalTint={operationalTint}
        teamPerformance={teamPerformance}
        completionPct={kpi.completedTasksPct}
        aiInsight={aiInsight}
      />

      <div className={DASH_GRID_KPI}>
        {kpiLoading
          ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
          : kpiCards.map((card) => {
              const theme =
                card.key === "overdueTasks" && kpi.overdueTasks === 0
                  ? BOARD_THEME.completedTasks
                  : BOARD_THEME[card.key];
              return (
                <PremiumKpiCard
                  key={card.key}
                  boardKey={card.key}
                  theme={theme}
                  label={card.label}
                  insight={card.insight}
                  value={card.value}
                  footer={card.footer}
                  icon={card.icon}
                  iconColor={card.iconColor}
                  onLiveClick={() => setActiveBoard(card.key)}
                  footerExtra={
                    card.key === "incompleteTasks" ? (
                      <div className={`flex items-center gap-2 ${theme.accent}`}>
                        <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--dash-surface-inset)]">
                          <div
                            className="h-full rounded-full bg-amber-300/80"
                            style={{
                              width: `${Math.min(100, Math.max(8, (kpi.incompleteTasks / Math.max(tasks.length, 1)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="truncate">{card.footer}</span>
                      </div>
                    ) : undefined
                  }
                />
              );
            })}
      </div>

      <DashboardInsightsSection
        insights={smartInsights}
        showInternalEmployees={isSuperAdmin}
        employeeNames={activeEmployeeNames}
      />

      <AgencyCommandDashboardCard />

      <div className={DASH_GRID_ANALYTICS}>
        <DashboardAnalytics
          salesData={salesData}
          currentYear={currentYear}
          hasRevenueData={hasRevenueData}
          customTooltip={<CustomTooltip />}
        />
        <DashboardTaskDistribution
          completed={taskDistribution.completed}
          pending={taskDistribution.pending}
          overdue={taskDistribution.overdue}
          total={taskDistribution.total}
          pct={taskDistribution.pct}
        />
      </div>

      <div className={DASH_GRID_METRICS}>
        <DashboardDeptChart data={activeUsersData} activeCount={activeEmployees} />
        {kpiLoading ? (
          <div className={cn(DASH_CARD, "flex h-[280px] items-center justify-center p-5")}>
            <span className="text-xs text-[var(--dash-text-secondary)]">{copy.loading}</span>
          </div>
        ) : (
          <DashboardSatisfactionRing
            pct={satisfactionPct}
            clientsLine={copy.sections.satisfaction.clientsLine(activeContracted, clients.length)}
          />
        )}
        <DashboardSummaryCard
          employeesCount={employees.length}
          activeEmployees={activeEmployees}
          clientsCount={clients.length}
          netProfit={kpi.netProfit}
        />
      </div>

      <div className={DASH_GRID_ACTIVITY}>
        <div className={cn(DASH_CARD, "p-4 sm:p-5 lg:col-span-2")}>
          <div className="mb-4 flex items-center justify-between dash-section-header">
            <h3 className={DASH_TITLE}>{proj.title}</h3>
            <button type="button" className="text-xs text-[var(--dash-accent-cyan)] hover:underline">
              {proj.viewAll}
            </button>
          </div>
          {projLoad ? (
            <ChartSkeleton height={180} />
          ) : projects.length === 0 ? (
            <WorkspaceEmptyInline icon={ListChecks} title={copy.empty.projects} accent="violet" className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--dash-border-glass)]">
                    {proj.headers.map((h) => (
                      <th key={h} className="pb-3 text-end font-medium text-[var(--dash-text-secondary)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="table-row border-b border-[var(--dash-border-glass)] last:border-0">
                      <td className="py-3"><span className={cn("font-medium", DASH_TITLE)}>{project.name}</span></td>
                      <td className="py-3 text-[var(--dash-text-secondary)]">{project.clientName}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-20">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${project.progress}%`,
                                background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)",
                              }}
                            />
                          </div>
                          <span className="text-xs text-[var(--dash-text-secondary)]">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-xs text-[var(--dash-text-secondary)]">{formatCurrency(project.budget)} SAR</td>
                      <td className="py-3 text-xs text-[var(--dash-text-secondary)]">{project.deadline}</td>
                      <td className="py-3">
                        <span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>
                          {project.status === "قيد_التنفيذ" ? proj.inProgress : project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DashboardActivityFeed loading={actLoad} activities={activities} activityIcons={activityIcons} />
      </div>

      <DashboardQuickActions actions={quickActions} />

      {activeBoard && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--dash-overlay)] px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:items-center sm:p-5"
          dir={dir}
        >
          <div
            className={cn(
              "max-h-[82dvh] w-[calc(100vw-24px)] overflow-y-auto rounded-[28px] border bg-[var(--dash-surface-elevated)] p-4 backdrop-blur-2xl sm:w-full sm:max-w-4xl sm:p-6",
              BOARD_THEME[activeBoard].panelBorder,
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", BOARD_THEME[activeBoard].iconTile)}>
                  {activeBoard === "activeClients" ? <Users size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "completedTasks" ? <CheckCircle size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "incompleteTasks" ? <Timer size={20} className={BOARD_THEME[activeBoard].iconColor} /> : <AlertTriangle size={20} className={BOARD_THEME[activeBoard].iconColor} />}
                </div>
                <div className="min-w-0">
                  <h3 className={cn("truncate text-lg font-bold", DASH_TITLE)}>{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                  <p className="mt-0.5 text-xs text-[var(--dash-text-secondary)]">{m.subtitle}</p>
                  <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]", BOARD_THEME[activeBoard].livePill)}>
                    <Sparkles size={11} />{copy.kpi.live}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBoard(null)}
                aria-label={m.close}
                className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-xl border border-[var(--dash-border-glass)] text-[var(--dash-text-secondary)] hover:border-[var(--dash-border-strong)] hover:text-[var(--dash-text-primary)]"
                style={DISABLE_TEXT_SELECT_STYLE}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] p-3">
                  <span className="text-xs text-[var(--dash-text-secondary)]">{label}</span>
                  <p className={cn("mt-1 truncate text-sm font-semibold", DASH_TITLE)}>{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] p-3 sm:p-4">
              <h4 className={cn("mb-2 text-sm", DASH_TITLE)}>{m.details}</h4>
              <div className="mb-3 space-y-1 text-xs text-[var(--dash-text-secondary)]">
                {dashboardBoards[activeBoard].summary.map((line) => <p key={line} className="truncate">{line}</p>)}
              </div>
              <h4 className="mb-2 text-sm text-[var(--dash-accent-cyan)]">{m.lastFive}</h4>
              {dashboardBoards[activeBoard].detailList.length === 0 ? (
                <p className="text-sm text-[var(--dash-text-secondary)]">{m.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm sm:min-w-0">
                    <thead>
                      <tr className="border-b border-[var(--dash-border-glass)] text-[var(--dash-text-secondary)]">
                        <th className="pb-2 text-end font-medium">{m.status.client}</th>
                        <th className="pb-2 text-end font-medium">{copy.hero.chips.operational}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardBoards[activeBoard].detailList.map((item) => (
                        <tr key={item} className="border-b border-[var(--dash-border-glass)] last:border-0">
                          <td className="py-2 text-[var(--dash-text-primary)] opacity-90">{item.split("•")[0].trim()}</td>
                          <td className="py-2">
                            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px]", BOARD_THEME[activeBoard].livePill)}>
                              {activeBoard === "overdueTasks" ? m.status.critical : activeBoard === "completedTasks" ? m.status.done : activeBoard === "incompleteTasks" ? m.status.progress : m.status.client}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2.5 py-1 text-[11px] text-[var(--dash-text-secondary)]">{m.export}</span>
                <span className="rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2.5 py-1 text-[11px] text-[var(--dash-text-secondary)]">{m.share}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardUiProvider>
        <DashboardPageContent />
      </DashboardUiProvider>
    </DashboardLayout>
  );
}
