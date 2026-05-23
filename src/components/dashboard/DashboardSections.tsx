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
import {
  WS_CARD, WS_SURFACE, WS_SECTION_TITLE, WS_ICON_ORB, WS_AI_PILL, WS_MUTED,
  WS_TINTS, type KpiAccent,
} from "@/components/ui/workspaceVisual";
import { QuickActionTile, WorkspaceEmptyInline } from "@/components/ui/workspaceUi";

const TOOLTIP_STYLE = { background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#e2e8f0" };

export function DashboardPremiumEmpty({
  title = "لا توجد بيانات كافية بعد",
  subtitle = "ابدأ بإضافة عميل أو مهمة لتفعيل التحليلات",
  hint = "سيتم بناء المؤشرات تلقائياً بعد إدخال البيانات",
  accent = "cyan" as KpiAccent,
  className,
}: {
  title?: string;
  subtitle?: string;
  hint?: string;
  accent?: KpiAccent;
  className?: string;
}) {
  const t = WS_TINTS[accent];
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-10 text-center", className)}>
      <span className={cn(WS_ICON_ORB, "h-12 w-12", t.orb)}>
        <Activity size={22} className={t.icon} />
      </span>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className={cn(WS_MUTED, "max-w-xs text-xs")}>{subtitle}</p>
      <p className="text-[11px] text-cyan-200/50">{hint}</p>
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
  const empty = total === 0;

  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>توزيع المهام</h3>
          <p className="mt-0.5 text-[11px] text-[#6b87ab]">ماذا يحدث في فريقك الآن؟</p>
        </div>
        <span className={cn(WS_ICON_ORB, "h-9 w-9 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/25")}>
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
              <span className="text-xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-[#8ba3c7]">مهمة</span>
            </div>
          </div>

          <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="bg-emerald-400/85" style={{ width: pct(completed) }} />
            <div className="bg-amber-400/85" style={{ width: pct(pending) }} />
            <div className="bg-rose-400/85" style={{ width: pct(overdue) }} />
          </div>

          <div className="space-y-2.5">
            {[
              { label: "مكتملة", value: completed, dot: "bg-emerald-400", hint: "منجزة بنجاح" },
              { label: "متبقية", value: pending, dot: "bg-amber-400", hint: "قيد المتابعة" },
              { label: "متأخرة", value: overdue, dot: "bg-rose-400", hint: "تحتاج إجراء" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-[#8ba3c7]">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", row.dot)} />
                  <span>
                    {row.label}
                    <span className="mr-1.5 text-[10px] text-white/35">· {row.hint}</span>
                  </span>
                </span>
                <span className="shrink-0 font-bold text-white">{row.value}</span>
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
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5 lg:col-span-2")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={WS_SECTION_TITLE}>تحليل الأداء</h3>
          <p className="mt-0.5 text-[11px] text-[#6b87ab]">اتجاه الإيرادات — لماذا يهم؟ لقياس نمو المنشأة</p>
        </div>
        <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-[#8ba3c7]">
          آخر 12 شهر
        </span>
      </div>

      {!hasRevenueData ? (
        <DashboardPremiumEmpty accent="cyan" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
            <XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
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
  return (
    <div className={cn(WS_CARD, "flex flex-col p-4 sm:p-5")}>
      <div className="mb-4">
        <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>النشاط الأخير</h3>
        <p className="mt-0.5 text-[11px] text-[#6b87ab]">آخر تحركات الفريق — تابع ما يحدث لحظياً</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <DashboardPremiumEmpty
          title="لا توجد نشاطات بعد"
          subtitle="ستظهر هنا تحديثات المهام والعملاء"
          hint="أضف مهمة أو عميلاً لبدء السجل"
          accent="violet"
          className="py-6"
        />
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-colors hover:border-white/[0.1]"
            >
              <div className={cn(WS_ICON_ORB, "h-9 w-9 shrink-0 bg-cyan-400/10 ring-1 ring-cyan-300/20 text-[#22d3ee]")}>
                {activityIcons[activity.type] ?? <Activity size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-white">{activity.description}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6b87ab]">
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
  return (
    <section className={cn(WS_SURFACE, "p-4 sm:p-5")}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_92%_-20%,rgba(124,58,237,0.16),transparent_55%),radial-gradient(110%_120%_at_5%_120%,rgba(34,211,238,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="order-first flex shrink-0 items-center justify-center sm:order-last sm:w-20">
          <div className="relative grid h-16 w-16 place-items-center rounded-full bg-violet-500/10 ring-1 ring-violet-300/25">
            <span className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.45),transparent_70%)] blur-md" />
            <Bot size={28} className="relative text-violet-200" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles size={16} className="shrink-0 text-violet-300" />
              <div className="min-w-0">
                <h2 className={cn(WS_SECTION_TITLE, "text-sm")}>رؤى ذكية من AI</h2>
                <p className="text-[11px] text-[#6b87ab]">ماذا تفعل الآن؟ توصيات مبنية على بياناتك</p>
              </div>
            </div>
            <Link href="/ai" className={cn("shrink-0", WS_AI_PILL)}>
              عرض جميع الرؤى <ArrowLeft size={14} />
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {insights.map((ins, i) => (
              <li
                key={i}
                className="flex min-w-0 items-start gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur-sm"
              >
                <span className={cn(WS_ICON_ORB, "h-8 w-8 shrink-0", WS_TINTS[ins.tint].orb)}>
                  <ins.icon size={15} className={WS_TINTS[ins.tint].icon} />
                </span>
                <p className="min-w-0 text-sm leading-snug text-[#dbe6f7]">{ins.text}</p>
              </li>
            ))}
          </ul>
          {showInternalEmployees && employeeNames.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#8ba3c7]">موظفون نشطون:</span>
              {employeeNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/80"
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
  return (
    <section className={cn(WS_SURFACE, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className={cn(WS_SECTION_TITLE, "text-sm")}>اختصارات سريعة</h2>
          <p className="text-[11px] text-[#6b87ab]">نفّذ أهم الإجراءات بضغطة واحدة</p>
        </div>
      </div>
      <div className="flex items-stretch gap-3">
        <Link
          href="/tasks"
          aria-label="إنشاء سريع"
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
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>أداء الفريق بالقسم</h3>
          <p className="text-[11px] text-[#6b87ab]">توزيع الموظفين النشطين</p>
        </div>
        <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-[#8ba3c7]">{activeCount} نشط</span>
      </div>
      {data.length === 0 ? (
        <DashboardPremiumEmpty accent="cyan" className="py-4" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.4)" />
            <XAxis dataKey="date" tick={{ fill: "#8ba3c7", fontSize: 10 }} />
            <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
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
  return (
    <div className={cn(WS_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={cn(WS_SECTION_TITLE, "text-sm")}>ملخص المنشأة</h3>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
          مباشر
        </span>
      </div>
      <div className="space-y-3">
        {[
          ["إجمالي الموظفين", String(employeesCount), "text-white"],
          ["الموظفون النشطون", String(activeEmployees), "text-emerald-400"],
          ["إجمالي العملاء", String(clientsCount), "text-cyan-300"],
          ["صافي الدخل", `${formatCurrency(netProfit)} SAR`, netProfit >= 0 ? "text-emerald-400" : "text-rose-400"],
        ].map(([label, val, color]) => (
          <div key={label} className="flex items-center justify-between border-b border-white/[0.06] py-2 last:border-0">
            <span className="text-xs text-[#8ba3c7]">{label}</span>
            <span className={cn("text-sm font-bold", color)}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSatisfactionRing({ pct, clientsLine }: { pct: number; clientsLine: string }) {
  return (
    <div className={cn(WS_CARD, "flex flex-col items-center justify-center p-4 sm:p-5")}>
      <h3 className="mb-1 text-sm text-[#8ba3c7]">مؤشر نشاط العملاء</h3>
      <p className="mb-4 text-[10px] text-[#6b87ab]">نسبة العملاء النشطين/المتعاقدين</p>
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
          <span className="text-2xl font-heading font-bold text-white sm:text-3xl">{pct}%</span>
          <span
            className="text-[10px] font-medium"
            style={{ color: pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444" }}
          >
            {pct >= 70 ? "ممتاز" : pct >= 40 ? "متوسط" : "يحتاج تحسين"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-[#8ba3c7]">{clientsLine}</p>
    </div>
  );
}
