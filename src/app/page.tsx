"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, CheckCircle2, ArrowUpRight, XCircle,
  DollarSign, Activity, Clock, UserCheck, Star,
} from "lucide-react";
import { mockSalesData, mockActiveUsersData } from "@/lib/mockData";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { useDashboardKPI, useProjects, useActivities } from "@/hooks/useData";
import { KPICardSkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

// ─── Tooltip ────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm border border-[#1e3a5f]">
      <p className="text-[#8ba3c7] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-medium" style={{ color: entry.name === "current" ? "#22d3ee" : "#8ba3c7" }}>
          {entry.name === "current" ? "2024: " : "2023: "}{formatCurrency(entry.value)} SAR
        </p>
      ))}
    </div>
  );
};

// ─── Status colours ──────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  "قيد_التنفيذ": "status-pending",
  "مكتمل":       "status-completed",
  "متوقف":       "status-inactive",
};

const activityIcons: Record<string, React.ReactNode> = {
  employee: <Users      size={14} />,
  task:     <CheckCircle2 size={14} />,
  client:   <UserCheck  size={14} />,
  finance:  <DollarSign size={14} />,
  project:  <Activity   size={14} />,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { kpi, loading: kpiLoading }           = useDashboardKPI();
  const { data: projects, loading: projLoad }  = useProjects();
  const { data: activities, loading: actLoad } = useActivities();

  // KPI card definitions (values come from hook)
  const kpiCards = [
    {
      label:     "عدد العملاء المشتركين",
      value:     kpi.activeClients.toString(),
      change:    5.3,
      subtitle:  "من الشهر الماضي",
      icon:      Users,
      gradient:  "from-[#1e6fd9] to-[#0d4fa0]",
      iconBg:    "bg-blue-500/20",
      iconColor: "text-blue-400",
      negative:  false,
    },
    {
      label:     "المهام المكتملة",
      value:     `${kpi.completedTasksPct}%`,
      change:    8.7,
      subtitle:  "من الشهر الماضي",
      icon:      CheckCircle2,
      gradient:  "from-[#10b981] to-[#059669]",
      iconBg:    "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      negative:  false,
    },
    {
      label:     "المهام غير المكتملة",
      value:     kpi.incompleteTasks.toString(),
      change:    -3.1,
      subtitle:  "مهمة متبقية",
      icon:      XCircle,
      gradient:  "from-[#f59e0b] to-[#d97706]",
      iconBg:    "bg-amber-500/20",
      iconColor: "text-amber-400",
      negative:  true,
    },
    {
      label:    "إجمالي الأرباح",
      value:    kpi.netProfit >= 1_000_000
        ? `${(kpi.netProfit / 1_000_000).toFixed(2)}M`
        : formatCurrency(kpi.netProfit),
      change:    12.5,
      subtitle:  "SAR صافي الربح",
      icon:      DollarSign,
      gradient:  "from-[#22d3ee] to-[#1e6fd9]",
      iconBg:    "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      negative:  false,
    },
  ] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── KPI Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading
            ? Array.from({ length: 4 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiCards.map((card, i) => (
                <div key={i} className="glass-card glass-card-hover p-5 relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl ${card.iconBg}`}>
                      <card.icon size={20} className={card.iconColor} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${card.negative ? "text-amber-400" : "text-emerald-400"}`}>
                      <ArrowUpRight size={13} />
                      <span>{card.negative ? card.change : `+${card.change}`}%</span>
                    </div>
                  </div>
                  <div className="text-2xl font-heading font-bold text-white mb-1">{card.value}</div>
                  <div className="text-sm text-[#8ba3c7] mb-1">{card.label}</div>
                  <div className="text-xs text-[#6b87ab]">{card.subtitle}</div>
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />
                </div>
              ))}
        </div>

        {/* ── Welcome + Satisfaction + Referrals ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Welcome */}
          <div className="lg:col-span-1 glass-card relative overflow-hidden p-6 min-h-[180px]">
            <JellyfishBackground />
            <div className="relative z-10">
              <div className="text-2xl mb-2">👋</div>
              <h2 className="text-xl font-heading font-bold text-white mb-1">مرحباً أحمد</h2>
              <p className="text-[#8ba3c7] text-sm mb-1">مدير عام</p>
              <p className="text-xs text-[#6b87ab]">اليوم هو 15 مايو 2024</p>
              <p className="text-xs text-[#22d3ee] mt-2 font-medium">نحو إنجازات أكبر وأداء أفضل</p>
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="glass-card p-5 flex flex-col items-center justify-center">
            <h3 className="text-[#8ba3c7] text-sm mb-4">معدل رضا العملاء</h3>
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e3a5f" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#satGrad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50 * 0.95} ${2 * Math.PI * 50 * 0.05}`}
                />
                <defs>
                  <linearGradient id="satGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-heading font-bold text-white">95%</span>
                <span className="text-xs text-emerald-400 font-medium">ممتاز</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-400">
              <ArrowUpRight size={12} />
              <span>+5% من الشهر الماضي</span>
            </div>
          </div>

          {/* Referral Tracking */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm">تتبع الإحالات</h3>
              <span className="badge status-active">نشطة</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-[#8ba3c7] mb-1">
                  <span>درجة الإحالات</span>
                  <span className="text-[#22d3ee] font-bold">4.8/5</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= 4 ? "star-gold fill-amber-400" : "text-[#1e3a5f]"} fill={s <= 4 ? "#fbbf24" : "none"} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-t border-[#1e3a5f]">
                <span className="text-xs text-[#8ba3c7]">إجمالي الإحالات</span>
                <span className="text-white font-bold text-sm">248</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#8ba3c7]">هذا الشهر</span>
                <span className="text-[#22d3ee] font-bold text-sm">+32</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                <ArrowUpRight size={11} />
                <span>+5% من الشهر الماضي</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-medium">نظرة عامة على المبيعات</h3>
              <span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">آخر 12 شهر</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="month"    tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => v === "current" ? "2024" : "2023"} />
                <Line type="monotone" dataKey="current"  stroke="#22d3ee" strokeWidth={2.5} dot={false} name="current" />
                <Line type="monotone" dataKey="previous" stroke="#1e3a5f" strokeWidth={1.5} dot={false} name="previous" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-medium text-sm">المستخدمون النشطون</h3>
              <span className="text-xs text-[#8ba3c7] bg-[#1a3356]/50 px-2 py-1 rounded-lg">آخر 30 يوم</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockActiveUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} />
                <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" }}
                  labelStyle={{ color: "#8ba3c7" }}
                />
                <Bar dataKey="users" fill="#1e6fd9" radius={[4, 4, 0, 0]} name="مستخدم" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Projects + Activity ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Projects */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">المشاريع النشطة</h3>
              <button className="text-[#22d3ee] text-xs hover:underline">عرض الكل</button>
            </div>
            {projLoad ? (
              <ChartSkeleton height={180} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      {["المشروع", "العميل", "التقدم", "الميزانية", "الموعد النهائي", "الحالة"].map((h) => (
                        <th key={h} className="text-right text-[#8ba3c7] font-medium pb-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id} className="table-row border-b border-[#1e3a5f]/40 last:border-0">
                        <td className="py-3"><span className="text-white font-medium">{project.name}</span></td>
                        <td className="py-3 text-[#8ba3c7]">{project.clientName}</td>
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
                            <span className="text-xs text-[#8ba3c7]">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-[#8ba3c7] text-xs">{formatCurrency(project.budget)} SAR</td>
                        <td className="py-3 text-[#8ba3c7] text-xs">{project.deadline}</td>
                        <td className="py-3">
                          <span className={`badge ${statusColors[project.status] ?? "status-pending"}`}>
                            {project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium text-sm">النشاطات الأخيرة</h3>
              <button className="text-[#22d3ee] text-xs hover:underline">عرض الجميع</button>
            </div>
            {actLoad ? (
              <CardSkeleton rows={5} />
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-[#1e3a5f]/40 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#1a3356] text-[#22d3ee]">
                      {activityIcons[activity.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white leading-snug">{activity.description}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[#6b87ab]">
                        <Clock size={10} />
                        <span>{timeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
