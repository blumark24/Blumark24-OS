"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Gauge,
  Headphones,
  LayoutDashboard,
  LineChart,
  Lock,
  Network,
  Radar,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { mapAuthRoleToUserRole, usePermissions } from "@/contexts/PermissionsContext";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { useActivities, useClients, useEmployees, useProjects, useTasks, useTransactions } from "@/hooks/useData";
import { useTenantCompanyName } from "@/hooks/useTenantCompanyName";
import { PLAN_LABELS_AR, type PlanSlug } from "@/lib/features/packageFeatures";
import { getTenantRoleLabel } from "@/lib/tenant/tenantDisplay";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";

type Tone = "cyan" | "purple" | "green" | "red" | "muted";

const NAV_ITEMS: { label: string; icon: LucideIcon; href?: string; active?: boolean }[] = [
  { label: "الرئيسية", icon: LayoutDashboard, href: "/dashboard" },
  { label: "ذكاء الأعمال", icon: Radar, href: "/dashboard/neon-intelligence-preview", active: true },
  { label: "العملاء", icon: Target, href: "/clients" },
  { label: "المشاريع", icon: BriefcaseBusiness },
  { label: "المهام", icon: CheckCircle2, href: "/tasks" },
  { label: "الفريق", icon: Users, href: "/employees" },
  { label: "المالية", icon: CircleDollarSign, href: "/finance" },
  { label: "التقارير", icon: BarChart3, href: "/reports" },
  { label: "المكتب الافتراضي", icon: Building2, href: "/virtual-office" },
  { label: "الأتمتة", icon: Zap, href: "/automation" },
  { label: "الاشتراك", icon: CreditCard },
  { label: "الدعم", icon: Headphones },
  { label: "الإعدادات", icon: Settings, href: "/settings" },
];

function toneClasses(tone: Tone) {
  const map: Record<Tone, { chip: string; icon: string; glow: string; bar: string }> = {
    cyan: {
      chip: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
      icon: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
      glow: "shadow-[0_0_28px_rgba(34,211,238,.18)]",
      bar: "from-cyan-300 to-blue-500",
    },
    purple: {
      chip: "border-violet-300/25 bg-violet-500/12 text-violet-100",
      icon: "border-violet-300/25 bg-violet-500/12 text-violet-200",
      glow: "shadow-[0_0_28px_rgba(139,92,246,.18)]",
      bar: "from-violet-400 to-[#6D4CFF]",
    },
    green: {
      chip: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
      icon: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
      glow: "shadow-[0_0_28px_rgba(34,197,94,.16)]",
      bar: "from-emerald-300 to-cyan-400",
    },
    red: {
      chip: "border-rose-300/25 bg-rose-400/10 text-rose-100",
      icon: "border-rose-300/25 bg-rose-400/10 text-rose-200",
      glow: "shadow-[0_0_28px_rgba(239,68,68,.14)]",
      bar: "from-rose-400 to-violet-500",
    },
    muted: {
      chip: "border-white/[0.10] bg-white/[0.04] text-[#9AA7C7]",
      icon: "border-white/[0.10] bg-white/[0.04] text-[#9AA7C7]",
      glow: "",
      bar: "from-[#374151] to-[#4B5563]",
    },
  };
  return map[tone];
}

function todayLabel() {
  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[rgba(124,92,255,0.22)] bg-[rgba(12,15,38,0.72)] shadow-[0_22px_70px_rgba(0,0,0,.36)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-violet-300/45 to-transparent" />
      {children}
    </section>
  );
}

function StatusChip({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", toneClasses(tone).chip)}>
      {children}
    </span>
  );
}

function IconBox({ icon: Icon, tone = "cyan" }: { icon: LucideIcon; tone?: Tone }) {
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl border", toneClasses(tone).icon, toneClasses(tone).glow)}>
      <Icon size={17} strokeWidth={1.7} />
    </span>
  );
}

