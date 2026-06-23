"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import {
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock,
  DollarSign,
  Edit2,
  Lightbulb,
  Loader2,
  Map,
  Network,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  UserCircle,
  X,
} from "lucide-react";

import type { StrategyPhase } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { useStrategyPhases } from "@/hooks/useData";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useToast } from "@/contexts/ToastContext";

const STATUS_CONFIG = {
  "مكتملة": { class: "status-completed", color: "#10b981", icon: CheckCircle2 },
  "جارية": { class: "status-pending", color: "#f59e0b", icon: Clock },
  "قادمة": { class: "status-inactive", color: "#8ba3c7", icon: Target },
} as const;

type GrowthStatus = "جاهز" | "جاهز للمتابعة" | "يحتاج ربط" | "قيد التجهيز" | "غير متاح";

const TWIN_STATUS_STYLES: Record<GrowthStatus, string> = {
  "جاهز": "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
  "جاهز للمتابعة": "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
  "يحتاج ربط": "border-amber-300/25 bg-amber-400/10 text-amber-200",
  "قيد التجهيز": "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
  "غير متاح": "border-slate-300/16 bg-slate-400/10 text-slate-300",
};

function buildRecommendations(phases: StrategyPhase[]) {
  const active = phases.find((p) => p.status === "جارية");
  const totalBudget = phases.reduce((s, p) => s + p.budget, 0);
  const overall = phases.length > 0
    ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
    : 0;

  return [
    {
      icon: "01",
      title: "ركّز على مرحلة واحدة",
      desc: active
        ? `أكمل "${active.title}" أولاً. التقدم الحالي ${active.progress}%.`
        : "حدّد المرحلة التي تريد العمل عليها هذا الشهر.",
    },
    {
      icon: "02",
      title: "اجعل الهدف قابلاً للتنفيذ",
      desc: active?.goals?.[0]
        ? `ابدأ بهذا الهدف: ${active.goals[0]}`
        : "حوّل هدف الشهر إلى إجراء قصير يمكن متابعته.",
    },
    {
      icon: "03",
      title: "راجع الميزانية بهدوء",
      desc: `إجمالي الميزانية المسجلة في خطة النمو: ${formatCurrency(totalBudget)} SAR.`,
    },
    {
      icon: "04",
      title: "حدّث التقدم أسبوعياً",
      desc: `نسبة إنجاز الخطة الحالية ${overall}%. اجعل التحديث عادة قصيرة.`,
    },
  ];
}

interface EditState {
  progress: number;
  currentClients: number;
  status: StrategyPhase["status"];
}

function StatusPill({ status }: { status: GrowthStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold", TWIN_STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

function CircularProgress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border border-cyan-300/20 shadow-[0_0_32px_-18px_rgba(34,211,238,0.9)]"
      style={{
        background: `conic-gradient(#22d3ee ${safeValue * 3.6}deg, rgba(30,58,95,0.56) 0deg)`,
      }}
      aria-label={`تقدم خطة النمو ${safeValue}%`}
    >
      <div className="absolute inset-2 rounded-full bg-[#071426]" />
      <div className="relative text-center">
        <div className="text-2xl font-black text-white">{safeValue}%</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#8ba3c7]">تقدم الشهر</div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[#1e3a5f]/80 bg-[#0d1f3c]/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] text-[#8ba3c7]">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-[#6b87ab]">{hint}</div>
    </div>
  );
}

type GrowthTwinNode = {
  label: string;
  status: GrowthStatus;
  icon: React.ElementType;
  hint: string;
  href?: string;
};

