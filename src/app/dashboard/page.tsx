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
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Activity,
  UserCheck, DollarSign, CheckCircle, X, Timer, Siren,
  CheckSquare, UserPlus, FileText, Wallet, BarChart3, Sparkles, ListChecks,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";
import {
  WS_CARD, WS_SECTION_TITLE, WS_PAGE,
  BOARD_THEME, type BoardKey, type KpiAccent,
} from "@/components/ui/workspaceVisual";
import { WorkspaceEmptyInline } from "@/components/ui/workspaceUi";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = { background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" };
const DISABLE_TEXT_SELECT_STYLE = {
  WebkitUserSelect: "none",
  userSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
} as const;

const CustomTooltip = ({
  active, payload, label,
}: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const now = new Date().getFullYear();
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1f3c]/95 p-3 text-sm backdrop-blur-md">
      <p className="text-[#8ba3c7] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#22d3ee" : "#8ba3c7" }}>
          {entry.name === "current" ? `${now}: ` : `${now - 1}: `}{formatCurrency(entry.value)} SAR
        </p>
      ))}
    </div>
  );
};

const QUICK_ACTIONS: { href: string; label: string; icon: React.ElementType; tint: KpiAccent }[] = [
  { href: "/tasks",     label: "مهمة جديدة",   icon: CheckSquare, tint: "cyan"    },
  { href: "/clients",   label: "عميل جديد",    icon: UserPlus,    tint: "emerald" },
  { href: "/finance",   label: "فاتورة جديدة", icon: FileText,    tint: "sky"     },
  { href: "/finance",   label: "مصروف جديد",   icon: Wallet,      tint: "rose"    },
  { href: "/employees", label: "موظف جديد",    icon: Users,       tint: "violet"  },
  { href: "/reports",   label: "إنشاء تقرير",  icon: BarChart3,   tint: "amber"   },
];

// ─── Status colours ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  "قيد_التنفيذ": "status-pending",
  "مكتمل":       "status-completed",
  "متوقف":       "status-inactive",
};

