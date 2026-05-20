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
  ArrowLeft, ShieldCheck, Building2, CalendarDays, Heart, Zap, Home, Plus, MoreHorizontal,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities, useTransactions, useEmployees, useClients, useTasks } from "@/hooks/useData";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, usePermissions, mapAuthRoleToUserRole } from "@/contexts/PermissionsContext";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { UserRole } from "@/contexts/PermissionsContext";

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

// ─── Local dashboard design tokens ──────────────────────────────────────────────
// Scoped, reusable visual language for the dashboard (and future modules to follow).
// Kept at module scope so these large static class strings are not recreated per render.

const CARD_BASE     = "relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#070d20]/80 backdrop-blur-xl";
const SURFACE_PANEL = "relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[linear-gradient(150deg,rgba(13,25,48,0.85),rgba(7,15,32,0.92))] backdrop-blur-xl";
const SECTION_TITLE = "text-white font-heading font-semibold";
const ICON_ORB      = "grid place-items-center rounded-2xl backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";

// Per-KPI premium theme tokens. Fully static → defined once at module scope.
const BOARD_THEME: Record<BoardKey, {
  glow: string;
  ambient: string;
  orb: string;
  iconColor: string;
  accent: string;
  livePill: string;
  iconTile: string;
  panelBorder: string;
}> = {
  activeClients: {
    glow: "shadow-[0_14px_44px_-18px_rgba(34,211,238,0.5)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(34,211,238,0.20),transparent_55%)]",
    orb: "bg-cyan-400/10 ring-1 ring-cyan-300/25",
    iconColor: "text-cyan-300",
    accent: "text-cyan-200/85",
    livePill: "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/25",
    iconTile: "bg-cyan-400/15 border-cyan-300/30",
    panelBorder: "border-cyan-300/45 shadow-[0_0_50px_rgba(34,211,238,.18)]",
  },
  completedTasks: {
    glow: "shadow-[0_14px_44px_-18px_rgba(16,185,129,0.5)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(16,185,129,0.20),transparent_55%)]",
    orb: "bg-emerald-400/10 ring-1 ring-emerald-300/25",
    iconColor: "text-emerald-300",
    accent: "text-emerald-200/85",
    livePill: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/25",
    iconTile: "bg-emerald-400/15 border-emerald-300/30",
    panelBorder: "border-emerald-300/45 shadow-[0_0_50px_rgba(16,185,129,.18)]",
  },
  incompleteTasks: {
    glow: "shadow-[0_14px_44px_-18px_rgba(251,191,36,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(251,191,36,0.18),transparent_55%)]",
    orb: "bg-amber-400/10 ring-1 ring-amber-300/25",
    iconColor: "text-amber-300",
    accent: "text-amber-200/85",
    livePill: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/25",
    iconTile: "bg-amber-400/15 border-amber-300/30",
    panelBorder: "border-amber-300/45 shadow-[0_0_50px_rgba(251,191,36,.18)]",
  },
  overdueTasks: {
    glow: "shadow-[0_14px_44px_-18px_rgba(244,63,94,0.45)]",
    ambient: "bg-[radial-gradient(135%_120%_at_85%_-12%,rgba(244,63,94,0.18),transparent_55%)]",
    orb: "bg-rose-400/10 ring-1 ring-rose-300/25",
    iconColor: "text-rose-300",
    accent: "text-rose-200/85",
    livePill: "bg-rose-400/10 text-rose-200 ring-1 ring-rose-300/25",
    iconTile: "bg-rose-400/15 border-rose-300/30",
    panelBorder: "border-rose-300/45 shadow-[0_0_50px_rgba(244,63,94,.18)]",
  },
};

// Neutral accent tints for hero stats + quick actions.
const TINTS = {
  cyan:    { orb: "bg-cyan-400/10 ring-1 ring-cyan-300/25",       icon: "text-cyan-300" },
  emerald: { orb: "bg-emerald-400/10 ring-1 ring-emerald-300/25", icon: "text-emerald-300" },
  amber:   { orb: "bg-amber-400/10 ring-1 ring-amber-300/25",     icon: "text-amber-300" },
  rose:    { orb: "bg-rose-400/10 ring-1 ring-rose-300/25",       icon: "text-rose-300" },
  violet:  { orb: "bg-violet-400/10 ring-1 ring-violet-300/25",   icon: "text-violet-300" },
  sky:     { orb: "bg-sky-400/10 ring-1 ring-sky-300/25",         icon: "text-sky-300" },
} as const;
type TintKey = keyof typeof TINTS;

