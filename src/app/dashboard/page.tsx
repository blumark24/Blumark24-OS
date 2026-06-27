"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Activity, Clock,
  UserCheck, DollarSign, CheckCircle, Sparkles, TrendingUp, Timer, Siren,
  CheckSquare, UserPlus, FileText, Wallet, BarChart3, ListChecks,
  ArrowLeft, ShieldCheck, Building2, Briefcase, Network, UserCog,
  CalendarDays, CreditCard, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { useMyWorkContext } from "@/hooks/useMyWorkContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { PLAN_LABELS_AR } from "@/lib/features/packageFeatures";

import {
  GlassCard,
  MetricCard,
  StatusPill,
  SectionHeader,
  PremiumButton,
  EmptyState,
  AIOrbVisual,
  type GlassCardVariant,
  type StatusPillVariant,
} from "@/components/ui/premium";

// ─── Constants ───────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "#071426",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  color: "#F8FAFC",
};

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/tasks",     label: "مهمة جديدة",   icon: CheckSquare },
  { href: "/clients",   label: "عميل جديد",    icon: UserPlus    },
  { href: "/finance",   label: "فاتورة جديدة", icon: FileText    },
  { href: "/finance",   label: "مصروف جديد",   icon: Wallet      },
  { href: "/employees", label: "موظف جديد",    icon: Users       },
  { href: "/reports",   label: "إنشاء تقرير",  icon: BarChart3   },
];

const STATUS_LABEL: Record<string, string> = {
  "قيد_التنفيذ": "قيد التنفيذ",
};

const STATUS_TONE: Record<string, StatusPillVariant> = {
  "مكتمل": "active",
  "قيد_التنفيذ": "warning",
  "متوقف": "neutral",
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  employee: <Users size={14} />,
  task:     <CheckCircle2 size={14} />,
  client:   <UserCheck size={14} />,
  finance:  <DollarSign size={14} />,
  project:  <Activity size={14} />,
};

type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";

const BOARD_TINT: Record<BoardKey, { variant: GlassCardVariant; pill: StatusPillVariant }> = {
  activeClients:   { variant: "revenue",  pill: "active"   },
  completedTasks:  { variant: "success",  pill: "active"   },
  incompleteTasks: { variant: "warning",  pill: "warning"  },
  overdueTasks:    { variant: "critical", pill: "critical" },
};

const BOARD_ICON: Record<BoardKey, LucideIcon> = {
  activeClients:   Users,
  completedTasks:  CheckCircle2,
  incompleteTasks: Timer,
  overdueTasks:    AlertTriangle,
};

function todayArabic() {
  const d = new Date();
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function shortArabicDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}

// ─── Quick-action link tile — wraps Sprint 2B QuickActionButton visual as <Link> ─