function NeonModal({ title, onClose }: { title: string | null; onClose: () => void }) {
  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#02030B]/75 px-3 pb-3 pt-16 backdrop-blur-md sm:items-center sm:p-6" dir="rtl">
      <section className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-violet-300/25 bg-[radial-gradient(circle_at_20%_0%,rgba(109,76,255,.24),transparent_34%),radial-gradient(circle_at_80%_12%,rgba(34,211,238,.16),transparent_32%),linear-gradient(145deg,rgba(8,10,31,.96),rgba(5,6,21,.98))] shadow-[0_32px_90px_rgba(0,0,0,.55)]">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#6D4CFF]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-56 w-56 rounded-full bg-[#22D3EE]/12 blur-3xl" />
        <div className="h-px bg-gradient-to-l from-transparent via-[#8B5CF6] to-transparent" />
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
          <div>
            <StatusChip tone="purple">نافذة ذكية · قيد التجهيز</StatusChip>
            <h2 className="mt-3 text-xl font-black text-white">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#9AA7C7]">
              الميزة قيد التجهيز. هذه معاينة قراءة فقط ولا تنفذ أي عملية أو تعديل على البيانات.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/[0.12] text-[#9AA7C7] transition hover:border-cyan-200/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-300/35"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative z-10 px-5 py-5">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm leading-relaxed text-[#F8FAFC]">
            الميزة قيد التجهيز
          </div>
        </div>
      </section>
    </div>
  );
}