// ─── Small presentational helpers (dashboard-scoped) ─────────────────────────────

function StatPill({ icon: Icon, label, value, tint }: {
  icon: React.ElementType; label: string; value: string; tint: TintKey;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`${ICON_ORB} w-8 h-8 shrink-0 ${TINTS[tint].orb}`}>
          <Icon size={15} className={TINTS[tint].icon} />
        </span>
        <span className="text-[11px] text-[#8ba3c7] truncate">{label}</span>
      </div>
      <div className="mt-2 text-base sm:text-lg font-bold text-white truncate">{value}</div>
    </div>
  );
}

// Vertical quick-action tile (icon orb on top, label below) — matches the reference.
function QuickAction({ href, label, icon: Icon, tint }: {
  href: string; label: string; icon: React.ElementType; tint: TintKey;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition-colors hover:border-white/15 hover:bg-white/[0.06]"
    >
      <span className={`${ICON_ORB} w-11 h-11 shrink-0 ${TINTS[tint].orb}`}>
        <Icon size={19} className={TINTS[tint].icon} />
      </span>
      <span className="w-full truncate text-[11.5px] font-medium text-white/85">{label}</span>
    </Link>
  );
}

// Decorative ambient accent (NOT data) — mirrors the faint sparkline aesthetic in the reference.
const SPARK_POINTS = "0,24 12,18 24,21 36,10 48,15 60,6 72,13 84,9 96,16 108,8 120,14";
function Sparkline({ colorClass }: { colorClass: string }) {
  return (
    <svg viewBox="0 0 120 32" preserveAspectRatio="none" className={`h-full w-full ${colorClass}`} aria-hidden="true">
      <polyline points={SPARK_POINTS} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const QUICK_ACTIONS: { href: string; label: string; icon: React.ElementType; tint: TintKey }[] = [
  { href: "/tasks",     label: "مهمة جديدة",   icon: CheckSquare, tint: "cyan"    },
  { href: "/clients",   label: "عميل جديد",    icon: UserPlus,    tint: "emerald" },
  { href: "/finance",   label: "فاتورة جديدة", icon: FileText,    tint: "sky"     },
  { href: "/finance",   label: "مصروف جديد",   icon: Wallet,      tint: "rose"    },
  { href: "/employees", label: "موظف جديد",    icon: Users,       tint: "violet"  },
  { href: "/reports",   label: "إنشاء تقرير",  icon: BarChart3,   tint: "amber"   },
];

// Mobile bottom-nav items — existing routes only (no route changes; pure navigation).
const BOTTOM_NAV: { href: string; label: string; icon: React.ElementType; active?: boolean }[] = [
  { href: "/dashboard", label: "الرئيسية", icon: Home,           active: true },
  { href: "/tasks",     label: "المهام",   icon: CheckSquare                  },
  { href: "/clients",   label: "العملاء",  icon: Users                        },
  { href: "/settings",  label: "المزيد",   icon: MoreHorizontal               },
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

  const roleLabel = user?.role
    ? ROLE_LABELS[user.role as UserRole] ?? user.role
    : "—";

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
  const smartInsights: { icon: React.ElementType; tint: TintKey; text: string }[] = [];
  if (kpi.overdueTasks > 0)
    smartInsights.push({ icon: Siren,        tint: "rose",    text: `لديك ${kpi.overdueTasks} مهمة متأخرة تحتاج متابعة فورية.` });
  if (kpi.incompleteTasks > 0)
    smartInsights.push({ icon: Timer,        tint: "amber",   text: `يوجد ${kpi.incompleteTasks} مهمة قيد المتابعة هذا الأسبوع.` });
  smartInsights.push({ icon: CheckCircle2,   tint: "emerald", text: `نسبة الإنجاز الحالية ${kpi.completedTasksPct}%.` });
  if (kpi.activeClients > 0)
    smartInsights.push({ icon: Users,        tint: "cyan",    text: `يوجد ${kpi.activeClients} عميل نشط حالياً.` });

  // Qualitative hero metrics — derived ONLY from existing KPI values (no fabricated numbers).
  const overallHealth   = kpi.overdueTasks === 0 && kpi.completedTasksPct >= 70
    ? "ممتازة"
    : kpi.completedTasksPct >= 50 ? "جيدة" : kpi.completedTasksPct > 0 ? "متوسطة" : "—";
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
      <div className="space-y-5">
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
      <div className="space-y-5 sm:space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-6">
        {/* ─── Hero: AI insight / welcome banner ─────────────────────────── */}
        <section className={`${SURFACE_PANEL} p-4 sm:p-6 lg:p-7`}>
          <JellyfishBackground />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(110%_120%_at_8%_125%,rgba(124,58,237,0.16),transparent_55%)]" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Welcome + identity + live status metrics (right side on desktop) */}
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-cyan-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
                </span>
                نظام بلومارك الذكي • مباشر
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-white">مرحباً بك 👋</h1>
              <p className="mt-1 truncate text-lg sm:text-xl font-bold bg-gradient-to-l from-cyan-200 via-sky-200 to-blue-300 bg-clip-text text-transparent">
                {user?.name ?? "..."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#8ba3c7]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{todayArabic()}
                </span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-cyan-300" />{roleLabel}</span>
                {user?.department && (
                  <span className="inline-flex items-center gap-1.5"><Building2 size={13} className="text-cyan-300" />{user.department}</span>
                )}
              </div>

              {/* Three compact live metrics (derived from existing data only) */}
              <div className="mt-4 grid max-w-md grid-cols-3 gap-2 sm:gap-3">
                <StatPill icon={Zap}        label="أداء الفريق"  value={teamPerformance}              tint="emerald" />
                <StatPill icon={TrendingUp} label="معدل الإنجاز" value={`${kpi.completedTasksPct}%`}  tint="cyan"    />
                <StatPill icon={Heart}      label="الصحة العامة" value={overallHealth}                tint="rose"    />
              </div>
            </div>

            {/* AI insight panel (left side on desktop; the mobile equivalent lives lower as a full card) */}
            <div className="hidden lg:flex lg:w-[300px] lg:shrink-0">
              <div className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`${ICON_ORB} w-8 h-8 shrink-0 bg-violet-400/10 ring-1 ring-violet-300/25`}>
                    <Sparkles size={15} className="text-violet-300" />
                  </span>
                  <div className="text-[11px] font-medium text-cyan-200/90">رؤية ذكية من النظام</div>
                </div>
                <p className="text-sm leading-snug text-[#dbe6f7]">{aiInsight}</p>
                <Link
                  href="/ai"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-400/15"
                >
                  عرض التفاصيل <ArrowLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── KPI cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card, i) => {
                // Overdue turns emerald (positive) when there is nothing overdue.
                const theme = card.key === "overdueTasks" && kpi.overdueTasks === 0
                  ? BOARD_THEME.completedTasks
                  : BOARD_THEME[card.key];
                return (
                  <div
                    key={i}
                    className={`${CARD_BASE} group w-full aspect-square transition-shadow duration-300 ${theme.glow}`}
                  >
                    <div className={`pointer-events-none absolute inset-0 ${theme.ambient}`} />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_0%,rgba(255,255,255,0.05),transparent_60%)]" />
                    {/* Decorative ambient accent (not data) */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 opacity-[0.22]">
                      <Sparkline colorClass={theme.iconColor} />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-between p-3.5 sm:p-5 min-w-0">
                      {/* Top: live drilldown trigger + icon orb */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          draggable={false}
                          aria-label={`عرض تفاصيل ${card.label}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onTouchStart={(event) => event.currentTarget.blur()}
                          onClick={() => setActiveBoard(card.key)}
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full leading-none select-none cursor-pointer touch-manipulation transition-colors ${theme.livePill}`}
                          style={DISABLE_TEXT_SELECT_STYLE}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                          <span className="select-none" style={DISABLE_TEXT_SELECT_STYLE}>مباشر</span>
                        </button>
                        <div className={`${ICON_ORB} w-9 h-9 sm:w-11 sm:h-11 ${theme.orb}`}>
                          <card.icon size={18} className={card.iconColor} />
                        </div>
                      </div>

                      {/* Hero number + caption */}
                      <div className="min-w-0">
                        <div className="font-heading font-bold tracking-tight text-white leading-[0.9] text-[clamp(1.85rem,7vw,3.375rem)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                          {card.value}
                        </div>
                        <div className="mt-1.5 truncate text-[12.5px] font-medium text-white/80">{card.label}</div>
                        <div className="truncate text-[10.5px] text-white/40">{card.subtitle}</div>
                      </div>

                      {/* Footer: single clean live insight */}
                      <div className="min-w-0 text-[11px]">
                        {card.key === "activeClients" && (
                          <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                            <TrendingUp size={13} className="shrink-0" />
                            <span className="truncate">{latestClient ? `آخر عميل: ${latestClient.name}` : "لا يوجد عميل جديد"}</span>
                          </div>
                        )}
                        {card.key === "completedTasks" && (
                          <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                            <CheckCircle2 size={13} className="shrink-0" />
                            <span className="truncate">معدل إنجاز مستقر اليوم</span>
                          </div>
                        )}
                        {card.key === "incompleteTasks" && (
                          <div className={`flex items-center gap-2 ${theme.accent}`}>
                            <div className="h-1.5 w-12 shrink-0 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-300/80" style={{ width: `${Math.min(100, Math.max(8, (kpi.incompleteTasks / Math.max(tasks.length, 1)) * 100))}%` }} />
                            </div>
                            <span className="truncate">متبقي {kpi.incompleteTasks} من {tasks.length || 0}</span>
                          </div>
                        )}
                        {card.key === "overdueTasks" && (
                          <div className={`flex items-center gap-1.5 ${theme.accent}`}>
                            <Siren size={13} className="shrink-0" />
                            <span className="truncate">{kpi.overdueTasks > 0 ? "تتطلب متابعة فورية" : "لا يوجد تعثر حرج"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* ─── Smart Insights (rule-based, free — no external AI) ────────── */}
        <section className={`${SURFACE_PANEL} p-4 sm:p-5`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_92%_-20%,rgba(124,58,237,0.16),transparent_55%),radial-gradient(110%_120%_at_5%_120%,rgba(34,211,238,0.12),transparent_55%)]" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Glowing AI avatar — on the left in RTL via order */}
            <div className="order-first flex shrink-0 items-center justify-center sm:order-last sm:w-24">
              <div className="relative grid h-16 w-16 place-items-center rounded-full bg-violet-500/10 ring-1 ring-violet-300/25">
                <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.45),transparent_70%)] blur-md animate-pulse-glow" />
                <Bot size={28} className="relative text-violet-200" />
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles size={16} className="shrink-0 text-violet-300" />
                  <div className="min-w-0">
                    <h2 className={`${SECTION_TITLE} text-sm`}>رؤى ذكية من النظام</h2>
                    <p className="truncate text-[11px] text-[#6b87ab]">تحليل فوري مبني على بياناتك الحالية</p>
                  </div>
                </div>
                <Link href="/ai" className="inline-flex shrink-0 items-center gap-1 text-xs text-cyan-200/90 transition-colors hover:text-cyan-100">
                  عرض جميع الرؤى <ArrowLeft size={14} />
                </Link>
              </div>

              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {smartInsights.map((ins, i) => (
                  <li key={i} className="flex min-w-0 items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <span className={`${ICON_ORB} w-8 h-8 shrink-0 ${TINTS[ins.tint].orb}`}>
                      <ins.icon size={15} className={TINTS[ins.tint].icon} />
                    </span>
                    <p className="min-w-0 text-sm leading-snug text-[#dbe6f7]">{ins.text}</p>
                  </li>
                ))}
              </ul>

              {isSuperAdmin && activeEmployeeNames.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#8ba3c7]">موظفون نشطون:</span>
                  {activeEmployeeNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/80">
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
          <div className={`${CARD_BASE} lg:col-span-2 p-5`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE}`}>تحليلات الأداء — الإيرادات</h3>
              <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-[#8ba3c7]">آخر 12 شهر</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
                <XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => v === "current" ? String(currentYear) : String(currentYear - 1)} />
                <Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" />
                <Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`${CARD_BASE} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE} text-sm`}>توزيع المهام</h3>
              <span className={`${ICON_ORB} w-8 h-8 bg-cyan-400/10 ring-1 ring-cyan-300/25`}>
                <ListChecks size={15} className="text-cyan-300" />
              </span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="bg-emerald-400/80" style={{ width: taskDistribution.pct(taskDistribution.completed) }} />
              <div className="bg-amber-400/80"   style={{ width: taskDistribution.pct(taskDistribution.pending) }} />
              <div className="bg-rose-400/80"    style={{ width: taskDistribution.pct(taskDistribution.overdue) }} />
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { label: "مكتملة", value: taskDistribution.completed, dot: "bg-emerald-400" },
                { label: "متبقية", value: taskDistribution.pending,   dot: "bg-amber-400" },
                { label: "متأخرة", value: taskDistribution.overdue,   dot: "bg-rose-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-[#8ba3c7]">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="font-bold text-white">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-sm">
                <span className="text-[#8ba3c7]">الإجمالي</span>
                <span className="font-bold text-[#22d3ee]">{taskDistribution.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Employees by dept + satisfaction + quick summary ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className={`${CARD_BASE} p-5`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE} text-sm`}>الموظفون بالقسم</h3>
              <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-[#8ba3c7]">{activeEmployees} نشط</span>
            </div>
            {activeUsersData.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#8ba3c7]">لا توجد بيانات</div>
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

          <div className={`${CARD_BASE} p-5 flex flex-col items-center justify-center`}>
            <h3 className="mb-4 text-sm text-[#8ba3c7]">معدل رضا العملاء</h3>
            {kpiLoading ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-[#1e3a5f]">
                <span className="text-xs text-[#8ba3c7]">جارٍ التحميل...</span>
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
                    <span className="text-3xl font-heading font-bold text-white">{satisfactionPct}%</span>
                    <span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#f59e0b" : "#ef4444" }}>
                      {satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-[#8ba3c7]">
                  {clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من {clients.length} عميل نشط/متعاقد
                </p>
              </>
            )}
          </div>

          <div className={`${CARD_BASE} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE} text-sm`}>ملخص سريع</h3>
              <span className="badge status-active">مباشر</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.06] py-2">
                <span className="text-xs text-[#8ba3c7]">إجمالي الموظفين</span>
                <span className="text-sm font-bold text-white">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] py-2">
                <span className="text-xs text-[#8ba3c7]">الموظفون النشطون</span>
                <span className="text-sm font-bold text-emerald-400">{activeEmployees}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] py-2">
                <span className="text-xs text-[#8ba3c7]">إجمالي العملاء</span>
                <span className="text-sm font-bold text-[#22d3ee]">{clients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8ba3c7]">صافي الدخل</span>
                <span className="text-sm font-bold" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(kpi.netProfit)} SAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Projects + recent activity ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${CARD_BASE} lg:col-span-2 p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE}`}>المشاريع النشطة</h3>
              <button className="text-xs text-[#22d3ee] hover:underline">عرض الكل</button>
            </div>
            {projLoad ? (
              <ChartSkeleton height={180} />
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#8ba3c7]">لا توجد مشاريع بعد</div>
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

          <div className={`${CARD_BASE} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${SECTION_TITLE} text-sm`}>النشاطات الأخيرة</h3>
            </div>
            {actLoad ? (
              <CardSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#8ba3c7]">لا توجد نشاطات بعد</div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                    <div className={`${ICON_ORB} w-8 h-8 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/20 text-[#22d3ee]`}>
                      {activityIcons[activity.type] ?? <Activity size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-white">{activity.description}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#6b87ab]"><Clock size={10} /><span>{timeAgo(activity.timestamp)}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Quick actions ─────────────────────────────────────────────── */}
        <section className={`${SURFACE_PANEL} p-4 sm:p-5`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={`${SECTION_TITLE} text-sm`}>اختصارات سريعة</h2>
            <span className="text-[11px] text-[#6b87ab]">اختصارات لأهم العمليات</span>
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
                <QuickAction key={a.label} href={a.href} label={a.label} icon={a.icon} tint={a.tint} />
              ))}
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

      {/* ─── Mobile bottom navigation (mobile only; existing routes) ──────── */}
      <nav
        aria-label="التنقل السريع"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
      >
        <div className="mx-auto flex max-w-md items-center justify-around rounded-2xl border border-white/[0.08] bg-[#070d20]/90 px-1.5 py-1 backdrop-blur-xl shadow-[0_-10px_30px_-12px_rgba(0,0,0,0.7)]">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors ${
                item.active ? "text-cyan-300" : "text-[#8ba3c7] hover:text-white"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </DashboardLayout>
  );
}