function QuickActionLink({
  href, label, icon: Icon,
}: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link
      href={href}
      dir="rtl"
      className="group flex w-full items-center gap-premium-3 rounded-premium-lg border border-white/10 bg-[#0B1F3A]/60 p-premium-4 text-right transition-all duration-200 hover:border-[#00D9FF]/40 hover:bg-[#0B1F3A]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-gradient-to-br from-[#147CFF]/25 to-[#00D9FF]/15 text-[#7DDCFF] transition-transform duration-200 group-hover:scale-105">
        <Icon size={18} />
      </span>
      <span className="truncate text-sm font-semibold text-[#F8FAFC]">{label}</span>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── Hooks: preserved verbatim from previous dashboard ────────────────────
  const { user, loading } = useAuth();
  const { userRole } = usePermissions();
  const { data: dashboardSummary, loading: summaryLoading } = useDashboardSummary();
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const { name: companyName, logoUrl: companyLogoUrl, isFallback: companyIsFallback } = useTenantCompanyName();
  const { context: work, loading: workLoading } = useMyWorkContext();
  const { planSlug, organizationStatus } = useTenantWorkspace();

  const isSuperAdmin = user
    ? mapAuthRoleToUserRole(user.role) === "super_admin"
    : userRole === "super_admin";

  // ── Data extraction: preserved verbatim from previous dashboard ──────────
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
  const employeeDisplayName = user?.name?.trim() || user?.email || "...";
  const subscriptionStatusLabel =
    organizationStatus === "active" ? "نشط"
      : organizationStatus === "trial" ? "تجريبي"
      : organizationStatus === "suspended" ? "معلّق"
      : organizationStatus === "cancelled" ? "ملغي"
      : "غير محدد";
  const subscriptionTone: StatusPillVariant =
    organizationStatus === "active" ? "active"
      : organizationStatus === "trial" ? "premium"
      : organizationStatus === "suspended" ? "warning"
      : organizationStatus === "cancelled" ? "critical"
      : "neutral";

  // Derived: task distribution & insights — preserved logic from previous file
  const taskDistribution = (() => {
    const completed = completedTasksCount;
    const overdue = overdueTasksCount;
    const pending = Math.max(0, incompleteTasksCount - overdue);
    const total = totalTasks || 1;
    const pct = (n: number) => `${(n / total) * 100}%`;
    return { completed, overdue, pending, total: totalTasks, pct };
  })();

  const aiInsight =
    kpi.overdueTasks > 0
      ? `لديك ${kpi.overdueTasks} مهمة متأخرة تتطلب متابعة فورية الآن.`
      : kpi.incompleteTasks > 0
        ? `${kpi.incompleteTasks} مهمة قيد التنفيذ، ومعدل الإنجاز الحالي ${kpi.completedTasksPct}%.`
        : "جميع المهام منجزة — أداء ممتاز اليوم.";

  const smartInsights: { icon: LucideIcon; tone: StatusPillVariant; text: string }[] = [];
  if (kpi.overdueTasks > 0)
    smartInsights.push({ icon: Siren,        tone: "critical", text: `لديك ${kpi.overdueTasks} مهمة متأخرة تحتاج متابعة فورية.` });
  if (kpi.incompleteTasks > 0)
    smartInsights.push({ icon: Timer,        tone: "warning",  text: `يوجد ${kpi.incompleteTasks} مهمة قيد المتابعة هذا الأسبوع.` });
  smartInsights.push({ icon: CheckCircle2,   tone: "active",   text: `نسبة الإنجاز الحالية ${kpi.completedTasksPct}%.` });
  if (kpi.activeClients > 0)
    smartInsights.push({ icon: Users,        tone: "premium",  text: `يوجد ${kpi.activeClients} عميل نشط حالياً.` });

  const operationalStatus = kpi.overdueTasks > 0 ? "يتطلب متابعة" : "مستقر";
  const operationalTone: StatusPillVariant = kpi.overdueTasks > 0 ? "warning" : "active";
  const teamPerformance =
    kpi.completedTasksPct >= 80 ? "ممتاز"
      : kpi.completedTasksPct >= 50 ? "جيد"
      : kpi.completedTasksPct > 0 ? "متوسط"
      : "—";

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
      ] as [string, string][],
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
      ] as [string, string][],
      detailList: latestFiveCompletedTasks.map((t) => t.title),
    },
    incompleteTasks: {
      summary: [
        `المهام غير المكتملة: ${kpi.incompleteTasks}`,
        nearestDeadlineTask
          ? `أقرب موعد: ${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})`
          : "أقرب موعد: لا يوجد",
      ],
      detailRows: [
        ["عدد المهام المتبقية", String(kpi.incompleteTasks)],
        ["أقرب deadline", nearestDeadlineTask ? `${nearestDeadlineTask.title} (${shortArabicDate(nearestDeadlineTask.dueDate)})` : "لا يوجد"],
      ] as [string, string][],
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
      ] as [string, string][],
      detailList: topFiveOverdueTasks.map((t) => `${t.title}${t.dueDate ? ` • ${shortArabicDate(t.dueDate)}` : ""}`),
    },
  } as const;

  // ── Loading shell (auth not ready) ─────────────────────────────────────────
  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex min-w-0 max-w-full flex-col gap-premium-5 overflow-x-hidden">
          <div className="h-40 animate-pulse rounded-premium-lg border border-white/10 bg-[#0B1F3A]/60" />
          <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-premium-3 sm:gap-premium-4 md:grid-cols-4">
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-premium-4 lg:grid-cols-3">
            <ChartSkeleton height={220} />
            <ChartSkeleton height={220} />
            <ChartSkeleton height={220} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const kpiCards: { key: BoardKey; label: string; value: string; hint: string; icon: LucideIcon; footer: string; footerTone: StatusPillVariant }[] = [
    {
      key: "activeClients",
      label: "العملاء النشطون",
      value: kpi.activeClients.toString(),
      hint: `من أصل ${totalClients} عميل`,
      icon: Users,
      footer: latestClient ? `آخر عميل: ${latestClient.name}` : "لا يوجد عميل جديد",
      footerTone: "active",
    },
    {
      key: "completedTasks",
      label: "نسبة إنجاز المهام",
      value: `${kpi.completedTasksPct}%`,
      hint: "نسبة الإنجاز الكلية",
      icon: CheckCircle2,
      footer: kpi.completedTasksPct >= 80 ? "أداء ممتاز" : kpi.completedTasksPct >= 50 ? "أداء جيد" : "تحتاج رفع الإنجاز",
      footerTone: kpi.completedTasksPct >= 50 ? "active" : "warning",
    },
    {
      key: "incompleteTasks",
      label: "المهام المتبقية",
      value: kpi.incompleteTasks.toString(),
      hint: `من أصل ${totalTasks} مهمة`,
      icon: XCircle,
      footer: `متبقي ${kpi.incompleteTasks} من ${totalTasks || 0}`,
      footerTone: kpi.incompleteTasks > 0 ? "warning" : "active",
    },
    {
      key: "overdueTasks",
      label: "المهام المتأخرة",
      value: kpi.overdueTasks.toString(),
      hint: "مهمة تجاوزت الموعد المحدد",
      icon: AlertTriangle,
      footer: kpi.overdueTasks > 0 ? "تتطلب متابعة فورية" : "لا يوجد تعثر حرج",
      footerTone: kpi.overdueTasks > 0 ? "critical" : "active",
    },
  ];

  return (
    <DashboardLayout>
      <div dir="rtl" className="flex min-w-0 max-w-full flex-col gap-premium-5 overflow-x-hidden">
        {/* ── 1. Hero / Executive welcome ─────────────────────────────────── */}
        <GlassCard variant="default" className="overflow-hidden">
          <div className="flex flex-col gap-premium-5 premium-laptop:flex-row premium-laptop:items-stretch premium-laptop:justify-between">
            {/* Identity + live status */}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-premium-3">
                {companyLogoUrl ? (
                  <span
                    aria-label="شعار المنشأة"
                    role="img"
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-premium-md border border-white/10 bg-white/5 bg-cover bg-center"
                    style={{ backgroundImage: `url(${companyLogoUrl})` }}
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-sm text-[#94A3B8]">مرحباً بك في الرئيسية</p>
                  <h1 className="mt-1 truncate text-xl font-bold text-[#F8FAFC] premium-tablet:text-2xl">
                    {employeeDisplayName}
                  </h1>
                </div>
              </div>

              <div className="mt-premium-3 flex flex-wrap items-center gap-x-premium-4 gap-y-premium-2 text-xs text-[#94A3B8]">
                <span className="inline-flex items-center gap-premium-2">
                  <ShieldCheck size={13} className="text-[#7DDCFF]" />
                  {roleLabel}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-premium-2",
                  companyIsFallback ? "italic text-white/40" : "font-medium text-white/90",
                )}>
                  <Building2 size={13} className={companyIsFallback ? "text-white/30" : "text-[#7DDCFF]"} />
                  {companyName}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-premium-2",
                  departmentDisplay.isEmpty ? "italic text-white/40" : "text-[#94A3B8]",
                )}>
                  <Building2 size={13} className={departmentDisplay.isEmpty ? "text-white/30" : "text-[#7DDCFF]"} />
                  {departmentDisplay.text}
                </span>
                <span className="inline-flex items-center gap-premium-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  {todayArabic()}
                </span>
              </div>

              <div className="mt-premium-4 flex flex-wrap gap-premium-2">
                <StatusPill variant="active"        icon={<TrendingUp size={12} />}>أداء الفريق: {teamPerformance}</StatusPill>
                <StatusPill variant="premium"       icon={<CheckCircle2 size={12} />}>الإنجاز: {kpi.completedTasksPct}%</StatusPill>
                <StatusPill variant={operationalTone} icon={<Activity size={12} />}>حالة التشغيل: {operationalStatus}</StatusPill>
              </div>
            </div>

            {/* AI insight — full card on mobile, side panel on desktop */}
            <div className="premium-laptop:w-80 premium-laptop:shrink-0">
              <GlassCard variant="ai" className="flex h-full flex-col justify-between gap-premium-3">
                <div className="flex items-start gap-premium-3">
                  <AIOrbVisual size="sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7DDCFF]">
                      رؤية ذكية من بلومارك
                    </p>
                    <p className="mt-premium-2 text-sm leading-snug text-[#F8FAFC]">{aiInsight}</p>
                  </div>
                </div>
                <Link
                  href="/ai"
                  className="inline-flex items-center justify-between rounded-premium-md border border-[#7C3AED]/30 bg-[#7C3AED]/15 px-premium-3 py-premium-2 text-xs font-semibold text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/25"
                >
                  مساعد بلومارك الذكي
                  <ArrowLeft size={14} />
                </Link>
              </GlassCard>
            </div>
          </div>
        </GlassCard>

        {/* ── 2. Work identity strip ───────────────────────────────────────── */}
        <GlassCard variant="default">
          <div className="mb-premium-3 flex items-center gap-premium-2 text-[11px] font-semibold uppercase tracking-wide text-[#7DDCFF]">
            <Briefcase size={12} />
            <span>بيانات العمل</span>
          </div>
          {workLoading ? (
            <div className="h-8 animate-pulse rounded-premium-md bg-white/5" />
          ) : work.hasWorkData ? (
            <div className="flex flex-wrap gap-premium-2">
              {work.jobTitle && (
                <StatusPill variant="neutral" icon={<Briefcase size={12} />}>{work.jobTitle}</StatusPill>
              )}
              {work.orgLink && (
                <StatusPill variant="neutral" icon={<Network size={12} />}>{work.orgLink}</StatusPill>
              )}
              {work.directManager && (
                <StatusPill variant="neutral" icon={<UserCog size={12} />}>{work.directManager}</StatusPill>
              )}
              {work.joinDate && (
                <StatusPill variant="neutral" icon={<CalendarDays size={12} />}>{shortArabicDate(work.joinDate)}</StatusPill>
              )}
              {work.status === "active" && <StatusPill variant="active">نشط</StatusPill>}
              {work.status === "inactive" && <StatusPill variant="critical">غير نشط</StatusPill>}
            </div>
          ) : (
            <div className="rounded-premium-md border border-[#F59E0B]/20 bg-[#F59E0B]/[0.05] p-premium-3 text-center">
              <StatusPill variant="warning">يتطلب استكمال</StatusPill>
              <p className="mt-premium-2 text-sm font-medium text-[#F8FAFC]">
                بيانات العمل لم تُستكمل بعد
              </p>
              <p className="mt-premium-2 text-xs text-[#94A3B8]">
                تُدار هذه البيانات من قسم الموظفين والهيكل الإداري بواسطة مدير المنشأة.
              </p>
            </div>
          )}
        </GlassCard>

        {/* ── 3. KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-premium-3 premium-tablet:gap-premium-4 premium-laptop:grid-cols-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card) => {
                const tint = card.key === "overdueTasks" && kpi.overdueTasks === 0
                  ? BOARD_TINT.completedTasks
                  : BOARD_TINT[card.key];
                const Icon = BOARD_ICON[card.key];
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setActiveBoard(card.key)}
                    className="block h-full w-full text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817] rounded-premium-lg"
                    aria-label={`فتح تفاصيل ${card.label}`}
                  >
                    <MetricCard
                      variant={tint.variant}
                      label={card.label}
                      value={card.value}
                      hint={card.hint}
                      icon={<Icon size={18} />}
                      trend={{ label: card.footer, tone: card.footerTone }}
                      className="h-full"
                    />
                  </button>
                );
              })}
        </div>

        {/* ── 4. Smart insights / AI assistant ─────────────────────────────── */}
        <GlassCard variant="ai">
          <div className="flex flex-col gap-premium-4 premium-tablet:flex-row premium-tablet:items-start">
            <div className="flex shrink-0 items-start gap-premium-3 premium-tablet:order-last premium-tablet:w-32 premium-tablet:flex-col premium-tablet:items-center">
              <AIOrbVisual size="md" />
              <div className="premium-tablet:hidden">
                <p className="text-sm font-semibold text-[#F8FAFC]">مساعد بلومارك الذكي</p>
                <p className="text-xs text-[#94A3B8]">رؤى فورية مبنية على بياناتك</p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <SectionHeader
                title="رؤى ذكية من النظام"
                description="تحليل فوري مبني على بياناتك الحالية فقط — بدون تقديرات."
                actions={
                  <Link
                    href="/ai"
                    className="inline-flex items-center gap-premium-2 rounded-premium-md border border-[#7C3AED]/30 bg-[#7C3AED]/15 px-premium-3 py-premium-2 text-xs font-semibold text-[#C4B5FD] transition-colors hover:bg-[#7C3AED]/25"
                  >
                    عرض جميع الرؤى
                    <ArrowLeft size={14} />
                  </Link>
                }
              />

              <ul className="mt-premium-4 grid grid-cols-1 gap-premium-3 premium-tablet:grid-cols-2">
                {smartInsights.map((ins, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 items-start gap-premium-3 rounded-premium-md border border-white/10 bg-white/[0.03] p-premium-3"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-premium-md bg-white/5 text-[#7DDCFF]">
                      <ins.icon size={15} />
                    </span>
                    <p className="min-w-0 text-sm leading-snug text-[#F8FAFC]">{ins.text}</p>
                  </li>
                ))}
              </ul>

              {isSuperAdmin && activeEmployeeNames.length > 0 && (
                <div className="mt-premium-4 flex flex-wrap items-center gap-premium-2">
                  <span className="text-xs text-[#94A3B8]">موظفون نشطون:</span>
                  {activeEmployeeNames.map((name) => (
                    <StatusPill key={name} variant="active">{name}</StatusPill>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* ── 5. Analytics: revenue + task distribution ────────────────────── */}
        <div className="grid grid-cols-1 gap-premium-4 premium-laptop:grid-cols-3">
          <GlassCard variant="revenue" className="premium-laptop:col-span-2">
            <SectionHeader
              title="تحليلات الأداء — الإيرادات"
              actions={
                <StatusPill variant="neutral">آخر 12 شهر</StatusPill>
              }
            />
            <div className="mt-premium-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,220,255,0.12)" />
                  <XAxis dataKey="month" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: "#94A3B8" }}
                    formatter={(value: number, name) => [`${formatCurrency(value)} SAR`, name === "current" ? String(currentYear) : String(currentYear - 1)]}
                  />
                  <Legend formatter={(v) => (v === "current" ? String(currentYear) : String(currentYear - 1))} />
                  <Line type="monotone" dataKey="current" stroke="#00D9FF" strokeWidth={2.5} dot={false} name="current" />
                  <Line type="monotone" dataKey="previous" stroke="#147CFF" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard variant="default">
            <SectionHeader
              title="توزيع المهام"
              actions={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-premium-md bg-white/5 text-[#7DDCFF]">
                  <ListChecks size={15} />
                </span>
              }
            />
            <div className="mt-premium-4 flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="bg-[#10B981]/80" style={{ width: taskDistribution.pct(taskDistribution.completed) }} />
              <div className="bg-[#F59E0B]/80" style={{ width: taskDistribution.pct(taskDistribution.pending) }} />
              <div className="bg-[#EF4444]/80" style={{ width: taskDistribution.pct(taskDistribution.overdue) }} />
            </div>
            <div className="mt-premium-4 space-y-premium-3">
              {[
                { label: "مكتملة", value: taskDistribution.completed, dot: "bg-[#10B981]" },
                { label: "متبقية", value: taskDistribution.pending,   dot: "bg-[#F59E0B]" },
                { label: "متأخرة", value: taskDistribution.overdue,   dot: "bg-[#EF4444]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-premium-2 text-[#94A3B8]">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-bold text-[#F8FAFC] tabular-nums">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 pt-premium-2 text-sm">
                <span className="text-[#94A3B8]">الإجمالي</span>
                <span className="font-bold text-[#00D9FF] tabular-nums">{taskDistribution.total}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── 6. Employees by dept + satisfaction + quick summary ──────────── */}
        <div className="grid grid-cols-1 gap-premium-4 premium-tablet:grid-cols-2 premium-laptop:grid-cols-3">
          <GlassCard variant="default">
            <SectionHeader
              title="الموظفون بالقسم"
              actions={<StatusPill variant="active">{activeEmployees} نشط</StatusPill>}
            />
            <div className="mt-premium-4">
              {activeUsersData.length === 0 ? (
                <EmptyState icon={<Users size={20} />} title="لا توجد بيانات" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={activeUsersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,220,255,0.12)" />
                    <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94A3B8" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="users" fill="#147CFF" radius={[6, 6, 0, 0]} name="موظف نشط" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="default" className="flex flex-col items-center justify-center">
            <p className="text-sm text-[#94A3B8]">معدل رضا العملاء</p>
            {kpiLoading ? (
              <div className="mt-premium-4 flex h-32 w-32 items-center justify-center rounded-full border-8 border-white/10">
                <span className="text-xs text-[#94A3B8]">جارٍ التحميل...</span>
              </div>
            ) : (
              <>
                <div className="relative mt-premium-4 h-32 w-32">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="url(#satGrad2D)" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`}
                    />
                    <defs>
                      <linearGradient id="satGrad2D" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D9FF" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" dir="ltr">
                    <span className="text-3xl font-bold text-[#F8FAFC] tabular-nums">{satisfactionPct}%</span>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: satisfactionPct >= 70 ? "#10B981"
                          : satisfactionPct >= 40 ? "#F59E0B"
                          : "#EF4444",
                      }}
                    >
                      {satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>
                <p className="mt-premium-4 text-center text-xs text-[#94A3B8]">
                  {activeOrContractedClients} من {totalClients} عميل نشط/متعاقد
                </p>
              </>
            )}
          </GlassCard>

          <GlassCard variant="default">
            <SectionHeader
              title="ملخص سريع"
              actions={<StatusPill variant="active">مباشر</StatusPill>}
            />
            <div className="mt-premium-4 space-y-premium-3">
              {[
                { label: "إجمالي الموظفون", value: totalEmployees, color: "text-[#F8FAFC]" },
                { label: "الموظفون النشطون", value: activeEmployees, color: "text-[#10B981]" },
                { label: "إجمالي العملاء", value: totalClients, color: "text-[#00D9FF]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-white/10 pb-premium-2">
                  <span className="text-xs text-[#94A3B8]">{row.label}</span>
                  <span className={`text-sm font-bold tabular-nums ${row.color}`}>{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">صافي الدخل</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: kpi.netProfit >= 0 ? "#10B981" : "#EF4444" }}
                  dir="ltr"
                >
                  {formatCurrency(kpi.netProfit)} SAR
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* ── 7. Projects + recent activities ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-premium-4 premium-laptop:grid-cols-3">
          <GlassCard variant="default" className="premium-laptop:col-span-2">
            <SectionHeader
              title="المشاريع النشطة"
              actions={
                <Link href="/strategy" className="text-xs font-semibold text-[#00D9FF] hover:underline">عرض الكل</Link>
              }
            />
            <div className="mt-premium-4">
              {projLoad ? (
                <ChartSkeleton height={180} />
              ) : projects.length === 0 ? (
                <EmptyState icon={<ListChecks size={20} />} title="لا توجد مشاريع بعد" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-[#94A3B8]">
                        {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => (
                          <th key={h} className="pb-premium-3 text-right font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b border-white/5 last:border-0">
                          <td className="py-premium-3">
                            <span className="font-medium text-[#F8FAFC]">{project.name}</span>
                          </td>
                          <td className="py-premium-3 text-[#94A3B8]">{project.clientName}</td>
                          <td className="py-premium-3">
                            <div className="flex items-center gap-premium-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${project.progress}%`,
                                    background: project.progress === 100
                                      ? "#10B981"
                                      : "linear-gradient(90deg,#00D9FF,#147CFF)",
                                  }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-[#94A3B8]">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="py-premium-3 text-xs tabular-nums text-[#94A3B8]" dir="ltr">
                            {formatCurrency(project.budget)} SAR
                          </td>
                          <td className="py-premium-3 text-xs text-[#94A3B8]">{project.deadline}</td>
                          <td className="py-premium-3">
                            <StatusPill variant={STATUS_TONE[project.status] ?? "warning"}>
                              {STATUS_LABEL[project.status] ?? project.status}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="default">
            <SectionHeader title="آخر الأنشطة" />
            <div className="mt-premium-4">
              {actLoad ? (
                <CardSkeleton rows={5} />
              ) : activities.length === 0 ? (
                <EmptyState icon={<Activity size={20} />} title="لا توجد نشاطات بعد" />
              ) : (
                <div className="space-y-premium-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-premium-3 border-b border-white/5 pb-premium-3 last:border-0 last:pb-0">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-premium-md bg-white/5 text-[#7DDCFF]">
                        {ACTIVITY_ICONS[activity.type] ?? <Activity size={14} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-[#F8FAFC]">{activity.description}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Clock size={10} />
                          <span>{timeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── 8. Quick actions ─────────────────────────────────────────────── */}
        <GlassCard variant="default">
          <SectionHeader
            title="اختصارات سريعة"
            description="اختصارات لأهم العمليات اليومية."
          />
          <div className="mt-premium-4 grid grid-cols-2 gap-premium-3 premium-tablet:grid-cols-3 premium-laptop:grid-cols-6">
            {QUICK_ACTIONS.map((a) => (
              <QuickActionLink key={a.label} href={a.href} label={a.label} icon={a.icon} />
            ))}
          </div>
        </GlassCard>

        {/* ── 9. Subscription / package status ─────────────────────────────── */}
        <GlassCard variant="default">
          <div className="flex flex-col gap-premium-4 premium-laptop:flex-row premium-laptop:items-start premium-laptop:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-premium-3 flex items-center gap-premium-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-premium-md bg-[#147CFF]/15 text-[#7DDCFF]">
                  <CreditCard size={16} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#F8FAFC]">حالة الاشتراك والدفع</h2>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    الدفع الإلكتروني قيد التجهيز — تواصل مع الدعم لإتمام الاشتراك.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-premium-3 premium-tablet:grid-cols-3">
                {[
                  { label: "حالة الاشتراك", value: subscriptionStatusLabel, tone: subscriptionTone },
                  { label: "آخر فاتورة", value: "—", tone: "neutral" as StatusPillVariant },
                  { label: "حالة الدفع", value: "غير مفعّل", tone: "warning" as StatusPillVariant },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="rounded-premium-md border border-white/10 bg-white/[0.03] p-premium-3"
                  >
                    <div className="text-xs text-[#94A3B8]">{row.label}</div>
                    <div className="mt-premium-2 flex items-center justify-between gap-premium-2">
                      <span className="truncate text-sm font-semibold text-[#F8FAFC]">{row.value}</span>
                      <StatusPill variant={row.tone}>{row.value}</StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-premium-2 premium-laptop:w-56">
              <StatusPill variant="premium">الباقة الحالية: {PLAN_LABELS_AR[planSlug]}</StatusPill>
              <PremiumButton variant="secondary" disabled iconStart={<CreditCard size={14} />}>
                طلب رابط الدفع
              </PremiumButton>
            </div>
          </div>
        </GlassCard>

        {/* ── Drilldown modal — preserved behavior ────────────────────────── */}
        {activeBoard && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-[#020817]/75 px-premium-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-premium-3 backdrop-blur-md premium-tablet:items-center premium-tablet:p-premium-5"
            dir="rtl"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-h-[82dvh] w-[calc(100vw-24px)] overflow-y-auto rounded-premium-xl border border-white/10 bg-[#0B1F3A]/90 p-premium-4 backdrop-blur-2xl premium-tablet:w-full premium-tablet:max-w-4xl premium-tablet:p-premium-6">
              <div className="mb-premium-5 flex items-start justify-between gap-premium-3">
                <div className="flex min-w-0 items-start gap-premium-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-premium-md border border-white/10 bg-white/5 text-[#7DDCFF]">
                    {activeBoard === "activeClients"   ? <Users size={20} />
                    : activeBoard === "completedTasks" ? <CheckCircle size={20} />
                    : activeBoard === "incompleteTasks" ? <Timer size={20} />
                    : <AlertTriangle size={20} />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-[#F8FAFC]">
                      {kpiCards.find((c) => c.key === activeBoard)?.label}
                    </h3>
                    <p className="mt-1 text-xs text-[#94A3B8]">لوحة تنفيذية مباشرة وتفاصيل مركزة</p>
                    <span className="mt-premium-2 inline-block">
                      <StatusPill variant="premium" icon={<Sparkles size={11} />}>مباشر</StatusPill>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBoard(null)}
                  aria-label="إغلاق"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-premium-md border border-white/15 text-[#94A3B8] hover:border-white/30 hover:text-[#F8FAFC]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-premium-5 grid grid-cols-2 gap-premium-3 premium-laptop:grid-cols-4">
                {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                  <div key={label} className="rounded-premium-md border border-white/10 bg-white/[0.03] p-premium-3">
                    <span className="text-xs text-[#94A3B8]">{label}</span>
                    <p className="mt-1 truncate text-sm font-semibold text-[#F8FAFC]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-premium-md border border-white/10 bg-white/[0.03] p-premium-4">
                <h4 className="mb-premium-2 text-sm font-semibold text-[#F8FAFC]">تفاصيل اللوحة</h4>
                <div className="mb-premium-3 space-y-1 text-xs text-[#94A3B8]">
                  {dashboardBoards[activeBoard].summary.map((line) => (
                    <p key={line} className="truncate">{line}</p>
                  ))}
                </div>
                <h4 className="mb-premium-2 text-sm font-semibold text-[#00D9FF]">آخر 5 عناصر</h4>
                {dashboardBoards[activeBoard].detailList.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">لا توجد بيانات حالياً</p>
                ) : (
                  <ul className="space-y-premium-2">
                    {dashboardBoards[activeBoard].detailList.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between rounded-premium-md border border-white/5 bg-white/[0.02] px-premium-3 py-premium-2 text-sm text-[#F8FAFC]"
                      >
                        <span className="min-w-0 truncate">{item.split("•")[0].trim()}</span>
                        <StatusPill variant={
                          activeBoard === "overdueTasks" ? "critical"
                            : activeBoard === "completedTasks" ? "active"
                            : activeBoard === "incompleteTasks" ? "warning"
                            : "premium"
                        }>
                          {activeBoard === "overdueTasks" ? "حرج"
                            : activeBoard === "completedTasks" ? "مكتمل"
                            : activeBoard === "incompleteTasks" ? "قيد التنفيذ"
                            : "عميل"}
                        </StatusPill>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