function Sidebar({ routeSet, userName, roleLabel }: { routeSet: Set<string>; userName: string; roleLabel: string }) {
  return (
    <aside className="hidden h-[calc(100dvh-32px)] w-[286px] shrink-0 lg:sticky lg:top-4 lg:block">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-violet-300/20 bg-[#080A1F]/80 p-3 shadow-[0_30px_80px_rgba(0,0,0,.38),0_0_44px_rgba(109,76,255,.10)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3 px-2 py-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6D4CFF] via-[#2563EB] to-[#22D3EE] text-lg font-black text-white shadow-[0_0_34px_rgba(109,76,255,.28)]">
            B
          </div>
          <div>
            <div className="text-base font-black text-white">Blumark24</div>
            <div className="text-[11px] text-[#9AA7C7]">Neon Intelligence OS</div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const enabled = item.active || (item.href ? routeSet.has(item.href) : false);
              const Icon = item.icon;
              const content = (
                <>
                  {item.active && <span className="absolute right-0 top-2 h-[calc(100%-16px)] w-1 rounded-full bg-gradient-to-b from-[#22D3EE] to-[#8B5CF6] shadow-[0_0_18px_rgba(139,92,246,.95)]" />}
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className={cn("h-4 w-4 shrink-0", item.active ? "text-cyan-200" : enabled ? "text-[#9AA7C7] group-hover:text-violet-100" : "text-[#58627D]")} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {!enabled && <Lock size={13} />}
                </>
              );
              const className = cn(
                "group relative flex min-h-11 items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-right text-[13px] transition",
                item.active
                  ? "border-violet-300/25 bg-gradient-to-l from-[#6D4CFF]/24 via-[#2563EB]/10 to-transparent text-white"
                  : enabled
                    ? "border-transparent text-[#9AA7C7] hover:border-white/[0.08] hover:bg-white/[0.045] hover:text-white"
                    : "cursor-not-allowed border-transparent text-[#58627D]",
              );

              if (item.href && enabled) {
                return (
                  <Link key={item.label} href={item.href} className={className}>
                    {content}
                  </Link>
                );
              }
              return (
                <button key={item.label} type="button" disabled className={className}>
                  {content}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-3 rounded-3xl border border-white/[0.10] bg-white/[0.045] p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#6D4CFF] to-[#22D3EE] text-sm font-black text-white">
              {userName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{userName}</div>
              <div className="truncate text-[11px] text-[#9AA7C7]">{roleLabel}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function KpiCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <Panel className="p-4">
      <div className="mb-5 flex items-center justify-between gap-3">
        <IconBox icon={icon} tone={tone} />
        <StatusChip tone={tone}>{value === "—" ? "لا توجد بيانات بعد" : "مباشر"}</StatusChip>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-2 text-sm font-bold text-[#F8FAFC]">{label}</div>
      <div className="mt-1 text-xs leading-relaxed text-[#9AA7C7]">{detail}</div>
    </Panel>
  );
}

function PerformanceChart({
  data,
}: {
  data: { label: string; value: number; tone: Tone }[];
}) {
  const hasData = data.some((item) => item.value > 0);
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <Panel className="p-5 lg:col-span-2">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(124,92,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <StatusChip tone="purple">تحليل تشغيلي</StatusChip>
          <h2 className="mt-3 text-xl font-black text-white">مؤشر أداء المنشأة</h2>
          <p className="mt-1 text-sm text-[#9AA7C7]">رسم مبسط من البيانات المتاحة فقط، بدون مؤشرات وهمية.</p>
        </div>
        <IconBox icon={LineChart} tone="purple" />
      </div>

      {hasData ? (
        <div className="relative z-10 flex h-[300px] items-end gap-3 rounded-[22px] border border-white/[0.08] bg-[#050615]/55 px-4 py-5">
          {data.map((item) => (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn("mx-auto w-full max-w-[54px] rounded-t-2xl bg-gradient-to-t shadow-[0_0_22px_rgba(109,76,255,.16)]", toneClasses(item.tone).bar)}
                  style={{ height: `${Math.max(10, (item.value / max) * 100)}%` }}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-white">{item.value}</div>
                <div className="mt-1 truncate text-[10px] text-[#9AA7C7]">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-10 grid h-[300px] place-items-center rounded-[22px] border border-dashed border-white/[0.14] bg-[#050615]/55 px-4 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-violet-100">
              <Gauge size={21} />
            </div>
            <div className="font-bold text-white">ستظهر المؤشرات عند توفر بيانات فعلية</div>
            <div className="mt-1 text-sm text-[#9AA7C7]">لا توجد بيانات تشغيلية كافية للرسم حالياً.</div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Watchlist({ rows }: { rows: { label: string; value: string; tone: Tone }[] }) {
  return (
    <Panel className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">قائمة متابعة الأعمال</h2>
          <p className="mt-1 text-xs text-[#9AA7C7]">بديل watchlist مخصص للعملاء والمشاريع والتقارير.</p>
        </div>
        <IconBox icon={Target} tone="cyan" />
      </div>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
            <span className="truncate text-sm font-semibold text-white">{row.label}</span>
            <StatusChip tone={row.tone}>{row.value}</StatusChip>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DigitalTwinMini({ nodes }: { nodes: { label: string; value: string; tone: Tone; icon: LucideIcon }[] }) {
  return (
    <Panel className="p-5">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_center,rgba(34,211,238,.16)_0,rgba(34,211,238,.09)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="relative z-10 mb-5 flex items-center justify-between gap-3">
        <div>
          <StatusChip tone="cyan">Digital Twin</StatusChip>
          <h2 className="mt-3 text-lg font-black text-white">الخريطة المصغرة</h2>
        </div>
        <IconBox icon={Network} tone="cyan" />
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <div className="col-span-2 grid min-h-28 place-items-center rounded-[24px] border border-cyan-300/20 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.20),rgba(109,76,255,.10)_42%,rgba(255,255,255,.035))]">
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6D4CFF] to-[#22D3EE] text-sm font-black text-white">B</div>
            <div className="mt-2 text-sm font-bold text-white">الشركة</div>
          </div>
        </div>
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div key={node.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3">
              <Icon className="mb-2 h-4 w-4 text-cyan-200" />
              <div className="text-xs font-bold text-white">{node.label}</div>
              <div className="mt-2"><StatusChip tone={node.tone}>{node.value}</StatusChip></div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SmartActions({
  routeSet,
  onUnavailable,
}: {
  routeSet: Set<string>;
  onUnavailable: (title: string) => void;
}) {
  const actions = [
    { label: "فتح العملاء", href: "/clients", icon: Target },
    { label: "مراجعة المهام", href: "/tasks", icon: CheckCircle2 },
    { label: "عرض التقارير", href: "/reports", icon: BarChart3 },
    { label: "حالة الاشتراك", icon: CreditCard },
    { label: "طلب دعم", icon: Headphones },
  ];

  return (
    <Panel className="p-5">
      <div className="mb-5">
        <h2 className="text-lg font-black text-white">إجراءات ذكية</h2>
        <p className="mt-1 text-xs text-[#9AA7C7]">المتاح يفتح مساره الحقيقي، وغير المتاح يفتح نافذة قراءة فقط.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((action) => {
          const Icon = action.icon;
          const enabled = action.href ? routeSet.has(action.href) : false;
          const content = (
            <>
              <IconBox icon={Icon} tone={enabled ? "cyan" : "purple"} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{action.label}</span>
              {enabled ? <ChevronLeft size={16} className="text-cyan-200" /> : <StatusChip tone="purple">قيد التجهيز</StatusChip>}
            </>
          );
          const className = "flex min-h-[58px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-right transition hover:border-violet-300/25 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-violet-300/30";

          if (action.href && enabled) {
            return (
              <Link key={action.label} href={action.href} className={className}>
                {content}
              </Link>
            );
          }
          return (
            <button key={action.label} type="button" onClick={() => onUnavailable(action.label)} className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function ActivityTable({
  rows,
}: {
  rows: { id: string; name: string; type: string; detail: string; status: string; date: string; tone: Tone }[];
}) {
  if (rows.length === 0) {
    return (
      <Panel className="p-5 lg:col-span-2">
        <div className="grid min-h-[230px] place-items-center rounded-[22px] border border-dashed border-white/[0.14] bg-white/[0.025] px-4 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-violet-100">
              <Activity size={21} />
            </div>
            <div className="font-bold text-white">لا توجد بيانات بعد</div>
            <div className="mt-1 text-sm text-[#9AA7C7]">ستظهر الأنشطة أو المعاملات الفعلية هنا عند توفرها.</div>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-5 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">النشاط الأخير</h2>
          <p className="mt-1 text-sm text-[#9AA7C7]">جدول بيانات حقيقي فقط، بدون صفوف تجريبية.</p>
        </div>
        <StatusChip tone="green">{rows.length} عناصر</StatusChip>
      </div>
      <div className="overflow-hidden rounded-[22px] border border-white/[0.08]">
        <div className="hidden grid-cols-[1.2fr_.7fr_1fr_.7fr_.8fr] gap-3 border-b border-white/[0.08] bg-white/[0.035] px-4 py-3 text-xs font-semibold text-[#9AA7C7] lg:grid">
          <span>العنصر</span>
          <span>النوع</span>
          <span>الوصف</span>
          <span>الحالة</span>
          <span>التاريخ</span>
        </div>
        <div className="divide-y divide-white/[0.07]">
          {rows.map((row) => (
            <div key={row.id} className="grid gap-3 bg-white/[0.025] px-4 py-3 text-sm transition hover:bg-white/[0.045] lg:grid-cols-[1.2fr_.7fr_1fr_.7fr_.8fr] lg:items-center">
              <div className="min-w-0">
                <div className="truncate font-bold text-white">{row.name}</div>
                <div className="mt-1 text-xs text-[#697594] lg:hidden">{row.type}</div>
              </div>
              <div className="hidden text-[#9AA7C7] lg:block">{row.type}</div>
              <div className="truncate text-[#D9E6F7]">{row.detail}</div>
              <div><StatusChip tone={row.tone}>{row.status}</StatusChip></div>
              <div className="text-xs text-[#9AA7C7]">{row.date}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export default function NeonIntelligencePreviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { userRole } = usePermissions();
  const { name: companyName } = useTenantCompanyName();
  const { planSlug, organizationStatus, navRoutes, loading: workspaceLoading } = useTenantWorkspace();
  const { data: clients } = useClients();
  const { data: tasks } = useTasks();
  const { data: transactions } = useTransactions();
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();
  const { data: activities } = useActivities();
  const [modalTitle, setModalTitle] = useState<string | null>(null);

  const routeSet = useMemo(() => new Set(["/dashboard/neon-intelligence-preview", ...navRoutes.map((route) => route.href)]), [navRoutes]);
  const role = userRole ?? (user?.role ? mapAuthRoleToUserRole(user.role) : null);
  const roleLabel = role ? getTenantRoleLabel(role) : "عضو الفريق";
  const userName = user?.name || user?.email || "المستخدم";
  const planLabel = PLAN_LABELS_AR[planSlug as PlanSlug] ?? "غير متاح";

  const activeClients = clients.filter((client) => client.status === "نشط" || client.status === "متعاقد").length;
  const activeEmployees = employees.filter((employee) => employee.status === "نشط").length;
  const openTasks = tasks.filter((task) => task.status !== "مكتملة").length;
  const activeProjects = projects.filter((project) => project.status === "قيد_التنفيذ").length;
  const income = transactions.filter((tx) => tx.type === "دخل").reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = transactions.filter((tx) => tx.type === "مصروف").reduce((sum, tx) => sum + tx.amount, 0);
  const net = income - expenses;

  const kpis = [
    {
      icon: Target,
      label: "العملاء",
      value: clients.length > 0 ? String(clients.length) : "—",
      detail: clients.length > 0 ? `${activeClients} عميل نشط أو متعاقد` : "لا توجد بيانات بعد",
      tone: clients.length > 0 ? "cyan" as Tone : "muted" as Tone,
    },
    {
      icon: BriefcaseBusiness,
      label: "المشاريع",
      value: projects.length > 0 ? String(projects.length) : "—",
      detail: projects.length > 0 ? `${activeProjects} مشروع مفتوح` : "لا توجد بيانات بعد",
      tone: projects.length > 0 ? "purple" as Tone : "muted" as Tone,
    },
    {
      icon: CheckCircle2,
      label: "المهام",
      value: tasks.length > 0 ? String(openTasks) : "—",
      detail: tasks.length > 0 ? "مهام جارية أو غير مكتملة" : "لا توجد بيانات بعد",
      tone: tasks.length > 0 ? "green" as Tone : "muted" as Tone,
    },
    {
      icon: CircleDollarSign,
      label: "المالية",
      value: transactions.length > 0 ? `${formatCurrency(net)} SAR` : "—",
      detail: transactions.length > 0 ? "صافي الدخل من المعاملات الفعلية" : "لا توجد بيانات بعد",
      tone: transactions.length > 0 ? "cyan" as Tone : "muted" as Tone,
    },
    {
      icon: Users,
      label: "الفريق",
      value: employees.length > 0 ? String(activeEmployees) : "—",
      detail: employees.length > 0 ? "أعضاء نشطون في مساحة العمل" : "لا توجد بيانات بعد",
      tone: employees.length > 0 ? "green" as Tone : "muted" as Tone,
    },
  ];

  const chartData = [
    { label: "عملاء", value: clients.length, tone: "cyan" as Tone },
    { label: "مشاريع", value: projects.length, tone: "purple" as Tone },
    { label: "مهام", value: tasks.length, tone: "green" as Tone },
    { label: "فريق", value: employees.length, tone: "cyan" as Tone },
    { label: "أنشطة", value: activities.length, tone: "purple" as Tone },
  ];

  const watchRows = [
    { label: "العملاء النشطون", value: clients.length > 0 ? `${activeClients}/${clients.length}` : "لا توجد بيانات بعد", tone: clients.length > 0 ? "cyan" as Tone : "muted" as Tone },
    { label: "المشاريع المفتوحة", value: projects.length > 0 ? `${activeProjects}/${projects.length}` : "لا توجد بيانات بعد", tone: projects.length > 0 ? "purple" as Tone : "muted" as Tone },
    { label: "المهام الجارية", value: tasks.length > 0 ? String(openTasks) : "لا توجد بيانات بعد", tone: tasks.length > 0 ? "green" as Tone : "muted" as Tone },
    { label: "الأنشطة الأخيرة", value: activities.length > 0 ? String(activities.length) : "لا توجد بيانات بعد", tone: activities.length > 0 ? "cyan" as Tone : "muted" as Tone },
    { label: "التقارير المتاحة", value: routeSet.has("/reports") ? "متاحة" : "غير متاح", tone: routeSet.has("/reports") ? "purple" as Tone : "muted" as Tone },
  ];

  const twinNodes = [
    { label: "العملاء", value: clients.length > 0 ? String(clients.length) : "غير متاح", tone: clients.length > 0 ? "cyan" as Tone : "muted" as Tone, icon: Target },
    { label: "الفريق", value: employees.length > 0 ? String(activeEmployees) : "غير متاح", tone: employees.length > 0 ? "green" as Tone : "muted" as Tone, icon: Users },
    { label: "المالية", value: transactions.length > 0 ? "نشطة" : "غير متاح", tone: transactions.length > 0 ? "cyan" as Tone : "muted" as Tone, icon: WalletCards },
    { label: "التقارير", value: routeSet.has("/reports") ? "متاحة" : "غير متاح", tone: routeSet.has("/reports") ? "purple" as Tone : "muted" as Tone, icon: BarChart3 },
    { label: "الدعم", value: "قيد التجهيز", tone: "purple" as Tone, icon: Headphones },
    { label: "الخدمات الذكية", value: "قيد التجهيز", tone: "purple" as Tone, icon: Sparkles },
  ];

  const activityRows = useMemo(() => {
    if (activities.length > 0) {
      return activities.slice(0, 7).map((activity) => ({
        id: activity.id,
        name: activity.description,
        type: activity.type,
        detail: activity.description,
        status: "نشاط",
        date: timeAgo(activity.timestamp),
        tone: "cyan" as Tone,
      }));
    }

    return transactions.slice(0, 7).map((tx) => ({
      id: tx.id,
      name: tx.category || tx.description || "معاملة مالية",
      type: tx.type,
      detail: `${formatCurrency(tx.amount)} SAR`,
      status: "مسجلة",
      date: timeAgo(tx.date),
      tone: tx.type === "دخل" ? "green" as Tone : "purple" as Tone,
    }));
  }, [activities, transactions]);

  if (authLoading || workspaceLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#050615] p-4 text-white" dir="rtl">
        <Panel className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-violet-400/20" />
          <div className="text-sm text-[#9AA7C7]">جاري تحميل معاينة الذكاء التشغيلي...</div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#050615] text-[#F8FAFC]" dir="rtl">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(109,76,255,.34),transparent_30%),radial-gradient(circle_at_18%_24%,rgba(34,211,238,.14),transparent_26%),radial-gradient(circle_at_52%_-12%,rgba(37,99,235,.18),transparent_28%),linear-gradient(145deg,#050615,#080A1F_48%,#02030B)]" />
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(124,92,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(124,92,255,.055)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-[#6D4CFF]/12 to-transparent" />

      <NeonModal title={modalTitle} onClose={() => setModalTitle(null)} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1540px] gap-4 p-3 pb-24 sm:p-4 lg:pb-4">
        <Sidebar routeSet={routeSet} userName={userName} roleLabel={roleLabel} />

        <div className="min-w-0 flex-1 space-y-4">
          <header className="flex flex-col gap-3 rounded-[24px] border border-violet-300/20 bg-[rgba(12,15,38,0.62)] p-4 shadow-[0_22px_70px_rgba(0,0,0,.32)] backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <StatusChip tone="purple">معاينة اختيارية · لا تغيّر لوحة التحكم الأساسية</StatusChip>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white lg:text-5xl">Blumark24 Intelligence OS</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9AA7C7]">
                مركز قراءة أداء المنشأة وتشغيلها بواجهة تحليلية ذكية.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:w-[430px]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                <div className="text-[11px] text-[#9AA7C7]">المنشأة</div>
                <div className="mt-1 truncate text-sm font-bold text-white">{companyName || "غير متاح"}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                <div className="text-[11px] text-[#9AA7C7]">الباقة</div>
                <div className="mt-1 truncate text-sm font-bold text-white">{planLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
                <div className="text-[11px] text-[#9AA7C7]">اليوم</div>
                <div className="mt-1 truncate text-sm font-bold text-white">{todayLabel()}</div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
            <PerformanceChart data={chartData} />
            <div className="grid gap-4">
              <Watchlist rows={watchRows} />
              <Panel className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white">حالة التشغيل</h2>
                    <p className="mt-1 text-xs text-[#9AA7C7]">بديل معلومات الشبكة بحالة عمليات المنشأة.</p>
                  </div>
                  <IconBox icon={ShieldCheck} tone={organizationStatus === "active" ? "green" : "purple"} />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
                    <span className="text-sm text-[#9AA7C7]">حالة المنشأة</span>
                    <StatusChip tone={organizationStatus === "active" ? "green" : "purple"}>{organizationStatus === "active" ? "نشطة" : organizationStatus ? "قيد المتابعة" : "غير متاح"}</StatusChip>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
                    <span className="text-sm text-[#9AA7C7]">الاشتراك</span>
                    <StatusChip tone="purple">{planLabel}</StatusChip>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2.5">
                    <span className="text-sm text-[#9AA7C7]">الدعم</span>
                    <StatusChip tone="purple">قيد التجهيز</StatusChip>
                  </div>
                </div>
              </Panel>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[390px_minmax(0,1fr)_360px]">
            <SmartActions routeSet={routeSet} onUnavailable={setModalTitle} />
            <ActivityTable rows={activityRows} />
            <DigitalTwinMini nodes={twinNodes} />
          </section>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-violet-300/20 bg-[#080A1F]/86 p-2 shadow-[0_24px_70px_rgba(0,0,0,.44)] backdrop-blur-xl lg:hidden" dir="rtl">
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: "ذكاء", icon: Radar, active: true },
            { label: "عملاء", icon: Target, href: "/clients" },
            { label: "مهام", icon: CheckCircle2, href: "/tasks" },
            { label: "تقارير", icon: BarChart3, href: "/reports" },
            { label: "إعدادات", icon: Settings, href: "/settings" },
          ].map((item) => {
            const Icon = item.icon;
            const enabled = item.active || (item.href ? routeSet.has(item.href) : false);
            const className = cn(
              "flex min-h-14 flex-col items-center justify-center rounded-2xl text-center transition",
              item.active ? "bg-violet-500/14 text-white shadow-[0_0_18px_rgba(139,92,246,.14)]" : "text-[#9AA7C7]",
              !enabled && "opacity-45",
            );
            const content = (
              <>
                <Icon size={18} className={item.active ? "text-cyan-200" : "text-[#9AA7C7]"} />
                <span className="mt-1 truncate text-[10px] font-semibold">{item.label}</span>
              </>
            );
            if (item.href && enabled) {
              return (
                <Link key={item.label} href={item.href} className={className}>
                  {content}
                </Link>
              );
            }
            return (
              <button key={item.label} type="button" disabled className={className}>
                {content}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
