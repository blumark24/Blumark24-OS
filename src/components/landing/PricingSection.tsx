"use client";

import Link from "next/link";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import {
  PLAN_BASE_PRICE_SAR,
  PLAN_LAUNCH_PRICE_SAR,
} from "@/lib/features/packageFeatures";

// ─── Plan definitions ─────────────────────────────────────────────────────────

type PlanKey = "basic" | "growth" | "advanced" | "enterprise";

interface PlanDef {
  key: PlanKey;
  name: string;
  desc: string;
  bestFor: string;
  bullets: string[];
  featured?: boolean;
  featuredBadge?: string;
  cta: string;
}

const PLANS: PlanDef[] = [
  {
    key: "basic",
    name: "أساسي",
    desc: "لبداية منظمة في إدارة العمل اليومي.",
    bestFor: "مناسب للمنشآت الصغيرة والفرق الجديدة.",
    bullets: [
      "لوحة تحكم أساسية",
      "إدارة المهام والعملاء",
      "إدارة الموظفين الأساسية",
      "تقارير تشغيلية مبسطة",
      "حتى 5 مستخدمين",
    ],
    cta: "طلب التفعيل",
  },
  {
    key: "growth",
    name: "نمو",
    desc: "لتنظيم الفرق والإدارات ومتابعة التشغيل.",
    bestFor: "مناسب للمنشآت النامية التي تحتاج هيكلًا أوضح.",
    bullets: [
      "كل مزايا أساسي",
      "الهيكل الإداري",
      "الإدارات والأقسام",
      "مالية أساسية",
      "تقارير تشغيلية",
      "حتى 15 مستخدم",
    ],
    cta: "طلب التفعيل",
  },
  {
    key: "advanced",
    name: "متقدم",
    desc: "لإدارة ذكية وتجربة تشغيل متقدمة.",
    bestFor: "مناسب للشركات التي تريد أتمتة ومكتبًا افتراضيًا.",
    bullets: [
      "كل مزايا نمو",
      "المكتب الافتراضي التنفيذي",
      "الأتمتة",
      "المتابعة الاستراتيجية",
      "تقارير متقدمة",
      "حتى 40 مستخدم",
    ],
    featured: true,
    featuredBadge: "الأكثر قيمة",
    cta: "طلب التفعيل",
  },
  {
    key: "enterprise",
    name: "مؤسسي",
    desc: "حل مخصص للشركات والكيانات متعددة الفروع.",
    bestFor: "مناسب للشركات التي تحتاج تخصيصًا ودعمًا أعلى.",
    bullets: [
      "حلول مخصصة",
      "عدد مستخدمين حسب العقد",
      "تعدد المنشآت",
      "دعم مخصص",
      "SLA حسب الاتفاق",
      "تكاملات مستقبلية",
    ],
    cta: "تواصل مع الفريق",
  },
];

// ─── Visual palette per plan ──────────────────────────────────────────────────

const PALETTE: Record<PlanKey, {
  border: string;
  accentText: string;
  checkBg: string;
  badgeCls: string;
  ctaCls: string;
  glow?: string;
}> = {
  basic: {
    border: "border-white/[0.09] hover:border-cyan-400/40",
    accentText: "text-cyan-300",
    checkBg: "bg-cyan-400/10 border-cyan-400/20",
    badgeCls: "",
    ctaCls: "border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/[0.08]",
  },
  growth: {
    border: "border-white/[0.09] hover:border-violet-400/40",
    accentText: "text-violet-300",
    checkBg: "bg-violet-400/10 border-violet-400/20",
    badgeCls: "",
    ctaCls: "border border-violet-400/30 text-violet-200 hover:bg-violet-400/[0.08]",
  },
  advanced: {
    border: "border-amber-400/35 hover:border-amber-400/60",
    accentText: "text-amber-300",
    checkBg: "bg-amber-400/10 border-amber-400/20",
    badgeCls: "bg-amber-500/15 text-amber-200 border border-amber-400/35",
    ctaCls:
      "bg-gradient-to-l from-[#f59e0b] to-[#fbbf24] text-[#0a0f1a] font-semibold shadow-[0_8px_28px_-8px_rgba(245,158,11,0.45)] hover:brightness-110",
    glow: "shadow-[0_0_48px_-12px_rgba(245,158,11,0.20)]",
  },
  enterprise: {
    border: "border-white/[0.09] hover:border-emerald-400/40",
    accentText: "text-emerald-300",
    checkBg: "bg-emerald-400/10 border-emerald-400/20",
    badgeCls: "",
    ctaCls: "border border-emerald-400/30 text-emerald-200 hover:bg-emerald-400/[0.08]",
  },
};

