"use client";

import {
  Bell,
  CheckCircle2,
  Mail,
  Menu,
  Search,
  Settings,
  TriangleAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

const glassCard =
  "rounded-[28px] border border-[rgba(34,211,238,.14)] bg-[rgba(7,20,38,.72)] backdrop-blur-[20px] shadow-[0_10px_40px_rgba(0,0,0,.28)]";

export default function DashboardHome() {
  const { metrics: m, loading, error } = useDashboardMetrics();

  const kpis = [
    {
      title: "المهام المكتملة",
      value: `${m?.completedTasksRate ?? 0}%`,
      description: "نسبة الإنجاز",
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      line: "from-emerald-400 to-emerald-500/10",
    },
    {
      title: "العملاء النشطون",
      value: `${m?.activeClients ?? 0}`,
      description: "عميل نشط حالياً",
      icon: Users,
      iconColor: "text-blue-400",
      line: "from-blue-400 to-blue-500/10",
    },
    {
      title: "المهام المتأخرة",
      value: `${m?.overdueTasks ?? 0}`,
      description: "مهمة تجاوزت الموعد المحدد",
      icon: TriangleAlert,
      iconColor: "text-teal-300",
      line: "from-teal-400 to-teal-500/10",
    },
    {
      title: "المهام المتبقية",
      value: `${m?.remainingTasks ?? 0}`,
      description: "مهمة لم تكتمل",
      icon: XCircle,
      iconColor: "text-orange-400",
      line: "from-orange-400 to-orange-500/10",
    },
  ];

  const taskTotal =
    (m?.taskStatusBreakdown.completed ?? 0) +
    (m?.taskStatusBreakdown.inProgress ?? 0) +
    (m?.taskStatusBreakdown.pending ?? 0) +
    (m?.taskStatusBreakdown.overdue ?? 0);

  return (
    <div dir="rtl" className="w-full text-white [font-family:'IBM_Plex_Sans_Arabic','Tajawal',sans-serif]">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-5 space-y-5">
        <header className={`${glassCard} p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-11 w-11 rounded-full bg-[#ff6f3d] text-white font-bold text-xl grid place-items-center">BI</div>
            <button className="text-white/70 hover:text-white transition-colors"><Settings size={20} /></button>
            <button className="text-white/70 hover:text-white transition-colors"><Mail size={20} /></button>
            <button className="relative text-white/70 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-2 -right-2 rounded-full bg-[#ff7b39] px-1.5 py-0.5 text-[10px] font-semibold text-white">5</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button className="h-12 min-w-[140px] px-6 rounded-2xl bg-gradient-to-r from-[#1f8fff] to-[#0ea5e9] text-white text-xl font-semibold">
              جديد +
            </button>
            <div className="h-12 flex-1 md:w-56 lg:w-64 rounded-2xl border border-cyan-400/20 bg-[#05132b]/85 px-3 flex items-center gap-2">
              <Search size={18} className="text-cyan-300" />
              <input placeholder="بحث" className="w-full bg-transparent outline-none text-white/95 placeholder:text-white/55" />
            </div>
            <button className="h-10 w-10 grid place-items-center text-white/70 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {error ? <p className="text-sm text-orange-300">تعذر تحميل بعض المؤشرات</p> : null}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {kpis.map((kpi) => (
            <article key={kpi.title} className={`${glassCard} relative overflow-hidden min-h-[240px] p-5 sm:p-6`}>
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 text-lg leading-none">↗</span>
                <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                  <kpi.icon className={kpi.iconColor} size={30} />
                </div>
              </div>
              <div className="mt-4 text-cyan-300 text-lg">مباشر</div>
              <div className="mt-4 text-[36px] sm:text-[40px] lg:text-[48px] font-semibold leading-none">{loading ? "..." : kpi.value}</div>
              <h3 className="mt-3 text-3xl sm:text-4xl text-white/90 leading-tight">{kpi.title}</h3>
              <p className="mt-1 text-xl sm:text-2xl text-white/55 leading-tight">{kpi.description}</p>
              <div className="mt-5 border-t border-white/10 pt-3 text-white/65 text-base">↗ من الشهر</div>
              <div className={`absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r ${kpi.line}`} />
            </article>
          ))}
        </section>

        <section className={`${glassCard} relative overflow-hidden min-h-[240px] p-5 sm:p-6`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(34,211,238,.22),transparent_55%)]" />
          <div className="absolute left-8 bottom-1 w-[220px] h-[220px] rounded-full bg-cyan-400/15 blur-2xl jellyfish-hero" />
          <div className="absolute left-36 bottom-24 h-16 w-16 rounded-full bg-cyan-300/45 blur-[1px] jellyfish-dot" />

          <div className="relative z-10 max-w-[430px] ms-auto text-right space-y-2">
            <h2 className="text-[36px] sm:text-[42px] lg:text-[50px] font-semibold text-white">مرحباً Blumark24 CEO</h2>
            <p className="text-xl sm:text-2xl text-white/80">مدير أعلى</p>
            <p className="text-xl sm:text-2xl text-white/75">اليوم هو 16 مايو 2026</p>
            <p className="text-2xl sm:text-3xl text-cyan-300">نحو إنجازات أكبر وأداء أفضل</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <article className={`${glassCard} p-5 sm:p-6`}>
            <h3 className="text-2xl text-white/90">معدل رضا العملاء</h3>
            <div className="mt-5 flex justify-center">
              <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#22c55e_0deg,#22c55e_0deg,#123354_0deg)] border border-white/10 grid place-items-center">
                <div className="h-32 w-32 rounded-full bg-[#061a33] grid place-items-center text-[44px] font-semibold">{m?.customerSatisfaction ?? 0}%</div>
              </div>
            </div>
            <p className="mt-4 text-center text-white/70 text-2xl">{m?.customerSatisfaction === null ? "لا توجد بيانات بعد" : "مرضي جداً"}</p>
          </article>

          <article className={`${glassCard} p-5 sm:p-6`}>
            <h3 className="text-2xl text-white/90">المهام حسب الحالة</h3>
            <div className="mt-5 grid grid-cols-[170px_1fr] gap-5 items-center">
              <div className="h-40 w-40 rounded-full mx-auto bg-[conic-gradient(#22c55e_0_60%,#3b82f6_60%_82%,#f59e0b_82%_95%,#ef4444_95%_100%)] p-7">
                <div className="h-full w-full rounded-full bg-[#061a33]" />
              </div>
              <div className="space-y-3 text-lg">
                <p className="text-white/85">مكتملة: {m?.taskStatusBreakdown.completed ?? 0}</p>
                <p className="text-white/85">قيد التنفيذ: {m?.taskStatusBreakdown.inProgress ?? 0}</p>
                <p className="text-white/85">معلقة: {m?.taskStatusBreakdown.pending ?? 0}</p>
                <p className="text-white/85">متأخرة: {m?.taskStatusBreakdown.overdue ?? 0}</p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-white/10 text-white/70 text-2xl">إجمالي المهام: {taskTotal}</div>
          </article>

          <article className={`${glassCard} p-5 sm:p-6`}>
            <h3 className="text-2xl text-white/90">النشاط الأخير</h3>
            <div className="mt-4 space-y-3 min-h-[130px]">
              {(m?.recentActivities.length ?? 0) === 0 ? (
                <p className="text-white/60 text-base">لا توجد أنشطة حديثة</p>
              ) : (
                m?.recentActivities.map((activity) => (
                  <div key={activity.id} className="border-b border-white/10 pb-2">
                    <p className="text-base text-white/85">{activity.action}</p>
                    <p className="text-sm text-white/55">{new Date(activity.created_at).toLocaleString("ar-SA")}</p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className={`${glassCard} p-5 sm:p-6`}>
            <h3 className="text-2xl text-white/90">المبيعات الشهرية</h3>
            <div className="mt-4 text-[48px] font-semibold leading-none">
              {(m?.monthlySales ?? 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 })}
            </div>
            <p className="mt-2 text-emerald-400 text-base">تحديث مباشر للشهر الحالي</p>
            <svg className="mt-5 w-full h-28" viewBox="0 0 320 90" preserveAspectRatio="none">
              <path d="M4 75 L40 57 L75 61 L112 44 L148 49 L182 47 L216 32 L252 36 L288 20 L316 12" fill="none" stroke="#22d3ee" strokeWidth="2.8" />
              <line x1="0" y1="78" x2="320" y2="78" stroke="rgba(255,255,255,.15)" />
            </svg>
          </article>
        </section>
      </div>

      <style jsx>{`
        .jellyfish-hero { animation: jellyFloat 8s ease-in-out infinite; filter: drop-shadow(0 0 20px rgba(34,211,238,.35)); }
        .jellyfish-dot { animation: jellyFloat 8s ease-in-out infinite; opacity: .6; }
        @keyframes jellyFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @media (prefers-reduced-motion: reduce) { .jellyfish-hero, .jellyfish-dot { animation: none !important; } }
      `}</style>
    </div>
  );
}