const GROWTH_TWIN_NODES: GrowthTwinNode[] = [
  {
    label: "الهيكل الإداري",
    status: "يحتاج ربط",
    icon: Network,
    hint: "اربط المسؤوليات لاحقاً من الهيكل الإداري.",
    href: "/org",
  },
  {
    label: "المكتب الافتراضي",
    status: "جاهز للمتابعة",
    icon: Building2,
    hint: "استخدم المكتب الافتراضي لاحقاً لمتابعة الاجتماعات والمهام المرتبطة بالنمو.",
    href: "/virtual-office",
  },
  {
    label: "العملاء",
    status: "قيد التجهيز",
    icon: UserCircle,
    hint: "لا نعرض أرقاماً هنا دون مصدر مباشر.",
  },
  {
    label: "المهام",
    status: "قيد التجهيز",
    icon: CheckSquare,
    hint: "إشارة تشغيل مستقبلية من المهام.",
  },
  {
    label: "المالية",
    status: "قيد التجهيز",
    icon: DollarSign,
    hint: "تظهر لاحقاً من بيانات مالية حقيقية.",
  },
  {
    label: "التقارير",
    status: "قيد التجهيز",
    icon: BarChart3,
    hint: "تتحول لاحقاً إلى قراءة أداء.",
  },
  {
    label: "المساعد الذكي",
    status: "غير متاح",
    icon: Bot,
    hint: "اقتراحات قراءة فقط في مرحلة لاحقة.",
  },
];

const GROWTH_TWIN_DESKTOP_POSITIONS = [
  "right-7 top-7",
  "left-7 top-7",
  "right-10 top-[42%]",
  "left-10 top-[42%]",
  "right-7 bottom-7",
  "left-7 bottom-7",
  "left-1/2 top-6 -translate-x-1/2",
];

function OrgLinkCard({ currentPhaseTitle }: { currentPhaseTitle?: string }) {
  return (
    <section className="glass-card border border-amber-300/18 bg-[linear-gradient(145deg,rgba(15,28,50,0.82),rgba(7,20,38,0.72))] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center rounded-full border border-amber-300/22 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
            يحتاج ربط
          </div>
          <h2 className="text-lg font-heading font-bold text-white">ربط الهيكل الإداري</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8ba3c7]">
            حدد الجهة أو المسؤول المرتبط بهذه المرحلة حتى تتحول خطة النمو إلى تنفيذ واضح.
          </p>
          {currentPhaseTitle ? (
            <p className="mt-2 text-xs leading-relaxed text-cyan-100">
              المرحلة الحالية: <span className="font-semibold text-white">{currentPhaseTitle}</span>
            </p>
          ) : null}
        </div>
        <Link
          href="/org"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#061224] transition hover:bg-[#67e8f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          فتح الهيكل الإداري
        </Link>
      </div>
    </section>
  );
}

function VirtualOfficeLinkCard({ currentPhaseTitle }: { currentPhaseTitle?: string }) {
  return (
    <section className="glass-card border border-cyan-300/18 bg-[linear-gradient(145deg,rgba(10,31,58,0.82),rgba(7,20,38,0.72))] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center rounded-full border border-cyan-300/22 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
            جاهز للمتابعة
          </div>
          <h2 className="text-lg font-heading font-bold text-white">ربط المكتب الافتراضي</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8ba3c7]">
            افتح المكتب الافتراضي لمتابعة اجتماعات ومهام النمو مع فريقك بشكل أوضح.
          </p>
          {currentPhaseTitle ? (
            <p className="mt-2 text-xs leading-relaxed text-cyan-100">
              المرحلة الحالية: <span className="font-semibold text-white">{currentPhaseTitle}</span>
            </p>
          ) : null}
        </div>
        <Link
          href="/virtual-office"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-cyan-300/24 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/45 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          فتح المكتب الافتراضي
        </Link>
      </div>
    </section>
  );
}

