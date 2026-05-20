"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, XCircle,
  AlertTriangle, Activity, Clock, UserCheck, DollarSign,
  CheckCircle, X, Sparkles, TrendingUp, Timer, Siren,
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
    <div className="glass-card p-3 text-sm border border-[#1e3a5f]">
      <p className="text-[#8ba3c7] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#22d3ee" : "#8ba3c7" }}>
          {entry.name === "current" ? `${now}: ` : `${now - 1}: `}{formatCurrency(entry.value)} SAR
        </p>
      ))}
    </div>
  );
};

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



type BoardKey = "activeClients" | "completedTasks" | "incompleteTasks" | "overdueTasks";
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

  function initials(name: string): string {
    const trimmed = (name || "").trim();
    if (!trimmed) return "؟";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return (parts[0][0] ?? "") + (parts[1][0] ?? "");
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

  const [activeBoard, setActiveBoard] = useState<BoardKey | null>(null);

  const boardTheme: Record<BoardKey, {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        <ChartSkeleton height={220} />
        <ChartSkeleton height={220} />

      </div>
    </DashboardLayout>
  );

  const kpiCards = [
    {
      key:       "activeClients" as const,
      label:     "العملاء النشطون",
      value:     kpi.activeClients.toString(),
      subtitle:  "عميل نشط حالياً",
      icon:      Users,
      gradient:  "from-cyan-300/65 via-sky-300/45 to-blue-400/65",
      iconBg:    "bg-cyan-500/15",
      iconColor: "text-blue-400",
    },
    {
      key:       "completedTasks" as const,
      label:     "المهام المكتملة",
      value:     `${kpi.completedTasksPct}%`,
      subtitle:  "نسبة الإنجاز",
      icon:      CheckCircle2,
      gradient:  "from-emerald-300/65 via-green-300/45 to-teal-400/65",
      iconBg:    "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      key:       "incompleteTasks" as const,
      label:     "المهام المتبقية",
      value:     kpi.incompleteTasks.toString(),
      subtitle:  "مهمة لم تُكتمل",
      icon:      XCircle,
      gradient:  "from-amber-200/65 via-yellow-300/45 to-amber-400/65",
      iconBg:    "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      key:       "overdueTasks" as const,
      label:     "المهام المتأخرة",
      value:     kpi.overdueTasks.toString(),
      subtitle:  "مهمة تجاوزت الموعد المحدد",
      icon:      AlertTriangle,
      gradient:  kpi.overdueTasks > 0 ? "from-rose-300/70 via-red-300/45 to-rose-500/65" : "from-emerald-300/65 via-green-300/45 to-teal-400/65",
      iconBg:    kpi.overdueTasks > 0 ? "bg-red-500/20" : "bg-emerald-500/20",
      iconColor: kpi.overdueTasks > 0 ? "text-red-400" : "text-emerald-400",
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card, i) => (
                <div
                  key={i}
                  className={`group relative w-full aspect-square overflow-hidden rounded-3xl border border-white/[0.06] bg-[#070d20]/80 backdrop-blur-xl transition-shadow duration-300 ${boardTheme[card.key].glow}`}
                >
                  {/* Soft ambient color glow + subtle top sheen — replaces stacked borders/overlays */}
                  <div className={`pointer-events-none absolute inset-0 ${boardTheme[card.key].ambient}`} />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_0%,rgba(255,255,255,0.05),transparent_60%)]" />

                  <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 min-w-0">
                    {/* Top: icon orb + live drilldown trigger */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        draggable={false}
                        aria-label={`عرض تفاصيل ${card.label}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onTouchStart={(event) => event.currentTarget.blur()}
                        onClick={() => setActiveBoard(card.key)}
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full leading-none select-none cursor-pointer touch-manipulation transition-colors ${boardTheme[card.key].livePill}`}
                        style={DISABLE_TEXT_SELECT_STYLE}
                      >
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        <span className="select-none" style={DISABLE_TEXT_SELECT_STYLE}>مباشر</span>
                      </button>
                      <div
                        className={`grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${boardTheme[card.key].orb}`}
                      >
                        <card.icon size={19} className={card.iconColor} />
                      </div>
                    </div>

                    {/* Hero: dominant KPI value + caption */}
                    <div className="min-w-0">
                      <div className="font-heading font-bold tracking-tight text-white leading-[0.9] text-[36px] sm:text-[54px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                        {card.value}
                      </div>
                      <div className="mt-1.5 text-[12.5px] font-medium text-white/80 truncate">{card.label}</div>
                      <div className="text-[10.5px] text-white/40 truncate">{card.subtitle}</div>
                    </div>

                    {/* Footer: single clean live insight line */}
                    <div className="min-w-0 text-[11px]">
                      {card.key === "activeClients" && (
                        <div className={`flex items-center gap-1.5 ${boardTheme[card.key].accent}`}>
                          <TrendingUp size={13} className="shrink-0" />
                          <span className="truncate">{latestClient ? `آخر عميل: ${latestClient.name}` : "لا يوجد عميل جديد"}</span>
                        </div>
                      )}
                      {card.key === "completedTasks" && (
                        <div className={`flex items-center gap-1.5 ${boardTheme[card.key].accent}`}>
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span className="truncate">معدل إنجاز مستقر اليوم</span>
                        </div>
                      )}
                      {card.key === "incompleteTasks" && (
                        <div className={`flex items-center gap-2 ${boardTheme[card.key].accent}`}>
                          <div className="h-1.5 w-12 shrink-0 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-300/80" style={{ width: `${Math.min(100, Math.max(8, (kpi.incompleteTasks / Math.max(tasks.length, 1)) * 100))}%` }} />
                          </div>
                          <span className="truncate">متبقي {kpi.incompleteTasks} من {tasks.length || 0}</span>
                        </div>
                      )}
                      {card.key === "overdueTasks" && (
                        <div className={`flex items-center gap-1.5 ${boardTheme[card.key].accent}`}>
                          <Siren size={13} className="shrink-0" />
                          <span className="truncate">{kpi.overdueTasks > 0 ? "تتطلب متابعة فورية" : "لا يوجد تعثر حرج"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 glass-card relative overflow-hidden p-6 min-h-[180px]">
            <JellyfishBackground />
            <div className="relative z-10"><div className="text-2xl mb-2">👋</div><h2 className="text-xl font-heading font-bold text-white mb-1">مرحباً {user?.name ?? "..."}</h2><p className="text-[#8ba3c7] text-sm mb-1">{roleLabel}</p><p className="text-xs text-[#6b87ab]">اليوم هو {todayArabic()}</p><p className="text-xs text-[#22d3ee] mt-2 font-medium">نحو إنجازات أكبر وأداء أفضل</p></div>
          </div>
          <div className="glass-card p-5 flex flex-col items-center justify-center"><h3 className="text-[#8ba3c7] text-sm mb-4">معدل رضا العملاء</h3>{kpiLoading ? <div className="w-32 h-32 rounded-full border-8 border-[#1e3a5f] flex items-center justify-center"><span className="text-[#8ba3c7] text-xs">جارٍ التحميل...</span></div> : <><div className="relative w-32 h-32"><svg viewBox="0 0 120 120" className="w-full h-full -rotate-90"><circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" /><circle cx="60" cy="60" r="50" fill="none" stroke="url(#satGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * (satisfactionPct / 100)} ${2 * Math.PI * 50 * (1 - satisfactionPct / 100)}`} /><defs><linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs></svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-heading font-bold text-white">{satisfactionPct}%</span><span className="text-xs font-medium" style={{ color: satisfactionPct >= 70 ? "#10b981" : satisfactionPct >= 40 ? "#f59e0b" : "#ef4444" }}>{satisfactionPct >= 70 ? "ممتاز" : satisfactionPct >= 40 ? "متوسط" : "يحتاج تحسين"}</span></div></div><p className="text-xs text-[#8ba3c7] mt-3 text-center">{clients.filter((c) => c.status === "نشط" || c.status === "متعاقد").length} من {clients.length} عميل نشط/متعاقد</p></>}</div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium text-sm">ملخص سريع</h3><span className="badge status-active">مباشر</span></div><div className="space-y-3"><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">إجمالي الموظفين</span><span className="text-white font-bold text-sm">{employees.length}</span></div><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">الموظفون النشطون</span><span className="text-emerald-400 font-bold text-sm">{employees.filter((e) => e.status === "نشط").length}</span></div><div className="flex justify-between items-center py-2 border-b border-[#1e3a5f]"><span className="text-xs text-[#8ba3c7]">إجمالي العملاء</span><span className="text-[#22d3ee] font-bold text-sm">{clients.length}</span></div><div className="flex justify-between items-center"><span className="text-xs text-[#8ba3c7]">صافي الدخل</span><span className="font-bold text-sm" style={{ color: kpi.netProfit >= 0 ? "#10b981" : "#ef4444" }}>{formatCurrency(kpi.netProfit)} SAR</span></div></div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5"><div className="flex items-center justify-between mb-5"><h3 className="text-white font-medium">نظرة عامة على الإيرادات</h3><span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">آخر 12 شهر</span></div><ResponsiveContainer width="100%" height={220}><LineChart data={salesData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" /><XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} /><YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><Tooltip content={<CustomTooltip />} /><Legend formatter={(v) => v === "current" ? String(currentYear) : String(currentYear - 1)} /><Line type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" /><Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" /></LineChart></ResponsiveContainer></div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-5"><h3 className="text-white font-medium text-sm">الموظفون بالقسم</h3><span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">{employees.filter((e) => e.status === "نشط").length} نشط</span></div>{activeUsersData.length === 0 ? <div className="flex items-center justify-center h-[220px] text-[#8ba3c7] text-sm">لا توجد بيانات</div> : <ResponsiveContainer width="100%" height={220}><BarChart data={activeUsersData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" /><XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} /><YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} /><Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} /><Bar dataKey="users" fill="#1e6fd9" radius={[4, 4, 0, 0]} name="موظف نشط" /></BarChart></ResponsiveContainer>}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium">المشاريع النشطة</h3><button className="text-[#22d3ee] text-xs hover:underline">عرض الكل</button></div>{projLoad ? <ChartSkeleton height={180} /> : projects.length === 0 ? <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد مشاريع بعد</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#1e3a5f]">{["المشروع", "العميل", "التقدم", "الميزانية", "الموعد", "الحالة"].map((h) => <th key={h} className="text-right text-[#8ba3c7] font-medium pb-3">{h}</th>)}</tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0"><td className="py-3"><span className="text-white font-medium">{project.name}</span></td><td className="py-3 text-[#8ba3c7]">{project.clientName}</td><td className="py-3"><div className="flex items-center gap-2"><div className="progress-bar w-20"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.progress === 100 ? "#10b981" : "linear-gradient(90deg,#22d3ee,#1e6fd9)" }} /></div><span className="text-xs text-[#8ba3c7]">{project.progress}%</span></div></td><td className="py-3 text-[#8ba3c7] text-xs">{formatCurrency(project.budget)} SAR</td><td className="py-3 text-[#8ba3c7] text-xs">{project.deadline}</td><td className="py-3"><span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>{project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}</span></td></tr>)}</tbody></table></div>}</div>
          <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-medium text-sm">النشاطات الأخيرة</h3></div>{actLoad ? <CardSkeleton rows={5} /> : activities.length === 0 ? <div className="py-8 text-center text-[#8ba3c7] text-sm">لا توجد نشاطات بعد</div> : <div className="space-y-3">{activities.map((activity) => <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-[#1e3a5f]/40 last:border-0 last:pb-0"><div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1a3356] text-[#22d3ee]">{activityIcons[activity.type] ?? <Activity size={14} />}</div><div className="flex-1 min-w-0"><p className="text-sm text-white leading-snug">{activity.description}</p><div className="flex items-center gap-1 mt-1 text-xs text-[#6b87ab]"><Clock size={10} /><span>{timeAgo(activity.timestamp)}</span></div></div></div>)}</div>}</div>
        </div>
        {activeBoard && (
          <div className="fixed inset-0 z-50 bg-[#030913]/65 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-5" dir="rtl">
            <div className={`w-[calc(100vw-24px)] sm:w-full sm:max-w-4xl rounded-[28px] border bg-[linear-gradient(145deg,rgba(16,29,50,.88),rgba(6,16,30,.9))] backdrop-blur-2xl p-4 sm:p-6 max-h-[82vh] overflow-y-auto mb-20 sm:mb-0 ${boardTheme[activeBoard].panelBorder}`}>
              <div className="flex items-start justify-between mb-5 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${boardTheme[activeBoard].iconTile}`}>
                    {activeBoard === "activeClients" ? <Users size={20} className={boardTheme[activeBoard].iconColor} /> : activeBoard === "completedTasks" ? <CheckCircle size={20} className={boardTheme[activeBoard].iconColor} /> : activeBoard === "incompleteTasks" ? <Timer size={20} className={boardTheme[activeBoard].iconColor} /> : <AlertTriangle size={20} className={boardTheme[activeBoard].iconColor} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{kpiCards.find((c) => c.key === activeBoard)?.label}</h3>
                    <p className="text-[#9db1cf] text-xs mt-0.5">لوحة تنفيذية مباشرة وتفاصيل مركزة</p>
                    <span className={`inline-flex mt-2 items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border ${boardTheme[activeBoard].livePill}`}><Sparkles size={11} />مباشر</span>
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
                <h4 className="text-white text-sm mb-2">تفاصيل الصبورة</h4>
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
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${boardTheme[activeBoard].livePill}`}>{activeBoard === "overdueTasks" ? "حرج" : activeBoard === "completedTasks" ? "مكتمل" : activeBoard === "incompleteTasks" ? "قيد التنفيذ" : "عميل"}</span>
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
