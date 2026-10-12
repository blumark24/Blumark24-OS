"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Activity, Clock,
  UserCheck, DollarSign, CheckCircle, X, Sparkles, TrendingUp, Timer, Siren,
  CheckSquare, UserPlus, FileText, Wallet, BarChart3, ListChecks,
  ArrowLeft, ShieldCheck, Building2, Zap, Plus, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useData";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";
import {
  WS_CARD, WS_CARD_HOVER, WS_SURFACE, WS_SECTION_TITLE, WS_ICON_ORB, WS_PAGE,
  WS_STATUS_CHIP, BOARD_THEME, type BoardKey, type KpiAccent,
} from "@/components/ui/workspaceVisual";
import { QuickActionTile, WorkspaceEmptyInline } from "@/components/ui/workspaceUi";
import { PremiumMetricCard } from "@/components/ui/PremiumMetricCard";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useMyWorkContext } from "@/hooks/useMyWorkContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { PLAN_LABELS_AR } from "@/lib/features/packageFeatures";
import DashboardPulsePanel from "@/components/dashboard/DashboardPulsePanel";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = { background: "var(--bm-glass-surface)", border: "1px solid var(--bm-glass-border)", borderRadius: "10px", color: "var(--ds-text-1)" };
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
    <div className="bm-glass-surface rounded-xl p-3 text-sm">
      <p className="text-ds-text-2 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#8B5CF6" : "#5CDCE7" }}>
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

const ar = (...codePoints: number[]) => String.fromCodePoint(...codePoints);

