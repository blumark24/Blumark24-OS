"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, XCircle, AlertTriangle, Activity, Clock,
  UserCheck, DollarSign, CheckCircle, X, Sparkles, TrendingUp, Timer, Siren,
  Bot, CheckSquare, UserPlus, FileText, Wallet, BarChart3, ListChecks,
  ArrowLeft, ShieldCheck, Building2, Zap, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";
import {
  WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING, WS_CARD_SHEEN, WS_CARD_MODAL,
  WS_DASHBOARD_CANVAS, WS_INNER_CARD, WS_SURFACE, WS_SURFACE_GLOW,
  WS_SECTION_TITLE, WS_SECTION_HEADER_ROW, WS_SECTION_SUBTITLE,
  WS_ICON_ORB, WS_ICON_TILE_SM, WS_ICON_TILE_MD, WS_PAGE, WS_AI_PILL,
  WS_STATUS_CHIP, WS_ALERT_CHIP, WS_PERIOD_CHIP,
  WS_MUTED, WS_SUBTEXT, WS_SUMMARY_ROW, WS_TABLE_HEAD, WS_TABLE_ROW, WS_LIST_ROW,
  BOARD_THEME, WS_TINTS, type BoardKey, type KpiAccent,
} from "@/components/ui/workspaceVisual";
import { StatPill, QuickActionTile, WorkspaceEmptyInline } from "@/components/ui/workspaceUi";
import { PremiumMetricCard } from "@/components/ui/PremiumMetricCard";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "rgba(8, 24, 39, 0.96)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "12px",
  color: "#ffffff",
};