// ─── EyebrowChip ──────────────────────────────────────────────────────────────

function EyebrowChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-[#22D3EE] backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D3EE]" />
      </span>
      {children}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: PlanDef }) {
  const p = PALETTE[plan.key];
  const isEnterprise = plan.key === "enterprise";
  const basePrice = PLAN_BASE_PRICE_SAR[plan.key];
  const launchPrice = PLAN_LAUNCH_PRICE_SAR[plan.key];

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-[rgba(10,22,40,0.60)] backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.78)] ${p.border} ${plan.featured ? p.glow : ""}`}
    >
      {/* Featured badge row — reserves space on all cards for alignment */}
      <div className="mb-4 h-6 flex items-center justify-end">
        {plan.featured && plan.featuredBadge && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${p.badgeCls}`}>
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
            {plan.featuredBadge}
          </span>
        )}
      </div>

      {/* Plan name + description */}
      <div className="mb-5">
        <h3 className={`text-[19px] font-bold leading-tight mb-1.5 ${p.accentText}`}>
          {plan.name}
        </h3>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {plan.desc}
        </p>
      </div>

      {/* Price */}
      <div className="mb-5 pb-5 border-b border-white/[0.07]">
        {isEnterprise ? (
          <>
            <div className="text-[11px] text-white/40 mb-1 uppercase tracking-wide">يبدأ من</div>
            <div className="text-[28px] font-bold text-white leading-none">
              1,999
              <span className="text-[14px] font-normal text-white/50 mr-1.5">ر.س / شهريًا</span>
            </div>
            <div className="mt-2 text-[12px] text-white/35">عقد مخصص حسب الاحتياج</div>
          </>
        ) : (
          <>
            <div className="text-[11px] text-white/40 mb-1 uppercase tracking-wide">عرض التأسيس</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold text-white leading-none">
                {launchPrice?.toLocaleString("en-US")}
              </span>
              <span className="text-[14px] text-white/50">ر.س / شهريًا</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[12px] line-through text-white/30">
                {basePrice?.toLocaleString("en-US")} ر.س
              </span>
              <span className="text-[10.5px] font-medium text-white/50">السعر الأساسي</span>
            </div>
          </>
        )}
      </div>

      {/* Best-for */}
      <p className="mb-4 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
        {plan.bestFor}
      </p>

      {/* Feature list */}
      <ul className="mb-6 space-y-2.5 flex-1">
        {plan.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.78)" }}>
            <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${p.checkBg}`}>
              <Check className={`h-2.5 w-2.5 ${p.accentText}`} strokeWidth={2.5} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href="/demo"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl h-11 text-[13.5px] transition-all duration-300 ${p.ctaCls}`}
      >
        {plan.cta}
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
      </Link>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function PricingSection() {
  return (
    <section id="pricing" className="relative py-20 sm:py-24 lg:py-32">
      {/* Section divider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 h-[480px] w-[860px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.05),transparent_65%)] blur-3xl"
      />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 relative">

        {/* Heading block */}
        <div className="max-w-2xl text-center mx-auto">
          <EyebrowChip>عرض التأسيس للسوق السعودي</EyebrowChip>
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">
            باقات{" "}
            <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
              Blumark24 OS
            </span>
          </h2>
          <p
            className="mt-4 text-base sm:text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.68)" }}
          >
            اختر الخطة المناسبة لتشغيل أعمالك بذكاء، من البداية حتى التوسع.
          </p>
        </div>

        {/* Launch offer strip */}
        <div className="mt-8 mx-auto max-w-xl rounded-2xl border border-[#22D3EE]/20 bg-[rgba(34,211,238,0.05)] backdrop-blur-md px-5 py-3.5 text-center">
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
            <span className="font-semibold text-[#22D3EE]">خصم 50%</span>{" "}
            لأول 100 منشأة تنضم إلى Blumark24 OS — لمدة 6 أشهر فقط.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-start">
          {PLANS.map((plan) => (
            <PlanCard key={plan.key} plan={plan} />
          ))}
        </div>

        {/* Payment notice */}
        <p
          className="mt-8 text-center text-[12px]"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          الدفع الإلكتروني قريبًا —{" "}
          <Link
            href="/demo"
            className="text-[#22D3EE]/60 hover:text-[#22D3EE] transition underline underline-offset-2"
          >
            للتفعيل المبكر تواصل مع فريق Blumark24
          </Link>
        </p>

      </div>
    </section>
  );
}