function GrowthTwinLite({ hasPhases }: { hasPhases: boolean }) {
  return (
    <section className="glass-card overflow-hidden border border-[#22d3ee]/18 bg-[radial-gradient(circle_at_16%_10%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(30,111,217,0.12),transparent_32%),rgba(7,20,38,0.68)] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold text-white">توأم النمو الذكي</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8ba3c7]">نموذج بصري خفيف يوضح حالة منشأتك، وما يحتاج ربط أو متابعة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#22d3ee]/18 bg-[#22d3ee]/8 px-3 py-1 text-[11px] font-semibold text-cyan-100">
            خريطة خفيفة - بدون 3D
          </span>
          <StatusPill status={hasPhases ? "جاهز" : "قيد التجهيز"} />
        </div>
      </div>

      <div className="relative hidden min-h-[360px] rounded-[1.5rem] border border-[#1e3a5f]/70 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.13),transparent_36%),linear-gradient(145deg,rgba(6,18,38,0.84),rgba(8,20,42,0.66))] p-5 lg:block">
        <div className="absolute inset-x-12 top-1/2 h-px bg-gradient-to-l from-transparent via-cyan-300/25 to-transparent" />
        <div className="absolute inset-y-12 right-1/2 w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,111,217,0.12),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(34,211,238,0.10),transparent_30%)]" />

        <div className="absolute left-1/2 top-1/2 z-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-cyan-300/25 bg-[#071426]/92 p-4 text-center shadow-[0_0_42px_-18px_rgba(34,211,238,0.9)]">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/12 text-cyan-200">
            <Map size={20} />
          </div>
          <div className="font-bold text-white">منشأتك</div>
          <div className="mt-1 text-[11px] text-[#8ba3c7]">مركز النمو</div>
        </div>

        {GROWTH_TWIN_NODES.map((node, index) => {
          const Icon = node.icon;
          const cardClass = cn(
            "absolute z-10 w-44 rounded-2xl border border-[#1e3a5f]/80 bg-[#091a33]/92 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.22)]",
            node.href && "transition hover:border-amber-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200",
            GROWTH_TWIN_DESKTOP_POSITIONS[index],
          );
          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                  <Icon size={17} />
                </div>
                <StatusPill status={node.status} />
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{node.label}</div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#8ba3c7]">{node.hint}</p>
            </>
          );
          return node.href ? (
            <Link key={node.label} href={node.href} className={cardClass}>
              {cardContent}
            </Link>
          ) : (
            <div key={node.label} className={cardClass}>
              {cardContent}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3">
          <div className="font-bold text-white">منشأتك</div>
          <p className="mt-1 text-xs text-[#8ba3c7]">مركز النمو وخطوات الشهر.</p>
        </div>
        {GROWTH_TWIN_NODES.map((node) => {
          const Icon = node.icon;
          const cardClass = cn(
            "rounded-2xl border border-[#1e3a5f]/80 bg-[#0d1f3c]/58 p-3",
            node.href && "transition hover:border-amber-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200",
          );
          const cardContent = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
                    <Icon size={15} />
                  </span>
                  <span className="truncate text-sm font-semibold text-white">{node.label}</span>
                </div>
                <StatusPill status={node.status} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8ba3c7]">{node.hint}</p>
            </>
          );
          return node.href ? (
            <Link key={node.label} href={node.href} className={cardClass}>
              {cardContent}
            </Link>
          ) : (
            <div key={node.label} className={cardClass}>
              {cardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TwinSkillsSection({ hasPhases }: { hasPhases: boolean }) {
  const skills: {
    title: string;
    desc: string;
    status: GrowthStatus;
    icon: React.ElementType;
  }[] = [
    {
      title: "قراءة حالة المنشأة",
      desc: "يوضح الصورة العامة من خطة النمو الحالية.",
      status: hasPhases ? "جاهز" : "قيد التجهيز",
      icon: Map,
    },
    {
      title: "ربط الهيكل الإداري",
      desc: "يساعدك على متابعة جاهزية الأقسام والمسؤوليات.",
      status: "يحتاج ربط",
      icon: Network,
    },
    {
      title: "متابعة خطة النمو",
      desc: "يوضح المرحلة الحالية والإجراء التالي.",
      status: hasPhases ? "جاهز" : "قيد التجهيز",
      icon: Target,
    },
    {
      title: "كشف نقاط التعطّل",
      desc: "يقترح أين تحتاج الخطة إلى متابعة أو تحديث.",
      status: "قيد التجهيز",
      icon: Lightbulb,
    },
    {
      title: "توجيه الإجراء التالي",
      desc: "يساعدك على اختيار خطوة شهرية واضحة.",
      status: hasPhases ? "جاهز" : "قيد التجهيز",
      icon: CheckSquare,
    },
    {
      title: "تجهيز المكتب الافتراضي",
      desc: "يوضح ما يحتاج ربط قبل تشغيل تجربة المكتب.",
      status: "يحتاج ربط",
      icon: Building2,
    },
  ];

  return (
    <section className="glass-card border border-[#1e3a5f]/80 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/18 bg-cyan-400/10 text-cyan-200">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-white">مهارات التوأم الذكي</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#8ba3c7]">
            قدرات خفيفة تقرأ الخطة وتساعدك على المتابعة دون تنفيذ تلقائي أو وعود غير مدعومة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => {
          const Icon = skill.icon;
          return (
            <div
              key={skill.title}
              className="rounded-2xl border border-[#1e3a5f]/78 bg-[#0d1f3c]/52 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-cyan-300/22 hover:bg-[#102848]/58"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
                  <Icon size={16} />
                </div>
                <StatusPill status={skill.status} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-white">{skill.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">{skill.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TwinScaleTiers() {
  const tiers: {
    title: string;
    label: string;
    forText: string;
    experience: string;
    icon: React.ElementType;
  }[] = [
    {
      title: "منشأة صغيرة",
      label: "خفيف وسريع",
      forText: "محل، كوفي، عيادة صغيرة، متجر",
      experience: "خطة نمو بسيطة + إجراءات شهرية + مؤشرات أساسية",
      icon: Building2,
    },
    {
      title: "منشأة متوسطة",
      label: "تشغيلي",
      forText: "شركة صغيرة، مطعم بعدة أقسام، عيادة بفريق",
      experience: "خريطة تشغيل + أقسام + مهام + حالات ربط",
      icon: Network,
    },
    {
      title: "منشأة كبيرة",
      label: "متقدم لاحقاً",
      forText: "فندق، شركة، عدة فروع، فريق كبير",
      experience: "Digital Twin متقدم + غرف تشغيل + مؤشرات متعددة",
      icon: BarChart3,
    },
  ];

  return (
    <section className="glass-card overflow-hidden border border-[#22d3ee]/16 bg-[linear-gradient(145deg,rgba(8,20,42,0.82),rgba(6,16,32,0.72))] p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-heading font-bold text-white">مستويات التوأم حسب حجم المنشأة</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#8ba3c7]">
          نفس الفكرة تتدرج حسب حجم العمل: تبدأ بسيطة، ثم تصبح خريطة تشغيل أعمق عندما تتوفر البيانات والربط.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div
              key={tier.title}
              className="rounded-[1.35rem] border border-[#1e3a5f]/80 bg-[#0a1b34]/72 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/18 bg-cyan-400/10 text-cyan-200">
                  <Icon size={18} />
                </div>
                <span className="rounded-full border border-cyan-300/18 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
                  {tier.label}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{tier.title}</h3>
              <div className="mt-3 space-y-2 text-xs leading-relaxed text-[#8ba3c7]">
                <p>
                  <span className="font-semibold text-cyan-100">يناسب: </span>
                  {tier.forText}
                </p>
                <p>
                  <span className="font-semibold text-cyan-100">التجربة: </span>
                  {tier.experience}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StartHereEmptyState() {
  const previewNodes = [
    { label: "خطة النمو", className: "right-4 top-5 sm:right-8" },
    { label: "الهيكل الإداري", className: "left-4 top-5 sm:left-8" },
    { label: "المكتب الافتراضي", className: "left-1/2 bottom-5 -translate-x-1/2" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="glass-card relative overflow-hidden border border-[#22d3ee]/22 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(30,111,217,0.15),transparent_36%),linear-gradient(145deg,rgba(8,20,42,0.98),rgba(5,14,30,0.92))] p-5 text-right shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-7">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-cyan-200/55 to-transparent" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[#22d3ee]">مركز قيادة النمو</p>
            <h2 className="mt-2 max-w-3xl text-2xl font-heading font-black leading-tight text-white sm:text-3xl">
              ماذا أفعل هذا الشهر لنمو منشأتي؟
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/24 bg-[#22d3ee]/12 px-3 py-1 text-xs font-semibold text-[#22d3ee]">
              <Sparkles size={13} />
              ابدأ هنا
            </div>
            <div className="mt-5 rounded-2xl border border-[#1e3a5f]/80 bg-[#0d1f3c]/58 p-4">
              <h3 className="text-lg font-bold text-white">لم تبدأ خطة النمو بعد</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#8ba3c7]">
                أضف أول مرحلة نمو وحدّد هدف هذا الشهر.
              </p>
            </div>
            <div className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#061224] shadow-[0_16px_34px_rgba(34,211,238,0.18)]">
              أضف أول مرحلة نمو
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#8ba3c7]">
              بعد إضافة أول مرحلة، يمكنك ربطها بالهيكل الإداري.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">
              بعد إضافة أول مرحلة، يمكنك متابعة العمل من المكتب الافتراضي.
            </p>
          </div>

          <div className="hidden rounded-[1.4rem] border border-cyan-300/18 bg-[#071426]/68 p-4 lg:block">
              <div className="grid h-40 place-items-center rounded-[1.1rem] border border-[#1e3a5f]/70 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(30,111,217,0.06))]">
                <div className="grid h-20 w-20 rotate-45 place-items-center rounded-2xl border border-cyan-300/24 bg-cyan-400/10 shadow-[0_0_34px_-18px_rgba(34,211,238,0.9)]">
                <span className="-rotate-45 text-sm font-bold text-white">نمو</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card overflow-hidden border border-[#1e3a5f]/80 p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-heading font-bold text-white">الخريطة الذكية للمنشأة</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#8ba3c7]">
            ستظهر خريطة منشأتك بعد إضافة أول مرحلة وربط بياناتك.
          </p>
        </div>

        <div className="relative min-h-[220px] rounded-[1.4rem] border border-[#1e3a5f]/75 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_34%),linear-gradient(145deg,rgba(6,18,38,0.78),rgba(8,20,42,0.62))] p-4">
          <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-l from-transparent via-cyan-300/18 to-transparent" />
          <div className="absolute inset-y-8 right-1/2 w-px bg-gradient-to-b from-transparent via-cyan-300/16 to-transparent" />
          <div className="absolute left-1/2 top-1/2 z-10 w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-300/24 bg-[#071426]/90 p-3 text-center shadow-[0_0_38px_-20px_rgba(34,211,238,0.9)]">
            <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/12 text-cyan-200">
              <Map size={17} />
            </div>
            <div className="text-sm font-bold text-white">منشأتك</div>
          </div>
          {previewNodes.map((node) => (
            <div
              key={node.label}
              className={cn(
                "absolute z-10 rounded-2xl border border-[#1e3a5f]/70 bg-[#0d1f3c]/52 px-3 py-2 text-xs font-semibold text-[#8ba3c7] opacity-75",
                node.className,
              )}
            >
              {node.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EditModal({
  phase,
  onSave,
  onClose,
}: {
  phase: StrategyPhase;
  onSave: (changes: Partial<StrategyPhase>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EditState>({
    progress: phase.progress,
    currentClients: phase.currentClients,
    status: phase.status,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md glass-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-heading font-bold text-white">تحديث المرحلة</h3>
          <button onClick={onClose} className="text-[#8ba3c7] hover:text-white" aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-sm text-[#8ba3c7]">{phase.title}</p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[#8ba3c7]">التقدم ({form.progress}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: +e.target.value }))}
              className="w-full accent-[#22d3ee]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8ba3c7]">العملاء الحاليين</label>
            <input
              type="number"
              min={0}
              value={form.currentClients}
              onChange={(e) => setForm((f) => ({ ...f, currentClients: +e.target.value }))}
              className="input-dark w-full text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8ba3c7]">الحالة</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StrategyPhase["status"] }))}
              className="input-dark w-full text-sm"
            >
              <option value="قادمة">قادمة</option>
              <option value="جارية">جارية</option>
              <option value="مكتملة">مكتملة</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function StrategyContent() {
  const { data: phases, loading, error, update } = useStrategyPhases();
  const { userRole } = usePermissions();
  const toast = useToast();
  const [editingPhase, setEditingPhase] = useState<StrategyPhase | null>(null);

  const canEdit =
    userRole === "super_admin" ||
    userRole === "board_member" ||
    userRole === "organization_manager";

  const hasPhases = phases.length > 0;
  const overallProgress = hasPhases
    ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length)
    : 0;
  const currentPhase =
    phases.find((p) => p.status === "جارية") ??
    phases.find((p) => p.status !== "مكتملة") ??
    phases[0] ??
    null;
  const currentProgress = currentPhase?.progress ?? overallProgress;
  const totalBudget = phases.reduce((s, p) => s + p.budget, 0);
  const monthlyGoal =
    currentPhase?.goals?.[0] ||
    currentPhase?.description ||
    "حدّد هدفاً واحداً لهذا الشهر وابدأ بأول إجراء.";
  const nextAction =
    currentPhase?.goals?.[1] ||
    currentPhase?.goals?.[0] ||
    "راجع المرحلة الحالية وحدّث التقدم.";
  const recommendations = buildRecommendations(phases);

  const handleSave = async (changes: Partial<StrategyPhase>) => {
    if (!editingPhase) return;
    try {
      await update(editingPhase.id, changes);
      toast.success("تم تحديث المرحلة بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحديث المرحلة");
      throw err;
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {error && (
        <div className="glass-card border border-red-500/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {!loading && !hasPhases ? <StartHereEmptyState /> : null}

      {hasPhases && (
        <section className="glass-card relative overflow-hidden border border-[#22d3ee]/22 bg-[radial-gradient(circle_at_14%_8%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(30,111,217,0.18),transparent_34%),linear-gradient(145deg,rgba(8,20,42,0.98),rgba(5,14,30,0.92))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-cyan-200/55 to-transparent" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22d3ee]/24 bg-[#22d3ee]/12 px-3 py-1 text-xs font-medium text-[#22d3ee]">
                <Sparkles size={13} />
                مركز قيادة النمو
              </div>
              <h2 className="mt-3 max-w-3xl text-2xl font-heading font-black leading-tight text-white sm:text-3xl">
                ماذا أفعل هذا الشهر لنمو منشأتي؟
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8ba3c7]">
                ركّز على مرحلة واحدة، نفّذ الإجراء التالي، ثم حدّث التقدم من نفس الصفحة.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1f3c]/64 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-xs text-[#8ba3c7]">المرحلة الحالية</div>
                  <div className="mt-1 truncate text-sm font-bold text-white">{currentPhase?.title}</div>
                </div>
                <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1f3c]/64 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-xs text-[#8ba3c7]">هدف الشهر</div>
                  <div className="mt-1 line-clamp-2 text-sm font-bold text-white">{monthlyGoal}</div>
                </div>
                <div className="rounded-2xl border border-[#1e3a5f] bg-[#0d1f3c]/64 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="text-xs text-[#8ba3c7]">الإجراء التالي</div>
                  <div className="mt-1 line-clamp-2 text-sm font-bold text-white">{nextAction}</div>
                </div>
              </div>

              {currentPhase && canEdit && (
                <button
                  type="button"
                  onClick={() => setEditingPhase(currentPhase)}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22d3ee] px-4 py-2 text-sm font-semibold text-[#061224] transition hover:bg-[#67e8f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  <Edit2 size={15} />
                  حدّث تقدم هذا الشهر
                </button>
              )}
            </div>

            <CircularProgress value={currentProgress} />
          </div>
        </section>
      )}

      {hasPhases && <OrgLinkCard currentPhaseTitle={currentPhase?.title} />}
      {hasPhases && <VirtualOfficeLinkCard currentPhaseTitle={currentPhase?.title} />}

      {hasPhases && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="التقدم" value={`${currentProgress}%`} hint="من المرحلة الحالية" />
          <KpiCard label="المراحل" value={`${phases.length}`} hint="مراحل خطة النمو" />
          <KpiCard label="الميزانية" value={`${formatCurrency(totalBudget)} SAR`} hint="من بيانات الخطة" />
          <KpiCard label="الحالة الحالية" value={currentPhase?.status ?? "غير محدد"} hint="حالة المرحلة النشطة" />
        </div>
      )}

      {hasPhases && (
        <>
          <GrowthTwinLite hasPhases={hasPhases} />
          <TwinSkillsSection hasPhases={hasPhases} />
          <TwinScaleTiers />
        </>
      )}

      {hasPhases && (
        <section className="glass-card border border-[#22d3ee]/20 p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-[#22d3ee]" />
              <h3 className="font-medium text-white">توصيات مقترحة</h3>
            </div>
            <span className="w-fit rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/10 px-3 py-1 text-xs font-medium text-[#22d3ee]">
              اقتراحات مبنية على بيانات الخطة
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <div key={rec.title} className="rounded-xl border border-[#1e3a5f] bg-[#0d1f3c]/60 p-3 transition-all hover:border-[#22d3ee]/30">
                <div className="mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#22d3ee]/10 px-2 text-xs font-bold text-[#22d3ee]">
                  {rec.icon}
                </div>
                <div className="mb-1 text-sm font-medium text-white">{rec.title}</div>
                <div className="text-xs leading-relaxed text-[#8ba3c7]">{rec.desc}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasPhases && (
        <section className="glass-card border border-[#1e3a5f]/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-heading font-bold text-white">النشاط الحديث</h2>
              <p className="mt-1 text-sm text-[#8ba3c7]">لا يوجد نشاط حديث بعد</p>
            </div>
            <StatusPill status="قيد التجهيز" />
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#22d3ee]" />
        </div>
      ) : hasPhases ? (
        <div className="relative">
          <div className="absolute right-8 top-0 bottom-0 hidden w-0.5 bg-gradient-to-b from-[#22d3ee] via-[#1e6fd9] to-[#1e3a5f] sm:block" />
          <div className="space-y-4 sm:space-y-6">
            {phases.map((phase, i) => {
              const statusConf = STATUS_CONFIG[phase.status] ?? STATUS_CONFIG["قادمة"];
              const Icon = statusConf.icon;
              return (
                <div key={phase.id} className="relative flex flex-col gap-3 sm:flex-row sm:gap-6">
                  <div className="hidden w-16 flex-shrink-0 flex-col items-center sm:flex">
                    <div
                      className="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2"
                      style={{
                        background: phase.status === "مكتملة" ? "#10b981" : phase.status === "جارية" ? "#f59e0b" : "#1e3a5f",
                        borderColor: statusConf.color,
                      }}
                    >
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="mt-1 text-xs text-[#8ba3c7]">م{i + 1}</div>
                  </div>

                  <div className={cn("flex-1 glass-card glass-card-hover p-4 sm:p-5", phase.status === "جارية" && "border-[#f59e0b]/30")}>
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-heading font-bold text-white">{phase.title}</h3>
                        <p className="mt-0.5 text-sm text-[#8ba3c7]">{phase.description}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${statusConf.class}`}>{phase.status}</span>
                        {(phase.startDate || phase.endDate) && (
                          <span className="rounded-lg bg-[#1a3356]/50 px-2 py-1 text-xs text-[#8ba3c7]">
                            {phase.startDate || "غير محدد"} → {phase.endDate || "غير محدد"}
                          </span>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => setEditingPhase(phase)}
                            aria-label="تعديل المرحلة"
                            className="rounded-lg p-1.5 text-[#8ba3c7] transition-all hover:bg-[#1a3356] hover:text-[#22d3ee]"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <div className="mb-1 text-xs text-[#8ba3c7]">التقدم</div>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar flex-1">
                            <div className="progress-fill" style={{ width: `${phase.progress}%`, background: statusConf.color }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: statusConf.color }}>{phase.progress}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-[#8ba3c7]">العملاء</div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-[#22d3ee]" />
                          <span className="text-sm font-bold text-white">{phase.currentClients}</span>
                          <span className="text-xs text-[#8ba3c7]">/ {phase.targetClients}</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-[#8ba3c7]">الميزانية</div>
                        <div className="text-sm font-bold text-white">{formatCurrency(phase.budget)} SAR</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-[#8ba3c7]">المرحلة</div>
                        <div className="text-sm font-bold text-white">{i + 1} / {phases.length}</div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs text-[#8ba3c7]">إجراءات قصيرة لهذا الشهر:</div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {phase.goals.map((goal) => (
                          <div key={goal} className="flex items-center gap-2 rounded-xl border border-[#1e3a5f]/70 bg-[#0d1f3c]/40 px-3 py-2 text-xs text-[#cbd5e1]">
                            <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: statusConf.color }} />
                            <span className="min-w-0">{goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {editingPhase && (
        <EditModal
          phase={editingPhase}
          onSave={handleSave}
          onClose={() => setEditingPhase(null)}
        />
      )}
    </div>
  );
}

export default function StrategyPage() {
  return (
    <DashboardLayout>
      <PageGuard permission="manage_reports">
        <StrategyContent />
      </PageGuard>
    </DashboardLayout>
  );
}