function DashboardCardHeader({
  title,
  subtitle,
  action,
  titleClassName,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <div className={cn(WS_SECTION_HEADER_ROW, "relative z-10 mb-5")}>
      <div className="min-w-0">
        <h3 className={cn(WS_SECTION_TITLE, titleClassName ?? "text-sm sm:text-base")}>{title}</h3>
        {subtitle ? <p className={WS_SECTION_SUBTITLE}>{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
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
    <div className="rounded-xl border border-[rgba(148,163,184,0.16)] bg-[rgba(8,24,39,0.96)] p-3 text-sm backdrop-blur-md">
      <p className={cn(WS_MUTED, "mb-1")}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#22d3ee" : "rgba(203,213,225,0.74)" }}>
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
  { href: "/finance",   label: "مصروف جديد",   icon: Wallet,      tint: "cyan"    },
  { href: "/employees", label: "موظف جديد",    icon: Users,       tint: "sky"     },
  { href: "/reports",   label: "إنشاء تقرير",  icon: BarChart3,   tint: "cyan"    },
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading }                      = useAuth();
  const { userRole }                           = usePermissions();
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

  const resolvedRole = userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const roleLabel = resolvedRole
    ? getTenantRoleLabel(resolvedRole)
    : user?.role
      ? getTenantRoleLabel(mapAuthRoleToUserRole(user.role))
      : "عضو الفريق";
  const { display: departmentDisplay } = useProfileOrgDepartment();

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
    smartInsights.push({ icon: Siren,        tint: "amber",   text: `لديك ${kpi.overdueTasks} مهمة متأخرة تحتاج متابعة فورية.` });
  if (kpi.incompleteTasks > 0)
    smartInsights.push({ icon: Timer,        tint: "sky",     text: `يوجد ${kpi.incompleteTasks} مهمة قيد المتابعة هذا الأسبوع.` });
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
      subtitle:  `من أصل ${tasks.length} مهمة`,
      icon:      XCircle,
      iconColor: "text-sky-300",
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
      <div className={cn(WS_DASHBOARD_CANVAS, WS_PAGE, "min-w-0 max-w-full overflow-x-hidden")}>
        {/* ─── Hero: welcome banner ──────────────────────────────────────── */}
        <section className={cn(WS_SURFACE, "p-4 sm:p-5 lg:p-6")}>
          <JellyfishBackground />
          <div className={WS_SURFACE_GLOW} />
          <div className={WS_CARD_SHEEN} />

          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", WS_MUTED)}>مرحباً بك 👋</p>
              <h1 className="mt-0.5 truncate text-xl sm:text-2xl font-heading font-bold text-white">
                {user?.name ?? "..."}
              </h1>

              <div className={cn("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", WS_MUTED)}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{todayArabic()}
                </span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-cyan-300" />{roleLabel}</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5",
                  departmentDisplay.isEmpty ? "text-white/40 italic" : WS_MUTED,
                )}>
                  <Building2 size={13} className={departmentDisplay.isEmpty ? "text-white/30" : "text-cyan-300"} />
                  {departmentDisplay.text}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <StatPill icon={Zap}        label="أداء الفريق"  value={teamPerformance}             tint="emerald"       />
                <StatPill icon={TrendingUp} label="الإنجاز"      value={`${kpi.completedTasksPct}%`} tint="cyan"          />
                <StatPill icon={Activity}   label="حالة التشغيل" value={operationalStatus}           tint={operationalTint} />
              </div>
            </div>

            <div className="hidden lg:flex lg:w-[300px] lg:shrink-0">
              <div className={cn(WS_INNER_CARD, "w-full p-4 backdrop-blur-sm")}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, WS_TINTS.cyan.orb)}>
                    <Sparkles size={15} className={WS_TINTS.cyan.icon} />
                  </span>
                  <div className="text-[11px] font-medium text-cyan-200/90">رؤية ذكية من النظام</div>
                </div>
                <p className="text-sm leading-snug text-white/90">{aiInsight}</p>
                <Link href="/ai" className={cn("mt-3", WS_AI_PILL)}>
                  عرض التفاصيل <ArrowLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr items-stretch min-w-0">
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
                      ? tasks.length
                        ? Math.round((1 - kpi.incompleteTasks / tasks.length) * 100)
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
                      <span className="truncate">متبقي {kpi.incompleteTasks} من {tasks.length || 0}</span>
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
                    className="h-full"
                  />
                );
              })}
        </div>

        {/* ─── Smart Insights (rule-based, free — no external AI) ────────── */}
        <section className={cn(WS_SURFACE, "p-4 sm:p-5")}>
          <div className={WS_SURFACE_GLOW} />
          <div className={WS_CARD_SHEEN} />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="order-first flex shrink-0 items-center justify-center sm:order-last sm:w-24">
              <div className={cn(WS_ICON_ORB, "relative grid h-16 w-16 place-items-center rounded-full")}>
                <Bot size={28} className="text-cyan-200" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className={cn(WS_SECTION_HEADER_ROW, "mb-4")}>
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles size={16} className="shrink-0 text-cyan-300" />
                  <div className="min-w-0">
                    <h2 className={cn(WS_SECTION_TITLE, "text-sm")}>رؤى ذكية من النظام</h2>
                    <p className={WS_SECTION_SUBTITLE}>تحليل فوري مبني على بياناتك الحالية</p>
                  </div>
                </div>
                <Link href="/ai" className={cn("shrink-0", WS_AI_PILL)}>
                  عرض جميع الرؤى <ArrowLeft size={14} />
                </Link>
              </div>

              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {smartInsights.map((ins, i) => (
                  <li key={i} className={cn(WS_INNER_CARD, "flex min-w-0 items-start gap-2.5 p-3.5")}>
                    <span className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, WS_TINTS[ins.tint].orb)}>
                      <ins.icon size={15} className={WS_TINTS[ins.tint].icon} />
                    </span>
                    <p className="min-w-0 text-sm leading-snug text-white/90">{ins.text}</p>
                  </li>
                ))}
              </ul>

              {isSuperAdmin && activeEmployeeNames.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cn("text-[11px]", WS_MUTED)}>موظفون نشطون:</span>
                  {activeEmployeeNames.map((name) => (
                    <span key={name} className={cn(WS_STATUS_CHIP, "text-[11px] text-white/85")}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Analytics: performance + task distribution ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING, "lg:col-span-2")}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="تحليلات الأداء — الإيرادات"
              subtitle="اتجاه الإيرادات الشهرية للمنشأة"
              action={<span className={WS_PERIOD_CHIP}>آخر 12 شهر</span>}
            />
            <div className="relative z-10">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(203,213,225,0.74)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(203,213,225,0.74)", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => v === "current" ? String(currentYear) : String(currentYear - 1)} />
                <Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" />
                <Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING)}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="توزيع المهام"
              subtitle="حالة المهام الحالية"
              titleClassName="text-sm"
              action={
                <span className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, WS_TINTS.cyan.orb)}>
                  <ListChecks size={15} className={WS_TINTS.cyan.icon} />
                </span>
              }
            />
            <div className="relative z-10 flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="bg-emerald-400/85" style={{ width: taskDistribution.pct(taskDistribution.completed) }} />
              <div className="bg-[#1e6fd9]/75"   style={{ width: taskDistribution.pct(taskDistribution.pending) }} />
              <div className="bg-[#ff7a3d]/85"    style={{ width: taskDistribution.pct(taskDistribution.overdue) }} />
            </div>
            <div className="relative z-10 mt-4 space-y-2.5">
              {[
                { label: "مكتملة", value: taskDistribution.completed, dot: "bg-emerald-400" },
                { label: "متبقية", value: taskDistribution.pending,   dot: "bg-[#1e6fd9]" },
                { label: "متأخرة", value: taskDistribution.overdue,   dot: "bg-[#ff7a3d]" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className={cn("flex items-center gap-2", WS_MUTED)}>
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-bold text-white tabular-nums">{row.value}</span>
                </div>
              ))}
              <div className={cn("flex items-center justify-between border-t border-[rgba(148,163,184,0.10)] pt-2.5 text-sm")}>
                <span className={WS_MUTED}>الإجمالي</span>
                <span className="font-bold text-[#22d3ee] tabular-nums">{taskDistribution.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Employees by dept + satisfaction + quick summary ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING)}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="الموظفون بالقسم"
              subtitle="توزيع الفريق النشط"
              titleClassName="text-sm"
              action={<span className={WS_PERIOD_CHIP}>{activeEmployees} نشط</span>}
            />
            {activeUsersData.length === 0 ? (
              <WorkspaceEmptyInline icon={Users} title="لا توجد بيانات" accent="cyan" className="h-[220px]" />
            ) : (
              <div className="relative z-10">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activeUsersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.35)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(203,213,225,0.74)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(203,213,225,0.74)", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(203,213,225,0.74)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="users" fill="#1e6fd9" radius={[6, 6, 0, 0]} name="موظف نشط" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING, "flex flex-col items-center justify-center")}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="معدل رضا العملاء"
              subtitle="نسبة العملاء النشطين والمتعاقدين"
              titleClassName="text-sm"
            />
            {kpiLoading ? (
              <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border-8 border-[rgba(148,163,184,0.16)]">
                <span className={cn("text-xs", WS_MUTED)}>جارٍ التحميل...</span>
              </div>
            ) : (
              <>
                <div className="relative z-10 h-32 w-32">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#satGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`} />
                    <defs>
                      <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-bold text-white tabular-nums">{satisfactionPct}%</span>
                    <span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#ff7a3d" : "#ef4444" }}>
                      {satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>
                <p className={cn("relative z-10 mt-3 text-center text-xs", WS_MUTED)}>
                  {clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من {clients.length} عميل نشط/متعاقد
                </p>
              </>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING)}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="ملخص سريع"
              subtitle="مؤشرات تشغيلية مباشرة"
              titleClassName="text-sm"
              action={<span className={cn(WS_STATUS_CHIP, "text-emerald-200 border-emerald-300/22 bg-emerald-400/10")}>مباشر</span>}
            />
            <div className="relative z-10 space-y-0">
              <div className={WS_SUMMARY_ROW}>
                <span className={cn("text-xs", WS_MUTED)}>إجمالي الموظفين</span>
                <span className="text-sm font-bold text-white tabular-nums">{employees.length}</span>
              </div>
              <div className={WS_SUMMARY_ROW}>
                <span className={cn("text-xs", WS_MUTED)}>الموظفون النشطون</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">{activeEmployees}</span>
              </div>
              <div className={WS_SUMMARY_ROW}>
                <span className={cn("text-xs", WS_MUTED)}>إجمالي العملاء</span>
                <span className="text-sm font-bold text-[#22d3ee] tabular-nums">{clients.length}</span>
              </div>
              <div className={cn(WS_SUMMARY_ROW, "border-0")}>
                <span className={cn("text-xs", WS_MUTED)}>صافي الدخل</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(kpi.netProfit)} SAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Projects + recent activity ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING, "lg:col-span-2")}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader
              title="المشاريع النشطة"
              subtitle="متابعة التقدم والميزانية"
              action={<button className="text-xs text-[#22d3ee] hover:underline">عرض الكل</button>}
            />
            {projLoad ? (
              <ChartSkeleton height={180} />
            ) : projects.length === 0 ? (
              <WorkspaceEmptyInline icon={ListChecks} title="لا توجد مشاريع بعد" accent="cyan" className="py-8" />
            ) : (
              <div className="relative z-10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={WS_TABLE_HEAD}>
                      {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => (
                        <th key={h} className="pb-3 text-right font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className={WS_TABLE_ROW}>
                        <td className="py-3"><span className="font-medium text-white">{project.name}</span></td>
                        <td className={cn("py-3", WS_MUTED)}>{project.clientName}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="progress-bar w-20"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)" }} /></div>
                            <span className={cn("text-xs tabular-nums", WS_MUTED)}>{project.progress}%</span>
                          </div>
                        </td>
                        <td className={cn("py-3 text-xs tabular-nums", WS_MUTED)}>{formatCurrency(project.budget)} SAR</td>
                        <td className={cn("py-3 text-xs", WS_MUTED)}>{project.deadline}</td>
                        <td className="py-3"><span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>{project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={cn(WS_CARD, WS_CARD_HOVER, WS_CARD_PADDING)}>
            <div className={WS_CARD_SHEEN} />
            <DashboardCardHeader title="النشاطات الأخيرة" subtitle="آخر تحديثات المنشأة" titleClassName="text-sm" />
            {actLoad ? (
              <CardSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <WorkspaceEmptyInline icon={Activity} title="لا توجد نشاطات بعد" accent="cyan" className="py-8" />
            ) : (
              <div className="relative z-10 space-y-0">
                {activities.map((activity) => (
                  <div key={activity.id} className={WS_LIST_ROW}>
                    <div className={cn(WS_ICON_ORB, WS_ICON_TILE_SM, WS_TINTS.cyan.orb, "text-[#22d3ee]")}>
                      {activityIcons[activity.type] ?? <Activity size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-white">{activity.description}</p>
                      <div className={cn("mt-1 flex items-center gap-1 text-xs", WS_SUBTEXT)}><Clock size={10} /><span>{timeAgo(activity.timestamp)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Quick actions ─────────────────────────────────────────────── */}
        <section className={cn(WS_SURFACE, "p-4 sm:p-5")}>
          <div className={WS_CARD_SHEEN} />
          <DashboardCardHeader
            title="اختصارات سريعة"
            subtitle="اختصارات لأهم العمليات"
            titleClassName="text-sm"
          />
          <div className="relative z-10 flex items-stretch gap-3">
            <Link
              href="/tasks"
              aria-label="إنشاء سريع"
              className="grid h-auto w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1e6fd9] via-[#2563eb] to-[#22d3ee] text-white shadow-[0_14px_34px_-12px_rgba(30,111,217,0.55)] transition-opacity hover:opacity-90"
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

        {/* ─── Drilldown modal (unchanged behavior) ──────────────────────── */}
        {activeBoard && (
          <div className="fixed inset-0 z-50 bg-[#030913]/65 backdrop-blur-md flex items-start sm:items-center justify-center px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5" dir="rtl">
            <div className={cn(
              WS_CARD_MODAL,
              "w-[calc(100vw-24px)] sm:w-full sm:max-w-4xl p-4 sm:p-6 max-h-[82dvh] overflow-y-auto",
              BOARD_THEME[activeBoard].panelBorder,
            )}>
              <div className={WS_CARD_SHEEN} />
              <div className="relative z-10 flex items-start justify-between mb-5 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={cn(WS_ICON_ORB, WS_ICON_TILE_MD, "flex items-center justify-center", BOARD_THEME[activeBoard].iconTile, BOARD_THEME[activeBoard].orb)}>
                    {activeBoard === "activeClients" ? <Users size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "completedTasks" ? <CheckCircle size={20} className={BOARD_THEME[activeBoard].iconColor} /> : activeBoard === "incompleteTasks" ? <Timer size={20} className={BOARD_THEME[activeBoard].iconColor} /> : <AlertTriangle size={20} className={BOARD_THEME[activeBoard].iconColor} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                    <p className={cn(WS_SUBTEXT, "text-xs mt-0.5")}>لوحة تنفيذية مباشرة وتفاصيل مركزة</p>
                    <span className={cn(WS_STATUS_CHIP, "inline-flex mt-2", BOARD_THEME[activeBoard].livePill)}><Sparkles size={11} />مباشر</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBoard(null)}
                  aria-label="إغلاق"
                  className={cn(WS_ICON_ORB, "w-9 h-9 rounded-xl text-[rgba(203,213,225,0.74)] hover:text-white hover:border-[rgba(34,211,238,0.34)] inline-flex items-center justify-center touch-manipulation")}
                  style={DISABLE_TEXT_SELECT_STYLE}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-5">
                {dashboardBoards[activeBoard].detailRows.map(([label, value]) => (
                  <div key={label} className={cn(WS_INNER_CARD, "p-3.5")}>
                    <span className={cn("text-xs", WS_MUTED)}>{label}</span>
                    <p className="text-white text-sm font-semibold mt-1 truncate tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <div className={cn(WS_INNER_CARD, "relative z-10 p-3.5 sm:p-4")}>
                <h4 className={cn(WS_SECTION_TITLE, "text-sm mb-2")}>تفاصيل اللوحة</h4>
                <div className={cn("text-xs mb-3 space-y-1", WS_MUTED)}>
                  {dashboardBoards[activeBoard].summary.map((line) => <p key={line} className="truncate">{line}</p>)}
                </div>
                <h4 className="text-[#22d3ee] text-sm mb-2 font-semibold">آخر 5 عناصر</h4>
                {dashboardBoards[activeBoard].detailList.length === 0 ? (
                  <p className={cn("text-sm", WS_MUTED)}>لا توجد بيانات حالياً</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px] sm:min-w-0">
                      <thead>
                        <tr className={WS_TABLE_HEAD}>
                          <th className="text-right pb-2 font-medium">العنصر</th>
                          <th className="text-right pb-2 font-medium">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardBoards[activeBoard].detailList.map((item) => (
                          <tr key={item} className={WS_TABLE_ROW}>
                            <td className="py-2 text-white/90">{item.split("•")[0].trim()}</td>
                            <td className="py-2">
                              <span className={cn(
                                activeBoard === "overdueTasks" ? WS_ALERT_CHIP : WS_STATUS_CHIP,
                                BOARD_THEME[activeBoard].livePill,
                              )}>
                                {activeBoard === "overdueTasks" ? "حرج" : activeBoard === "completedTasks" ? "مكتمل" : activeBoard === "incompleteTasks" ? "قيد التنفيذ" : "عميل"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={WS_PERIOD_CHIP}>تصدير سريع</span>
                  <span className={WS_PERIOD_CHIP}>مشاركة تنفيذية</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