const activityIcons: Record<string, React.ReactNode> = {
  employee: <Users       size={14} />,
  task:     <CheckCircle2 size={14} />,
  client:   <UserCheck   size={14} />,
  finance:  <DollarSign  size={14} />,
  project:  <Activity    size={14} />,
};

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// Format today's date in Arabic
function todayArabic() {
  const d = new Date();
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function tenantSafeRoleLabel(
  role: UserRole | null | undefined,
  rawRole: string | undefined,
  isInternal: boolean,
): string {
  if (isInternal && role) return ROLE_LABELS[role] ?? rawRole ?? "—";
  if (role === "organization_manager") return "مدير المنشأة";
  if (role === "employee") return "موظف";
  if (role === "finance_manager") return "مدير مالي";
  return "مدير المنشأة";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading }                      = useAuth();
  const { userRole }                           = usePermissions();
  const { isInternal }                         = useTenantWorkspace();
  const { kpi, loading: kpiLoading }           = useDashboardKPI();
  const { data: projects, loading: projLoad }  = useProjects();
  const { data: activities, loading: actLoad } = useActivities();
  const { data: transactions }                 = useTransactions();
  const { data: employees }                    = useEmployees();
  const { data: clients }                      = useClients();
  const { data: tasks }                        = useTasks();

  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  const currentYear = new Date().getFullYear();

  const salesData = useMemo(() => {
    const byMonth: Record<number, number> = {};
    transactions
      .filter((t) => t.type === "دخل")
      .forEach((t) => {
        const m = new Date(t.date).getMonth();
        if (!isNaN(m)) byMonth[m] = (byMonth[m] ?? 0) + t.amount;
      });
    return ARABIC_MONTHS.map((month, i) => ({ month, current: byMonth[i] ?? 0, previous: 0 }));
  }, [transactions]);

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
  const roleLabel = tenantSafeRoleLabel(mappedRole, user?.role, isInternal);
  const orgLine = "لوحة قيادة منشأتك — مركز العمليات الذكي";

  const activeEmployeeNames = useMemo(() => {
    if (!isSuperAdmin) return [];
    return employees
      .filter((e) => e.status === "نشط")
      .slice(0, 3)
      .map((e) => e.name);
  }, [employees, isSuperAdmin]);

  const latestCompletedTask = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "مكتملة");
    if (!completed.length) return null;
    return completed
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
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
        (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < today)
      )
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return overdue[0] ?? null;
  }, [tasks]);

  function shortArabicDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
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
  const overdueTasks = tasks.filter((t) => t.status === "متأخرة" || (t.status !== "مكتملة" && t.dueDate && new Date(t.dueDate) < new Date()));
  const latestFiveCompletedTasks = completedTasks.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
  const topFiveIncompleteTasks = incompleteTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);
  const topFiveOverdueTasks = overdueTasks.slice().sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31")).slice(0, 5);

  const activeEmployees = employees.filter((e) => e.status === "نشط").length;

  // Task distribution (derived only from existing task buckets — no new data logic).
  // Plain computation: inputs are recomputed each render, so memoization adds no value.
  const taskDistribution = (() => {
    const completed = completedTasks.length;
    const overdue = overdueTasks.length;
    const pending = Math.max(0, incompleteTasks.length - overdue);
    const total = tasks.length || 1;
    const pct = (n: number) => `${(n / total) * 100}%`;
    return { completed, overdue, pending, total: tasks.length, pct };
  })();

  // Lightweight AI insight line, derived only from existing KPI values.
  const aiInsight =
    kpi.overdueTasks > 0
      ? `لديك ${kpi.overdueTasks} مهمة متأخرة تتطلب متابعة فورية الآن.`
      : kpi.incompleteTasks > 0
        ? `${kpi.incompleteTasks} مهمة قيد التنفيذ، ومعدل الإنجاز الحالي ${kpi.completedTasksPct}%.`
        : "جميع المهام منجزة — أداء ممتاز اليوم! 🎯";

  // Rule-based Smart Insights — derived only from existing KPI values.
  // No external AI, no fabricated metrics; an insight is omitted when its data is absent.
  const smartInsights: { icon: React.ElementType; tint: KpiAccent; text: string }[] = [];
  if (kpi.overdueTasks > 0)
    smartInsights.push({ icon: Siren,        tint: "rose",    text: `لديك ${kpi.overdueTasks} مهمة متأخرة تحتاج متابعة فورية.` });
  if (kpi.incompleteTasks > 0)
    smartInsights.push({ icon: Timer,        tint: "amber",   text: `يوجد ${kpi.incompleteTasks} مهمة قيد المتابعة هذا الأسبوع.` });
  smartInsights.push({ icon: CheckCircle2,   tint: "emerald", text: `نسبة الإنجاز الحالية ${kpi.completedTasksPct}%.` });
  if (kpi.activeClients > 0)
    smartInsights.push({ icon: Users,        tint: "cyan",    text: `يوجد ${kpi.activeClients} عميل نشط حالياً.` });

  // Business-relevant hero metrics — derived ONLY from existing KPI values (no fabricated numbers).
  const operationalStatus = kpi.overdueTasks > 0 ? "يتطلب متابعة" : "مستقر";
  const operationalTint: KpiAccent = kpi.overdueTasks > 0 ? "amber" : "emerald";
  const teamPerformance = kpi.completedTasksPct >= 80
    ? "ممتاز"
    : kpi.completedTasksPct >= 50 ? "جيد" : kpi.completedTasksPct > 0 ? "متوسط" : "—";

  const [activeBoard, setActiveBoard] = useState<BoardKey | null>(null);

  const dashboardBoards = {
    activeClients: {
      summary: [
        `إجمالي العملاء: ${totalClients}`,
        `العملاء النشطون: ${activeClients}`,
        `العملاء المحتملون: ${potentialClients}`,
        latestClient ? `آخر عميل: ${latestClient.name}` : "آخر عميل: لا يوجد",
      ],
      detailRows: [
        ["إجمالي العملاء", String(totalClients)],
        ["النشطون", String(activeClients)],
        ["المحتملون", String(potentialClients)],
        ["المتعاقدون", String(contractedClients)],
        ["المتوقفون", String(pausedClients)],
      ],
      detailList: latestFiveClients.map((c) => `${c.name} • ${c.status}${c.city ? ` • ${c.city}` : ""}`),
    },
    completedTasks: {
      summary: [
        `نسبة الإنجاز: ${kpi.completedTasksPct}%`,
        latestCompletedTask ? `آخر مهمة مكتملة: ${latestCompletedTask.title}` : "آخر مهمة مكتملة: لا توجد بيانات حالياً",
      ],
      detailRows: [
        ["عدد المهام المكتملة", String(completedTasks.length)],
        ["نسبة الإنجاز", `${kpi.completedTasksPct}%`],
      ],
      detailList: latestFiveCompletedTasks.map((t) => t.title),
    },
    incompleteTasks: {
      summary: [
        `المهام غير المكتملة: ${kpi.incompleteTasks}`,
        nearestDeadlineTask ? `أقرب موعد: ${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})` : "أقرب موعد: لا يوجد",
      ],
      detailRows: [
        ["عدد المهام المتبقية", String(kpi.incompleteTasks)],
        ["أقرب deadline", nearestDeadlineTask ? `${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})` : "لا يوجد"],
      ],
      detailList: topFiveIncompleteTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortArabicDate(t.dueDate)}` : ""}`),
    },
    overdueTasks: {
      summary: [
        `المهام المتأخرة: ${kpi.overdueTasks}`,
        mostOverdueTask ? `أقدم مهمة متأخرة: ${mostOverdueTask.title}` : "أقدم مهمة متأخرة: لا توجد",
      ],
      detailRows: [
        ["عدد المهام المتأخرة", String(kpi.overdueTasks)],
        ["أقدم مهمة متأخرة", mostOverdueTask ? `${mostOverdueTask.title}${mostOverdueTask.dueDate ? ` (${shortArabicDate(mostOverdueTask.dueDate)})` : ""}` : "لا توجد"],
      ],
      detailList: topFiveOverdueTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortArabicDate(t.dueDate)}` : ""}`),
    },
  } as const;

  if (loading || !user) return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <div className="rounded-3xl border border-white/[0.06] bg-[#070d20]/70 h-40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          <ChartSkeleton height={220} />
          <ChartSkeleton height={220} />
        </div>
      </div>
    </DashboardLayout>
  );

  const kpiCards = [
    {
      key:       "overdueTasks" as const,
      label:     "المهام المتأخرة",
      insight:   "تحتاج إلى متابعة فورية",
      value:     kpi.overdueTasks.toString(),
      footer:    kpi.overdueTasks > 0 ? "تتطلب متابعة فورية" : "لا يوجد خطر حرج",
      icon:      AlertTriangle,
      iconColor: kpi.overdueTasks > 0 ? "text-rose-300" : "text-emerald-300",
    },
    {
      key:       "incompleteTasks" as const,
      label:     "المهام المتبقية",
      insight:   "عبء العمل الحالي",
      value:     kpi.incompleteTasks.toString(),
      footer:    `متبقي ${kpi.incompleteTasks} من ${tasks.length || 0}`,
      icon:      XCircle,
      iconColor: "text-amber-300",
    },
    {
      key:       "completedTasks" as const,
      label:     "المهام المكتملة",
      insight:   "مؤشر كفاءة التنفيذ",
      value:     `${kpi.completedTasksPct}%`,
      footer:    "معدل إنجاز مستقر اليوم",
      icon:      CheckCircle2,
      iconColor: "text-emerald-300",
    },
    {
      key:       "activeClients" as const,
      label:     "العملاء النشطون",
      insight:   "نشاط العملاء الحالي",
      value:     kpi.activeClients.toString(),
      footer:    latestClient ? `آخر عميل: ${latestClient.name}` : "لا يوجد عميل جديد",
      icon:      Users,
      iconColor: "text-cyan-300",
    },
  ];

  return (
    <DashboardLayout>
      <div className={WS_PAGE}>
        <DashboardHero
          userName={user?.name ?? "..."}
          roleLabel={roleLabel}
          department={user?.department}
          orgLine={orgLine}
          dateLabel={todayArabic()}
          operationalStatus={operationalStatus}
          operationalTint={operationalTint}
          teamPerformance={teamPerformance}
          completionPct={kpi.completedTasksPct}
          aiInsight={aiInsight}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
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
                          <div className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardDeptChart data={activeUsersData} activeCount={activeEmployees} />
          {kpiLoading ? (
            <div className={`${WS_CARD} flex h-[280px] items-center justify-center p-5`}>
              <span className="text-xs text-[#8ba3c7]">جارٍ التحميل...</span>
            </div>
          ) : (
            <DashboardSatisfactionRing
              pct={satisfactionPct}
              clientsLine={`${clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من ${clients.length} عميل نشط/متعاقد`}
            />
          )}
          <DashboardSummaryCard
            employeesCount={employees.length}
            activeEmployees={activeEmployees}
            clientsCount={clients.length}
            netProfit={kpi.netProfit}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`${WS_CARD} p-4 sm:p-5 lg:col-span-2`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${WS_SECTION_TITLE}`}>المشاريع النشطة</h3>
              <button className="text-xs text-[#22d3ee] hover:underline">عرض الكل</button>
            </div>
            {projLoad ? (
              <ChartSkeleton height={180} />
            ) : projects.length === 0 ? (
              <WorkspaceEmptyInline icon={ListChecks} title="لا توجد مشاريع بعد" accent="violet" className="py-8" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => (
                        <th key={h} className="pb-3 text-right font-medium text-[#8ba3c7]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="table-row border-b border-white/[0.05] last:border-0">
                        <td className="py-3"><span className="font-medium text-white">{project.name}</span></td>
                        <td className="py-3 text-[#8ba3c7]">{project.clientName}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="progress-bar w-20"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)" }} /></div>
                            <span className="text-xs text-[#8ba3c7]">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-[#8ba3c7]">{formatCurrency(project.budget)} SAR</td>
                        <td className="py-3 text-xs text-[#8ba3c7]">{project.deadline}</td>
                        <td className="py-3"><span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>{project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DashboardActivityFeed
            loading={actLoad}
            activities={activities}
            activityIcons={activityIcons}
          />
        </div>

        <DashboardQuickActions actions={QUICK_ACTIONS} />

        {/* ─── Drilldown modal (unchanged behavior) ──────────────────────── */}
        {activeBoard && (
          <div className="fixed inset-0 z-50 bg-[#030913]/65 backdrop-blur-md flex items-start sm:items-center justify-center px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5" dir="rtl">
            <div className={`w-[calc(100vw-24px)] sm:w-full sm:max-w-4xl rounded-[28px] border bg-[linear-gradient(145deg,rgba(16,29,50,.88),rgba(6,16,30,.9))] backdrop-blur-2xl p-4 sm:p-6 max-h-[82dvh] overflow-y-auto ${BOARD_THEME[activeBoard].panelBorder}`}>
              <div className="flex items-start justify-between mb-5 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${BOARD_THEME[activeBoard].iconTile}`}>
                    {activeBoard === "activeClients" ? <Users size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "completedTasks" ? <CheckCircle size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "incompleteTasks" ? <Timer size={20} className={BOARD_THEME[activeBoard].iconColor} /> : <AlertTriangle size={20} className={BOARD_THEME[activeBoard].iconColor} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                    <p className="text-[#9db1cf] text-xs mt-0.5">لوحة تنفيذية مباشرة وتفاصيل مركزة</p>
                    <span className={`inline-flex mt-2 items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${BOARD_THEME[activeBoard].livePill}`}><Sparkles size={11} />مباشر</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBoard(null)}
                  aria-label="إغلاق"
                  className="w-9 h-9 rounded-xl border border-white/15 text-[#8ba3c7] hover:text-white hover:border-white/30 inline-flex items-center justify-center touch-manipulation"
                  style={DISABLE_TEXT_SELECT_STYLE}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
                {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="text-[#8ba3c7] text-xs">{label}</span>
                    <p className="text-white text-sm font-semibold mt-1 truncate">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#071426]/55 p-3 sm:p-4">
                <h4 className="text-white text-sm mb-2">تفاصيل اللوحة</h4>
                <div className="text-xs text-[#8ba3c7] mb-3 space-y-1">
                  {dashboardBoards[activeBoard].summary.map((line) => <p key={line} className="truncate">{line}</p>)}
                </div>
                <h4 className="text-[#22d3ee] text-sm mb-2">آخر 5 عناصر</h4>
                {dashboardBoards[activeBoard].detailList.length === 0 ? (
                  <p className="text-[#8ba3c7] text-sm">لا توجد بيانات حالياً</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-white/10 text-[#8ba3c7]">
                          <th className="text-right pb-2 font-medium">العنصر</th>
                          <th className="text-right pb-2 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardBoards[activeBoard].detailList.map((item) => (
                          <tr key={item} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-white/90">{item.split("•")[0].trim()}</td>
                            <td className="py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${BOARD_THEME[activeBoard].livePill}`}>{activeBoard === "overdueTasks" ? "حرج" : activeBoard === "completedTasks" ? "مكتمل" : activeBoard === "incompleteTasks" ? "قيد التنفيذ" : "عميل"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#8ba3c7]">تصدير سريع</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#8ba3c7]">مشاركة تنفيذية</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