const WORK_IDENTITY_LABELS = {
  title:                ar(0x0628,0x064A,0x0627,0x0646,0x0627,0x062A,0x0020,0x0627,0x0644,0x0639,0x0645,0x0644),
  active:               ar(0x0646,0x0634,0x0637),
  inactive:             ar(0x063A,0x064A,0x0631,0x0020,0x0646,0x0634,0x0637),
  incompleteBadge:      ar(0x064A,0x062A,0x0637,0x0644,0x0628,0x0020,0x0627,0x0633,0x062A,0x0643,0x0645,0x0627,0x0644),
  incompleteTitle:      ar(0x0628,0x064A,0x0627,0x0646,0x0627,0x062A,0x0020,0x0627,0x0644,0x0639,0x0645,0x0644,0x0020,0x0644,0x0645,0x0020,0x062A,0x064F,0x0633,0x062A,0x0643,0x0645,0x0644,0x0020,0x0628,0x0639,0x062F),
  incompleteDescription:ar(0x062A,0x064F,0x062F,0x0627,0x0631,0x0020,0x0647,0x0630,0x0647,0x0020,0x0627,0x0644,0x0628,0x064A,0x0627,0x0646,0x0627,0x062A,0x0020,0x0645,0x0646,0x0020,0x0642,0x0633,0x0645,0x0020,0x0627,0x0644,0x0645,0x0648,0x0638,0x0641,0x064A,0x0646,0x0020,0x0648,0x0627,0x0644,0x0647,0x064A,0x0643,0x0644,0x0020,0x0627,0x0644,0x0625,0x062F,0x0627,0x0631,0x064A,0x0020,0x0628,0x0648,0x0627,0x0633,0x0637,0x0629,0x0020,0x0645,0x062F,0x064A,0x0631,0x0020,0x0627,0x0644,0x0645,0x0646,0x0634,0x0623,0x0629,0x002E),
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading }                      = useAuth();
  const { userRole, hasPermission }            = usePermissions();
  const { data: dashboardSummary, loading: summaryLoading } = useDashboardSummary();

  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  const currentYear = new Date().getFullYear();
  const kpi = dashboardSummary?.kpi ?? { activeClients: 0, completedTasksPct: 0, incompleteTasks: 0, netProfit: 0, overdueTasks: 0 };
  const kpiLoading = summaryLoading;
  const projLoad = summaryLoading;
  const actLoad = summaryLoading;
  const projects = dashboardSummary?.projects.recent ?? [];
  const activities = dashboardSummary?.activities ?? [];
  const salesData = dashboardSummary?.finance.monthlyTrend ?? ARABIC_MONTHS.map((month) => ({ month, current: 0, previous: 0 }));
  const activeUsersData = dashboardSummary?.employees.activeByDepartment ?? [];
  const totalClients = dashboardSummary?.clients.total ?? 0;
  const activeClients = dashboardSummary?.clients.active ?? 0;
  const potentialClients = dashboardSummary?.clients.potential ?? 0;
  const contractedClients = dashboardSummary?.clients.contracted ?? 0;
  const pausedClients = dashboardSummary?.clients.paused ?? 0;
  const activeOrContractedClients = dashboardSummary?.clients.activeOrContracted ?? 0;
  const latestClient = dashboardSummary?.clients.latest ?? null;
  const latestFiveClients = dashboardSummary?.clients.latestFive ?? [];
  const totalTasks = dashboardSummary?.tasks.total ?? 0;
  const completedTasksCount = dashboardSummary?.tasks.completed ?? 0;
  const incompleteTasksCount = dashboardSummary?.tasks.incomplete ?? 0;
  const overdueTasksCount = dashboardSummary?.tasks.overdue ?? 0;
  const latestCompletedTask = dashboardSummary?.tasks.latestCompleted ?? null;
  const nearestDeadlineTask = dashboardSummary?.tasks.nearestDeadline ?? null;
  const mostOverdueTask = dashboardSummary?.tasks.mostOverdue ?? null;
  const latestFiveCompletedTasks = dashboardSummary?.tasks.latestFiveCompleted ?? [];
  const topFiveIncompleteTasks = dashboardSummary?.tasks.topFiveIncomplete ?? [];
  const topFiveOverdueTasks = dashboardSummary?.tasks.topFiveOverdue ?? [];
  const totalEmployees = dashboardSummary?.employees.total ?? 0;
  const activeEmployees = dashboardSummary?.employees.active ?? 0;
  const activeEmployeeNames = isSuperAdmin ? (dashboardSummary?.employees.activeNames ?? []) : [];
  const satisfactionPct = totalClients > 0 ? Math.round((activeOrContractedClients / totalClients) * 100) : 0;

  const resolvedRole = userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const roleLabel = resolvedRole
    ? getTenantRoleLabel(resolvedRole)
    : user?.role
      ? getTenantRoleLabel(mapAuthRoleToUserRole(user.role))
      : "عضو الفريق";
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const { name: companyName } = useTenantCompanyName();
  const { context: work } = useMyWorkContext();
  const { planSlug, organizationStatus } = useTenantWorkspace();

  const roleLensLabel = (() => {
    const title = String(work.jobTitle ?? "").trim();
    if (resolvedRole === "super_admin" || resolvedRole === "organization_manager") return "مركز قيادة المنشأة";
    if (resolvedRole === "finance_manager") return "المالية والأداء";
    if (title.includes("مدير وكالة")) return "قيادة الوكالة";
    if (title.includes("مدير إدارة")) return "قيادة الإدارة";
    if (title.includes("مدير قسم")) return "قيادة القسم";
    return "مساحة عملي";
  })();

  const roleScopeLabel = work.orgLink
    ? [companyName, work.orgLink].filter(Boolean).join(" / ")
    : departmentDisplay.isEmpty
      ? companyName
      : [companyName, departmentDisplay.text].filter(Boolean).join(" / ");
  const employeeDisplayName = user?.name?.trim() || user?.email || "...";
  const subscriptionStatusLabel =
    organizationStatus === "active"
      ? "نشط"
      : organizationStatus === "trial"
        ? "تجريبي"
        : organizationStatus === "suspended"
          ? "معلّق"
          : organizationStatus === "cancelled"
            ? "ملغي"
            : "غير محدد";

  function shortArabicDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
  }

  // Task distribution (derived only from existing task buckets — no new data logic).
  // Plain computation: inputs are recomputed each render, so memoization adds no value.
  const taskDistribution = (() => {
    const completed = completedTasksCount;
    const overdue = overdueTasksCount;
    const pending = Math.max(0, incompleteTasksCount - overdue);
    const total = totalTasks || 1;
    const pct = (n: number) => `${(n / total) * 100}%`;
    return { completed, overdue, pending, total: totalTasks, pct };
  })();

  // Lightweight AI insight line, derived only from existing KPI values.
  const aiInsight =
    kpi.overdueTasks > 0
      ? `لديك ${kpi.overdueTasks} مهمة متأخرة تتطلب متابعة فورية الآن.`
      : kpi.incompleteTasks > 0
        ? `${kpi.incompleteTasks} مهمة قيد التنفيذ، ومعدل الإنجاز الحالي ${kpi.completedTasksPct}%.`
        : "جميع المهام منجزة — أداء ممتاز اليوم! 🎯";

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
        ["عدد المهام المكتملة", String(completedTasksCount)],
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
        <div className="rounded-3xl border border-ds-border-soft bg-[#070d20]/70 h-40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          <ChartSkeleton height={190} />
          <ChartSkeleton height={190} />
        </div>
      </div>
    </DashboardLayout>
  );

  const kpiCards = [
    {
      key:       "activeClients" as const,
      label:     "العملاء النشطون",
      value:     kpi.activeClients.toString(),
      subtitle:  `من أصل ${totalClients} عميل`,
      icon:      Users,
      iconColor: "text-cyan-300",
    },
    {
      key:       "completedTasks" as const,
      label:     "المهام المكتملة",
      value:     `${kpi.completedTasksPct}%`,
      subtitle:  "نسبة الإنجاز الكلية",
      icon:      CheckCircle2,
      iconColor: "text-emerald-300",
    },
    {
      key:       "incompleteTasks" as const,
      label:     "المهام المتبقية",
      value:     kpi.incompleteTasks.toString(),
      subtitle:  `من أصل ${totalTasks} مهمة`,
      icon:      XCircle,
      iconColor: "text-amber-300",
    },
    {
      key:       "overdueTasks" as const,
      label:     "المهام المتأخرة",
      value:     kpi.overdueTasks.toString(),
      subtitle:  "مهمة تجاوزت الموعد المحدد",
      icon:      AlertTriangle,
      iconColor: kpi.overdueTasks > 0 ? "text-rose-300" : "text-emerald-300",
    },
  ];

  return (
    <DashboardLayout>
      <div className={cn(WS_PAGE, "min-w-0 max-w-full overflow-x-hidden")}>
        {/* ─── Reference-video overview header ───────────────────────────── */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-ds-text-3">
                لوحة التحكم / نظرة عامة
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-[22px] font-black tracking-tight text-ds-text-1 sm:text-[26px]">
                  نظرة عامة
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(74,222,128,.65)]" />
                  مباشر
                </span>
              </div>
              <p className="mt-1 max-w-3xl text-[11px] leading-5 text-ds-text-2 sm:text-xs">
                مرحباً {employeeDisplayName} — {roleLabel} · {companyName}. {aiInsight}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="bm-fusion-control inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3 text-[11px] font-semibold">
                <Activity size={13} className="text-violet-400" />
                عرض تشغيلي
              </span>
              <span className="bm-fusion-control inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3 text-[11px] font-semibold">
                <Clock size={13} />
                آخر 90 يوم
              </span>
              <span className="bm-fusion-control hidden min-h-9 items-center gap-2 rounded-[10px] px-3 text-[11px] font-semibold sm:inline-flex">
                مقارنة بالفترة السابقة
              </span>
            </div>
          </div>
        </section>

        {/* ─── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid min-w-0 grid-cols-2 items-stretch gap-2 md:grid-cols-4 lg:gap-2.5">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card) => {
                const theme = card.key === "overdueTasks" && kpi.overdueTasks === 0
                  ? BOARD_THEME.completedTasks
                  : BOARD_THEME[card.key];
                const progress =
                  card.key === "completedTasks"
                    ? kpi.completedTasksPct
                    : card.key === "incompleteTasks"
                      ? totalTasks
                        ? Math.round((1 - kpi.incompleteTasks / totalTasks) * 100)
                        : 100
                      : card.key === "activeClients"
                        ? totalClients
                          ? Math.round((kpi.activeClients / totalClients) * 100)
                          : 0
                        : kpi.overdueTasks === 0
                          ? 100
                          : Math.max(15, 100 - kpi.overdueTasks * 12);

                const footer =
                  card.key === "activeClients" ? (
                    <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                      <TrendingUp size={13} className="shrink-0" />
                      <span className="truncate">{latestClient ? `آخر عميل: ${latestClient.name}` : "لا يوجد عميل جديد"}</span>
                    </div>
                  ) : card.key === "completedTasks" ? (
                    <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                      <CheckCircle2 size={13} className="shrink-0" />
                      <span className="truncate">معدل إنجاز مستقر اليوم</span>
                    </div>
                  ) : card.key === "incompleteTasks" ? (
                    <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                      <span className="truncate">متبقي {kpi.incompleteTasks} من {totalTasks || 0}</span>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                      <Siren size={13} className="shrink-0" />
                      <span className="truncate">{kpi.overdueTasks > 0 ? "تتطلب متابعة فورية" : "لا يوجد تعثر حرج"}</span>
                    </div>
                  );

                return (
                  <PremiumMetricCard
                    key={card.key}
                    label={card.label}
                    value={card.value}
                    subtitle={card.subtitle}
                    icon={card.icon}
                    iconColor={card.iconColor}
                    theme={theme}
                    progress={progress}
                    footer={footer}
                    onLiveClick={() => setActiveBoard(card.key)}
                    density="compact"
                    className="h-full"
                  />
                );
              })}
        </div>

        {/* ─── Reference-video primary analytics card ─────────────────────── */}
        <section className={cn(WS_CARD, "p-4 sm:p-5")}>
          <div className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ds-text-1">نظرة الإيرادات</h2>
                <span className="rounded-full bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  +{kpi.netProfit >= 0 ? "موجب" : "تراجع"}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-ds-text-3">الأداء المالي للفترة الحالية مقارنة بالفترة السابقة</p>
            </div>

            <div className="flex items-center gap-1 rounded-[10px] border border-ds-border-soft bg-white/[0.025] p-1">
              {["7D", "30D", "90D"].map((range) => (
                <span
                  key={range}
                  className={cn(
                    "rounded-[7px] px-2.5 py-1 text-[10px] font-bold",
                    range === "90D" ? "bg-violet-500 text-white shadow-sm" : "text-ds-text-3",
                  )}
                >
                  {range}
                </span>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <defs>
                <linearGradient id="refCurrentLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-soft)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--ds-text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--ds-text-3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="current" stroke="#8B5CF6" strokeWidth={2.2} dot={false} name="current" />
              <Line type="monotone" dataKey="previous" stroke="#5CDCE7" strokeWidth={1.8} dot={false} name="previous" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        {/* ─── Operational intelligence below the primary chart ───────────── */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardPulsePanel
              roleLensLabel={roleLensLabel}
              roleLabel={roleLabel}
              scopeLabel={roleScopeLabel}
              overdueTasks={overdueTasksCount}
              incompleteTasks={incompleteTasksCount}
              completedTasksPct={kpi.completedTasksPct}
              activeClients={activeClients}
              totalClients={totalClients}
              activeEmployees={activeEmployees}
              totalEmployees={totalEmployees}
              canManageTasks={hasPermission("manage_tasks")}
              canManageClients={hasPermission("manage_clients")}
              canViewEmployees={hasPermission("view_employees") || hasPermission("manage_users")}
            />
          </div>

          <section className={cn(WS_CARD, "p-4")}>
            <div className="relative z-10 mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ds-text-1">توزيع المهام</h3>
                <p className="mt-0.5 text-[10px] text-ds-text-3">حالة العمل الحالية</p>
              </div>
              <span className={cn(WS_ICON_ORB, "h-8 w-8")}>
                <ListChecks size={14} className="text-violet-400" />
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.05]">
              <div className="bg-emerald-400/80" style={{ width: taskDistribution.pct(taskDistribution.completed) }} />
              <div className="bg-violet-400/80" style={{ width: taskDistribution.pct(taskDistribution.pending) }} />
              <div className="bg-rose-400/80" style={{ width: taskDistribution.pct(taskDistribution.overdue) }} />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: "مكتملة", value: taskDistribution.completed, dot: "bg-emerald-400" },
                { label: "متبقية", value: taskDistribution.pending, dot: "bg-violet-400" },
                { label: "متأخرة", value: taskDistribution.overdue, dot: "bg-rose-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ds-text-2">
                    <span className={cn("h-2 w-2 rounded-full", row.dot)} />
                    {row.label}
                  </span>
                  <strong className="text-ds-text-1">{row.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ─── Employees by dept + satisfaction + quick summary ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={cn(WS_CARD, WS_CARD_HOVER, "p-4 sm:p-5")}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative z-10 mb-3.5 flex items-center justify-between">
              <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>الموظفون بالقسم</h3>
              <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-ds-text-2">{activeEmployees} نشط</span>
            </div>
            {activeUsersData.length === 0 ? (
              <WorkspaceEmptyInline icon={Users} title="لا توجد بيانات" accent="cyan" className="h-[220px]" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeUsersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                  <XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="users" fill="#1e6fd9" radius={[6, 6, 0, 0]} name="موظف نشط" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, "p-5 sm:p-6 flex flex-col items-center justify-center")}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <h3 className="relative z-10 mb-4 text-sm text-[rgba(203,213,225,0.72)]">معدل رضا العملاء</h3>
            {kpiLoading ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-[#1e3a5f]">
                <span className="text-xs text-ds-text-2">جارٍ التحميل...</span>
              </div>
            ) : (
              <>
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#satGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`} />
                    <defs>
                      <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-bold text-ds-text-1">{satisfactionPct}%</span>
                    <span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-ds-text-2">
                  {activeOrContractedClients} من {totalClients} عميل نشط/متعاقد
                </p>
              </>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, "p-4 sm:p-5")}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>ملخص سريع</h3>
              <span className="badge status-active">مباشر</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-ds-border-soft py-2">
                <span className="text-xs text-ds-text-2">إجمالي الموظفين</span>
                <span className="text-sm font-bold text-ds-text-1">{totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between border-b border-ds-border-soft py-2">
                <span className="text-xs text-ds-text-2">الموظفون النشطون</span>
                <span className="text-sm font-bold text-emerald-400">{activeEmployees}</span>
              </div>
              <div className="flex items-center justify-between border-b border-ds-border-soft py-2">
                <span className="text-xs text-ds-text-2">إجمالي العملاء</span>
                <span className="text-sm font-bold text-[#22d3ee]">{totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ds-text-2">صافي الدخل</span>
                <span className="text-sm font-bold" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(kpi.netProfit)} SAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Projects + recent activity ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={cn(WS_CARD, WS_CARD_HOVER, "lg:col-span-2 p-4 sm:p-5")}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <h3 className={WS_SECTION_TITLE}>المشاريع النشطة</h3>
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
                    <tr className="border-b border-ds-border-soft">
                      {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => (
                        <th key={h} className="pb-3 text-right font-medium text-ds-text-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="table-row border-b border-ds-border-soft last:border-0">
                        <td className="py-3"><span className="font-medium text-ds-text-1">{project.name}</span></td>
                        <td className="py-3 text-ds-text-2">{project.clientName}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="progress-bar w-20"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)" }} /></div>
                            <span className="text-xs text-ds-text-2">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-ds-text-2">{formatCurrency(project.budget)} SAR</td>
                        <td className="py-3 text-xs text-ds-text-2">{project.deadline}</td>
                        <td className="py-3"><span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>{project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, "p-4 sm:p-5")}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="relative z-10 mb-4 flex items-center justify-between">
              <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>النشاطات الأخيرة</h3>
            </div>
            {actLoad ? (
              <CardSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <WorkspaceEmptyInline icon={Activity} title="لا توجد نشاطات بعد" accent="cyan" className="py-8" />
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b border-ds-border-soft pb-3 last:border-0 last:pb-0">
                    <div className={`${WS_ICON_ORB} w-8 h-8 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/20 text-[#22d3ee]`}>
                      {activityIcons[activity.type] ?? <Activity size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-ds-text-1">{activity.description}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-ds-text-3"><Clock size={10} /><span>{timeAgo(activity.timestamp)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Quick actions ─────────────────────────────────────────────── */}
        <section className={`${WS_SURFACE} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`${WS_SECTION_TITLE} text-sm`}>اختصارات سريعة</h2>
            <span className="text-[11px] text-ds-text-3">اختصارات لأهم العمليات</span>
          </div>
          <div className="flex items-stretch gap-3">
            {/* Central quick-create orb (links to the existing task create flow) */}
            <Link
              href="/tasks"
              aria-label="إنشاء سريع"
              className="grid h-auto w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_14px_34px_-12px_rgba(124,58,237,0.75)] transition-opacity hover:opacity-90"
            >
              <Plus size={26} strokeWidth={2.2} />
            </Link>
            <div className="grid min-w-0 flex-1 grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {QUICK_ACTIONS.map((a) => (
                <QuickActionTile key={a.label} href={a.href} label={a.label} icon={a.icon} tint={a.tint} />
              ))}
            </div>
          </div>
        </section>

        <section className={cn(WS_CARD, "p-4 sm:p-5")}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2">
                <div className={`${WS_ICON_ORB} h-9 w-9 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/20 text-[#22d3ee]`}>
                  <CreditCard size={16} />
                </div>
                <div className="min-w-0">
                  <h2 className={`${WS_SECTION_TITLE} text-sm`}>حالة الاشتراك والدفع</h2>
                  <p className="mt-0.5 text-xs text-ds-text-2">
                    الدفع الإلكتروني قيد التجهيز — تواصل مع الدعم لإتمام الاشتراك.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { label: "حالة الاشتراك", value: subscriptionStatusLabel },
                  { label: "آخر فاتورة", value: "—" },
                  { label: "حالة الدفع", value: "غير مفعّل" },
                ].map((row) => (
                  <div key={row.label} className={cn(WS_INNER_CARD, "px-3 py-2")}>
                    <div className="text-[11px] text-ds-text-2">{row.label}</div>
                    <div className="mt-1 truncate text-sm font-semibold text-ds-text-1">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 lg:w-56">
              <span className="rounded-xl border border-ds-border-soft bg-white/[0.03] px-3 py-2 text-xs text-[#b8c7dd]">
                الباقة الحالية: {PLAN_LABELS_AR[planSlug]}
              </span>
              <button
                type="button"
                disabled
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-3 text-sm font-semibold text-[#8ddff0] opacity-70"
              >
                <CreditCard size={15} />
                طلب رابط الدفع
              </button>
            </div>
          </div>
        </section>

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
                    <h3 className="text-ds-text-1 font-bold text-lg truncate">{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                    <p className="text-ds-text-2 text-xs mt-0.5">لوحة تنفيذية مباشرة وتفاصيل مركزة</p>
                    <span className={`inline-flex mt-2 items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${BOARD_THEME[activeBoard].livePill}`}><Sparkles size={11} />مباشر</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBoard(null)}
                  aria-label="إغلاق"
                  className="w-9 h-9 rounded-xl border border-ds-border text-ds-text-2 hover:text-ds-text-1 hover:border-ds-border-strong inline-flex items-center justify-center touch-manipulation"
                  style={DISABLE_TEXT_SELECT_STYLE}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
                {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                  <div key={label} className={cn(WS_INNER_CARD, "p-3")}>
                    <span className="text-ds-text-2 text-xs">{label}</span>
                    <p className="text-ds-text-1 text-sm font-semibold mt-1 truncate">{value}</p>
                  </div>
                ))}
              </div>
              <div className={cn(WS_INNER_CARD, "p-3 sm:p-4")}>
                <h4 className="text-ds-text-1 text-sm mb-2">تفاصيل اللوحة</h4>
                <div className="text-xs text-ds-text-2 mb-3 space-y-1">
                  {dashboardBoards[activeBoard].summary.map((line) => <p key={line} className="truncate">{line}</p>)}
                </div>
                <h4 className="text-[#22d3ee] text-sm mb-2">آخر 5 عناصر</h4>
                {dashboardBoards[activeBoard].detailList.length === 0 ? (
                  <p className="text-ds-text-2 text-sm">لا توجد بيانات حالياً</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px] sm:min-w-0">
                      <thead>
                        <tr className="border-b border-ds-border text-ds-text-2">
                          <th className="text-right pb-2 font-medium">العنصر</th>
                          <th className="text-right pb-2 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardBoards[activeBoard].detailList.map((item) => (
                          <tr key={item} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-ds-text-1">{item.split("•")[0].trim()}</td>
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
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-ds-border text-ds-text-2">تصدير سريع</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-ds-border text-ds-text-2">مشاركة تنفيذية</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
