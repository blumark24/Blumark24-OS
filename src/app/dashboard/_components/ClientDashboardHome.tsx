"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  Headphones,
  Layers,
  LineChart as LineChartIcon,
  Lock,
  Network,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardLayout from "@/components/layout/DashboardLayout";
import JellyfishBackground from "@/components/jellyfish/JellyfishBackground";
import { CardSkeleton, ChartSkeleton, KPICardSkeleton } from "@/components/ui/Skeleton";
import {
  WS_CARD,
  WS_ICON_ORB,
  WS_INNER_CARD,
  WS_PAGE,
  WS_SECTION_TITLE,
  WS_SURFACE,
} from "@/components/ui/workspaceVisual";
import { useAuth } from "@/contexts/AuthContext";
import { mapAuthRoleToUserRole, usePermissions } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useProfileOrgDepartment } from "@/hooks/useProfileOrgDepartment";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import {
  useActivities,
  useClients,
  useDashboardKPI,
  useEmployees,
  useProjects,
  useTasks,
  useTransactions,
} from "@/hooks/useData";
import { PLAN_LABELS_AR, type PlanSlug } from "@/lib/features/packageFeatures";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import type { Activity as ActivityRow, Project, Task } from "@/types";

type SmartWindowId = "subscription" | "payment" | "services" | "health" | "support" | "reports";
type StatusTone = "good" | "info" | "warning" | "muted" | "danger";

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const TOOLTIP_STYLE = {
  background: "#0d1f3c",
  border: "1px solid rgba(34,211,238,0.22)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

const WINDOW_TITLES: Record<SmartWindowId, string> = {
  subscription: "نافذة الاشتراك",
  payment: "نافذة الدفع",
  services: "نافذة الخدمات",
  health: "نافذة صحة المنشأة",
  support: "نافذة الدعم",
  reports: "نافذة التقارير",
};

function todayArabic() {
  const d = new Date();
  return `${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function statusFromOrg(status: string | null): { label: string; tone: StatusTone } {
  if (status === "active") return { label: "نشطة", tone: "good" };
  if (status === "trial") return { label: "تجريبية", tone: "info" };
  if (status === "suspended") return { label: "معلقة", tone: "warning" };
  if (status === "cancelled") return { label: "ملغاة", tone: "danger" };
  return { label: "غير متاح", tone: "muted" };
}

function StatusBadge({ label, tone = "muted" }: { label: string; tone?: StatusTone }) {
  const cls: Record<StatusTone, string> = {
    good: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    info: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
    warning: "border-amber-300/25 bg-amber-400/10 text-amber-200",
    danger: "border-rose-300/25 bg-rose-400/10 text-rose-200",
    muted: "border-white/[0.10] bg-white/[0.04] text-[#b8c7dd]",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls[tone])}>
      {label}
    </span>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "info",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: StatusTone;
}) {
  const iconTone: Record<StatusTone, string> = {
    good: "text-emerald-300 bg-emerald-400/10 ring-emerald-300/20",
    info: "text-cyan-300 bg-cyan-400/10 ring-cyan-300/20",
    warning: "text-amber-300 bg-amber-400/10 ring-amber-300/20",
    danger: "text-rose-300 bg-rose-400/10 ring-rose-300/20",
    muted: "text-[#8ba3c7] bg-white/[0.04] ring-white/[0.08]",
  };

  return (
    <div className={cn(WS_CARD, "min-h-[138px] p-4")}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className={cn("grid h-10 w-10 place-items-center rounded-2xl ring-1", iconTone[tone])}>
            <Icon size={18} />
          </span>
          <StatusBadge label={tone === "muted" ? "لا توجد بيانات بعد" : "مباشر"} tone={tone === "muted" ? "muted" : "info"} />
        </div>
        <div>
          <div className="text-2xl font-extrabold leading-none text-white">{value}</div>
          <div className="mt-2 text-[13px] font-semibold text-white/90">{label}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-[#8ba3c7]">{hint}</div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = cn(
    "group flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-right transition",
    disabled
      ? "cursor-not-allowed border-white/[0.06] bg-white/[0.025] text-white/35"
      : "border-white/[0.10] bg-white/[0.045] text-white hover:border-cyan-300/25 hover:bg-cyan-300/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-300/30",
  );
  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
          <Icon size={16} />
        </span>
        <span className="truncate text-[13px] font-semibold">{label}</span>
      </span>
      {disabled ? <Lock size={14} /> : <ChevronLeft size={15} className="text-cyan-200 transition group-hover:-translate-x-0.5" />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function MiniRow({ label, value, tone = "muted" }: { label: string; value: ReactNode; tone?: StatusTone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <span className="text-[12px] text-[#8ba3c7]">{label}</span>
      <span className="text-left text-[12px] font-semibold text-white">
        {typeof value === "string" ? <StatusBadge label={value} tone={tone} /> : value}
      </span>
    </div>
  );
}

function SmartWindow({
  active,
  onClose,
  content,
}: {
  active: SmartWindowId | null;
  onClose: () => void;
  content: Record<SmartWindowId, ReactNode>;
}) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#020817]/70 px-3 pb-3 pt-12 backdrop-blur-md sm:items-center sm:p-5" dir="rtl">
      <section className="max-h-[86dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/[0.12] bg-[linear-gradient(145deg,rgba(12,28,54,.96),rgba(4,11,24,.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.42)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/70">Smart Window</div>
            <h2 className="mt-1 text-lg font-bold text-white">{WINDOW_TITLES[active]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.10] text-[#8ba3c7] transition hover:border-white/25 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
          >
            <X size={18} />
          </button>
        </div>
        {content[active]}
      </section>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-8 text-center">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#8ba3c7]">{detail}</div>
    </div>
  );
}

function ProjectPreview({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <EmptyState title="لا توجد مشاريع بعد" detail="ستظهر المشاريع هنا عند إضافتها من مساحة العمل." />;
  }

  return (
    <div className="space-y-3">
      {projects.slice(0, 4).map((project) => (
        <div key={project.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{project.name}</div>
              <div className="mt-1 truncate text-[11px] text-[#8ba3c7]">{project.clientName || "لا يوجد عميل مرتبط"}</div>
            </div>
            <StatusBadge label={project.status === "قيد_التنفيذ" ? "قيد التنفيذ" : project.status} tone={project.status === "متوقف" ? "warning" : "info"} />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-l from-cyan-300 to-blue-500" style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityPreview({ activities, loading }: { activities: ActivityRow[]; loading: boolean }) {
  if (loading) return <CardSkeleton rows={4} />;
  if (activities.length === 0) {
    return <EmptyState title="لا توجد نشاطات بعد" detail="ستظهر آخر التحديثات عند استخدام المهام والعملاء والمالية." />;
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 6).map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
            <Activity size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="line-clamp-2 text-sm leading-relaxed text-white">{activity.description}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6b87ab]">
              <Clock size={11} />
              {timeAgo(activity.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskFocus({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter((task) => task.status !== "مكتملة")
    .slice(0, 4);

  if (upcoming.length === 0) {
    return <EmptyState title="لا توجد مهام مفتوحة" detail="عند إضافة مهام جديدة ستظهر هنا حسب أحدث البيانات." />;
  }

  return (
    <div className="space-y-3">
      {upcoming.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{task.title}</div>
            <div className="mt-1 text-[11px] text-[#8ba3c7]">{task.assigneeName || "بدون مسؤول"}</div>
          </div>
          <StatusBadge label={task.status === "قيد_التنفيذ" ? "قيد التنفيذ" : task.status} tone={task.status === "متأخرة" ? "danger" : "warning"} />
        </div>
      ))}
    </div>
  );
}

export default function ClientDashboardHome() {
  const { user, loading: authLoading } = useAuth();
  const { userRole } = usePermissions();
  const { kpi, loading: kpiLoading } = useDashboardKPI();
  const { data: clients, loading: clientsLoading } = useClients();
  const { data: tasks, loading: tasksLoading } = useTasks();
  const { data: transactions, loading: txLoading } = useTransactions();
  const { data: employees, loading: employeesLoading } = useEmployees();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: activities, loading: activitiesLoading } = useActivities();
  const { display: departmentDisplay } = useProfileOrgDepartment();
  const { name: companyName, logoUrl: companyLogoUrl } = useTenantCompanyName();
  const {
    planSlug,
    organizationStatus,
    enabledFeatures,
    navRoutes,
    loading: workspaceLoading,
  } = useTenantWorkspace();
  const [activeWindow, setActiveWindow] = useState<SmartWindowId | null>(null);

  const resolvedRole = userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const roleLabel = resolvedRole ? getTenantRoleLabel(resolvedRole) : "عضو الفريق";
  const orgStatus = statusFromOrg(organizationStatus);
  const planLabel = PLAN_LABELS_AR[planSlug as PlanSlug] ?? "غير متاح";
  const anyLoading = authLoading || workspaceLoading || kpiLoading;

  const income = useMemo(
    () => transactions.filter((tx) => tx.type === "دخل").reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );
  const expenses = useMemo(
    () => transactions.filter((tx) => tx.type === "مصروف").reduce((sum, tx) => sum + tx.amount, 0),
    [transactions],
  );
  const monthlyRevenue = useMemo(() => {
    const byMonth: Record<number, number> = {};
    transactions
      .filter((tx) => tx.type === "دخل")
      .forEach((tx) => {
        const month = new Date(tx.date).getMonth();
        if (!Number.isNaN(month)) byMonth[month] = (byMonth[month] ?? 0) + tx.amount;
      });
    return ARABIC_MONTHS.map((month, index) => ({ month, revenue: byMonth[index] ?? 0 }));
  }, [transactions]);

  const activeEmployees = employees.length;
  const activeClients = clients.filter((client) => client.status === "نشط" || client.status === "متعاقد").length;
  const completedTasks = tasks.filter((task) => task.status === "مكتملة").length;
  const overdueTasks = tasks.filter((task) => {
    if (task.status === "متأخرة") return true;
    if (task.status === "مكتملة" || !task.dueDate) return false;
    return new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }).length;
  const serviceCount = enabledFeatures.length;
  const routeSet = useMemo(() => new Set(navRoutes.map((route) => route.href)), [navRoutes]);
  const canOpen = (href: string) => routeSet.has(href);
  const serviceReadyLabel = serviceCount > 0 ? `${serviceCount} خدمات مفعلة` : "قيد التجهيز";
  const serviceTone: StatusTone = serviceCount > 0 ? "good" : "warning";
  const paymentState = "قيد التجهيز";
  const supportState = "قيد التجهيز";

  const nextStep = useMemo(() => {
    if (!organizationStatus) return "استكمال بيانات المنشأة";
    if (overdueTasks > 0) return "راجع المهام المتأخرة";
    if (clients.length === 0) return "ابدأ بإضافة العملاء";
    if (tasks.length === 0) return "أنشئ أول مهمة تشغيلية";
    return "افتح التقارير لمراجعة الأداء";
  }, [clients.length, organizationStatus, overdueTasks, tasks.length]);

  const twinNodes = [
    {
      title: "الشركة",
      icon: Building2,
      status: orgStatus.label,
      tone: orgStatus.tone,
      description: companyName || "غير متاح",
      action: canOpen("/settings") ? { label: "الإعدادات", href: "/settings" } : null,
    },
    {
      title: "الاشتراك",
      icon: ShieldCheck,
      status: planLabel,
      tone: "info" as StatusTone,
      description: `حالة الاشتراك: ${orgStatus.label}`,
      action: { label: "عرض", window: "subscription" as SmartWindowId },
    },
    {
      title: "الفريق",
      icon: Users,
      status: employees.length > 0 ? `${employees.length} نشط` : "لا توجد بيانات بعد",
      tone: employees.length > 0 ? "good" as StatusTone : "muted" as StatusTone,
      description: "الموظفون والأدوار التشغيلية",
      action: canOpen("/employees") ? { label: "فتح", href: "/employees" } : null,
    },
    {
      title: "العملاء",
      icon: Target,
      status: clients.length > 0 ? `${activeClients}/${clients.length}` : "لا توجد بيانات بعد",
      tone: clients.length > 0 ? "good" as StatusTone : "muted" as StatusTone,
      description: "إدارة العلاقات والعملاء",
      action: canOpen("/clients") ? { label: "فتح", href: "/clients" } : null,
    },
    {
      title: "المالية",
      icon: Wallet,
      status: canOpen("/finance") ? "متاحة" : "غير متاح",
      tone: canOpen("/finance") ? "info" as StatusTone : "muted" as StatusTone,
      description: "دخل ومصروفات المنشأة",
      action: canOpen("/finance") ? { label: "فتح", href: "/finance" } : null,
    },
    {
      title: "التقارير",
      icon: BarChart3,
      status: canOpen("/reports") ? "متاحة" : "غير متاح",
      tone: canOpen("/reports") ? "info" as StatusTone : "muted" as StatusTone,
      description: "قراءات مبنية على بياناتك",
      action: canOpen("/reports") ? { label: "فتح", href: "/reports" } : null,
    },
    {
      title: "الدعم",
      icon: Headphones,
      status: supportState,
      tone: "warning" as StatusTone,
      description: "نقطة تواصل مع فريق Blumark24",
      action: { label: "عرض", window: "support" as SmartWindowId },
    },
    {
      title: "الخدمات الذكية",
      icon: Zap,
      status: serviceReadyLabel,
      tone: serviceTone,
      description: "الخدمات المفعلة ضمن باقتك",
      action: { label: "عرض", window: "services" as SmartWindowId },
    },
  ];

  const windowContent: Record<SmartWindowId, ReactNode> = {
    subscription: (
      <div className="space-y-3">
        <MiniRow label="الباقة الحالية" value={planLabel} tone="info" />
        <MiniRow label="حالة المنشأة" value={orgStatus.label} tone={orgStatus.tone} />
        <MiniRow label="الخدمات المفعلة" value={serviceReadyLabel} tone={serviceTone} />
        <p className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3 text-xs leading-relaxed text-[#b8c7dd]">
          هذه نافذة قراءة فقط لحالة الاشتراك الحالية. أي ترقية أو تغيير باقة يتم عبر قنوات الدعم المعتمدة.
        </p>
      </div>
    ),
    payment: (
      <div className="space-y-3">
        <MiniRow label="حالة الدفع الإلكتروني" value={paymentState} tone="warning" />
        <MiniRow label="آخر فاتورة" value="لا توجد بيانات بعد" tone="muted" />
        <MiniRow label="بوابة الدفع" value="غير مفعلة" tone="muted" />
        <p className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-relaxed text-[#d8c49a]">
          لا يوجد دفع مباشر أو رابط Checkout في هذه المرحلة. الدفع الإلكتروني قيد التجهيز.
        </p>
      </div>
    ),
    services: (
      <div className="space-y-3">
        <MiniRow label="جاهزية الخدمات" value={serviceReadyLabel} tone={serviceTone} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {navRoutes.map((route) => (
            <div key={route.href} className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
              <div className="text-sm font-semibold text-white">{route.id === "dashboard" ? "الرئيسية" : route.href}</div>
              <div className="mt-1 text-[11px] text-[#8ba3c7]">متاح ضمن باقتك الحالية</div>
            </div>
          ))}
          {navRoutes.length === 0 && <EmptyState title="لا توجد خدمات مفعلة" detail="ستظهر الخدمات بعد اكتمال إعداد الباقة." />}
        </div>
      </div>
    ),
    health: (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniRow label="العملاء" value={clients.length > 0 ? `${activeClients} نشط/متعاقد` : "لا توجد بيانات بعد"} tone={clients.length > 0 ? "good" : "muted"} />
        <MiniRow label="المهام" value={tasks.length > 0 ? `${completedTasks}/${tasks.length} مكتملة` : "لا توجد بيانات بعد"} tone={tasks.length > 0 ? "info" : "muted"} />
        <MiniRow label="المهام المتأخرة" value={String(overdueTasks)} tone={overdueTasks > 0 ? "danger" : "good"} />
        <MiniRow label="صافي الدخل" value={`${formatCurrency(income - expenses)} SAR`} tone={transactions.length > 0 ? "info" : "muted"} />
      </div>
    ),
    support: (
      <div className="space-y-3">
        <MiniRow label="حالة الدعم" value={supportState} tone="warning" />
        <MiniRow label="طلبات الدعم" value="لا توجد بيانات بعد" tone="muted" />
        <p className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-relaxed text-[#b8c7dd]">
          سيتم ربط مركز الدعم لاحقاً. حالياً استخدم قنوات التواصل المعتمدة من فريق Blumark24.
        </p>
      </div>
    ),
    reports: (
      <div className="space-y-3">
        <MiniRow label="جاهزية التقارير" value={canOpen("/reports") ? "متاحة" : "غير متاح"} tone={canOpen("/reports") ? "info" : "muted"} />
        <MiniRow label="مصادر القراءة" value={`${clients.length} عميل، ${tasks.length} مهمة، ${transactions.length} معاملة`} tone="info" />
        {canOpen("/reports") ? (
          <Link href="/reports" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15">
            فتح التقارير
            <ArrowLeft size={15} />
          </Link>
        ) : (
          <StatusBadge label="قيد التجهيز" tone="warning" />
        )}
      </div>
    ),
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className={cn(WS_PAGE, "min-w-0 max-w-full overflow-x-hidden")}>
          <div className="h-44 rounded-3xl border border-white/[0.06] bg-[#070d20]/70 animate-pulse" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartSkeleton height={240} />
            <CardSkeleton rows={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={cn(WS_PAGE, "min-w-0 max-w-full overflow-x-hidden")}>
        <SmartWindow active={activeWindow} onClose={() => setActiveWindow(null)} content={windowContent} />

        <section className={cn(WS_SURFACE, "p-4 sm:p-5 lg:p-6")}>
          <JellyfishBackground />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_88%_-25%,rgba(34,211,238,0.18),transparent_55%),radial-gradient(90%_90%_at_0%_0%,rgba(30,111,217,0.16),transparent_54%)]" />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
            <div className="flex min-w-0 flex-col justify-between gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                    <Sparkles size={13} />
                    مركز أعمالك الذكي
                  </div>
                  <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                    {companyName || "منشأتك"} داخل Blumark24 OS
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#b8c7dd]">
                    لوحة أعمال موحدة تعرض الاشتراك، الخدمات، صحة المنشأة، والمهام القادمة من بياناتك الفعلية.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] text-sm font-bold text-white">
                    {companyLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={companyLogoUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      (companyName || "م").slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{user.name || user.email}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[#8ba3c7]">{roleLabel} · {departmentDisplay.text}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniRow label="الباقة" value={planLabel} tone="info" />
                <MiniRow label="حالة المنشأة" value={orgStatus.label} tone={orgStatus.tone} />
                <MiniRow label="الدفع" value={paymentState} tone="warning" />
                <MiniRow label="الخطوة التالية" value={<span className="text-cyan-100">{nextStep}</span>} />
              </div>
            </div>

            <aside className="rounded-3xl border border-white/[0.10] bg-[#061426]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-[#8ba3c7]">{todayArabic()}</div>
                  <h2 className="mt-1 text-base font-bold text-white">ملخص اليوم</h2>
                </div>
                <StatusBadge label={anyLoading ? "جار التحميل" : "مباشر"} tone={anyLoading ? "warning" : "good"} />
              </div>
              <div className="space-y-2.5">
                <MiniRow label="جاهزية الخدمات" value={serviceReadyLabel} tone={serviceTone} />
                <MiniRow label="الدعم" value={supportState} tone="warning" />
                <MiniRow label="المهام المتأخرة" value={String(overdueTasks)} tone={overdueTasks > 0 ? "danger" : "good"} />
              </div>
            </aside>
          </div>
        </section>

        <section className={cn(WS_CARD, "p-4 sm:p-5")}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="relative z-10 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>مركز أعمالك الذكي</h2>
              <p className="mt-1 text-xs text-[#8ba3c7]">نظرة مركزة على حالة العميل بدون أرقام وهمية أو وعود غير مفعلة.</p>
            </div>
            <StatusBadge label={nextStep} tone={overdueTasks > 0 ? "warning" : "info"} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MiniRow label="الشركة" value={<span className="max-w-[160px] truncate text-white">{companyName || "غير متاح"}</span>} />
            <MiniRow label="الباقة" value={planLabel} tone="info" />
            <MiniRow label="حالة المنشأة" value={orgStatus.label} tone={orgStatus.tone} />
            <MiniRow label="الدفع" value={paymentState} tone="warning" />
            <MiniRow label="الخدمات" value={serviceReadyLabel} tone={serviceTone} />
            <MiniRow label="الدعم" value={supportState} tone="warning" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricTile icon={Target} label="العملاء" value={clientsLoading ? "…" : String(clients.length)} hint={`${activeClients} نشط/متعاقد`} tone={clients.length > 0 ? "good" : "muted"} />
          <MetricTile icon={CheckCircle2} label="إنجاز المهام" value={tasksLoading ? "…" : `${kpi.completedTasksPct}%`} hint={`${completedTasks} من ${tasks.length} مهمة مكتملة`} tone={tasks.length > 0 ? "info" : "muted"} />
          <MetricTile icon={Users} label="الفريق" value={employeesLoading ? "…" : String(activeEmployees)} hint="موظفون نشطون ضمن منشأتك" tone={employees.length > 0 ? "good" : "muted"} />
          <MetricTile icon={CircleDollarSign} label="صافي الدخل" value={txLoading ? "…" : `${formatCurrency(income - expenses)} SAR`} hint="محسوب من معاملاتك المسجلة" tone={transactions.length > 0 ? "info" : "muted"} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
          <div className={cn(WS_CARD, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>المحاكي الذكي للمنشأة</h2>
                <p className="mt-1 text-xs text-[#8ba3c7]">خريطة خفيفة تربط منشأتك بالخدمات المتاحة وحالتها الحالية.</p>
              </div>
              <Network size={20} className="text-cyan-300" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {twinNodes.map((node) => {
                const Icon = node.icon;
                const action = node.action;
                return (
                  <div key={node.title} className={cn(WS_INNER_CARD, "flex min-h-[150px] flex-col justify-between p-3")}>
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className={`${WS_ICON_ORB} h-9 w-9 text-cyan-200`}>
                          <Icon size={16} />
                        </span>
                        <StatusBadge label={node.status} tone={node.tone} />
                      </div>
                      <div className="text-sm font-bold text-white">{node.title}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8ba3c7]">{node.description}</div>
                    </div>
                    <div className="mt-3">
                      {action?.href ? (
                        <Link href={action.href} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-200 hover:text-cyan-100">
                          {action.label}
                          <ArrowLeft size={12} />
                        </Link>
                      ) : action?.window ? (
                        <button type="button" onClick={() => setActiveWindow(action.window)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-200 hover:text-cyan-100">
                          {action.label}
                          <ArrowLeft size={12} />
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/35">قيد التجهيز</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cn(WS_CARD, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>النوافذ الذكية</h2>
                <p className="mt-1 text-xs text-[#8ba3c7]">نوافذ قراءة فقط لحالة الأعمال الحالية.</p>
              </div>
              <Layers size={20} className="text-cyan-300" />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <ActionButton icon={ShieldCheck} label="نافذة الاشتراك" onClick={() => setActiveWindow("subscription")} />
              <ActionButton icon={CreditCard} label="نافذة الدفع" onClick={() => setActiveWindow("payment")} />
              <ActionButton icon={Zap} label="نافذة الخدمات" onClick={() => setActiveWindow("services")} />
              <ActionButton icon={Activity} label="نافذة صحة المنشأة" onClick={() => setActiveWindow("health")} />
              <ActionButton icon={Headphones} label="نافذة الدعم" onClick={() => setActiveWindow("support")} />
              <ActionButton icon={BarChart3} label="نافذة التقارير" onClick={() => setActiveWindow("reports")} />
            </div>
          </div>
        </section>

        <section className={cn(WS_CARD, "p-4 sm:p-5")}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>ماذا تريد أن تفعل اليوم؟</h2>
              <p className="mt-1 text-xs text-[#8ba3c7]">إجراءات سريعة بدون روابط مكسورة أو عمليات غير جاهزة.</p>
            </div>
            <ArrowLeft size={18} className="text-cyan-300" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionButton icon={Receipt} label="راجع الاشتراك" onClick={() => setActiveWindow("subscription")} />
            <ActionButton icon={CreditCard} label="حالة الدفع" onClick={() => setActiveWindow("payment")} />
            <ActionButton icon={BarChart3} label="افتح التقارير" href={canOpen("/reports") ? "/reports" : undefined} disabled={!canOpen("/reports")} />
            <ActionButton icon={Target} label="تابع العملاء" href={canOpen("/clients") ? "/clients" : undefined} disabled={!canOpen("/clients")} />
            <ActionButton icon={CheckCircle2} label="راجع المهام" href={canOpen("/tasks") ? "/tasks" : undefined} disabled={!canOpen("/tasks")} />
            <ActionButton icon={Headphones} label="الدعم الفني" onClick={() => setActiveWindow("support")} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className={cn(WS_CARD, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>الملخص التشغيلي</h2>
                <p className="mt-1 text-xs text-[#8ba3c7]">قراءة أولية من العملاء والمهام والمالية.</p>
              </div>
              <LineChartIcon size={20} className="text-cyan-300" />
            </div>
            {txLoading ? (
              <ChartSkeleton height={260} />
            ) : transactions.length === 0 ? (
              <EmptyState title="لا توجد معاملات مالية بعد" detail="عند تسجيل الدخل والمصروفات سيظهر الرسم هنا من بياناتك." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis dataKey="month" tick={{ fill: "#8ba3c7", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#8ba3c7", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#8ba3c7" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={3} dot={false} name="الدخل" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={cn(WS_CARD, "p-4 sm:p-5")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>رؤى تشغيلية</h2>
              <StatusBadge label="قواعد بيانات" tone="info" />
            </div>
            <div className="space-y-3">
              <MiniRow label="حالة المهام" value={overdueTasks > 0 ? `${overdueTasks} متأخرة` : tasks.length > 0 ? "مستقرة" : "لا توجد بيانات بعد"} tone={overdueTasks > 0 ? "danger" : tasks.length > 0 ? "good" : "muted"} />
              <MiniRow label="العملاء النشطون" value={clients.length > 0 ? `${activeClients} من ${clients.length}` : "لا توجد بيانات بعد"} tone={clients.length > 0 ? "info" : "muted"} />
              <MiniRow label="التقارير" value={canOpen("/reports") ? "متاحة" : "غير متاح"} tone={canOpen("/reports") ? "info" : "muted"} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className={cn(WS_CARD, "p-4 sm:p-5 xl:col-span-1")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>المهام القريبة</h2>
              {canOpen("/tasks") && <Link href="/tasks" className="text-xs font-semibold text-cyan-200 hover:text-cyan-100">فتح المهام</Link>}
            </div>
            {tasksLoading ? <CardSkeleton rows={4} /> : <TaskFocus tasks={tasks} />}
          </div>

          <div className={cn(WS_CARD, "p-4 sm:p-5 xl:col-span-1")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>مشاريع نشطة</h2>
              <StatusBadge label={projectsLoading ? "جار التحميل" : `${projects.length}`} tone={projects.length > 0 ? "info" : "muted"} />
            </div>
            {projectsLoading ? <CardSkeleton rows={4} /> : <ProjectPreview projects={projects} />}
          </div>

          <div className={cn(WS_CARD, "p-4 sm:p-5 xl:col-span-1")}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={cn(WS_SECTION_TITLE, "text-lg")}>النشاط الأخير</h2>
              <FileText size={18} className="text-cyan-300" />
            </div>
            <ActivityPreview activities={activities} loading={activitiesLoading} />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
