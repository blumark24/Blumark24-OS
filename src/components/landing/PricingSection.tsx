"use client";

import Link from "next/link";
import { Check, Crown, Sparkles, Users, Zap, ArrowLeft, Send, Building2 } from "lucide-react";
import {
  PLAN_BASE_PRICE_SAR,
  PLAN_LAUNCH_PRICE_SAR,
  PLAN_MAX_USERS,
  PLAN_LABELS_AR,
} from "@/lib/features/packageFeatures";

// ─── Visual identity per tier (matches OrgPackagePlanCards palette) ───────────

const TIER_VISUAL = {
  basic: {
    icon: Zap,
    accent: "#22D3EE",
    border: "border-cyan-400/30",
    hoverBorder: "hover:border-cyan-400/55",
    iconBg: "from-cyan-400/20 via-cyan-400/10 to-cyan-400/5",
    iconText: "text-cyan-300",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    orb: "rgba(34,211,238,0.22)",
    glow: "rgba(34,211,238,0.18)",
    featured: false,
  },
  growth: {
    icon: Sparkles,
    accent: "#a855f7",
    border: "border-violet-400/30",
    hoverBorder: "hover:border-violet-400/55",
    iconBg: "from-violet-400/20 via-violet-400/10 to-violet-400/5",
    iconText: "text-violet-300",
    badge: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    orb: "rgba(168,85,247,0.22)",
    glow: "rgba(168,85,247,0.18)",
    featured: false,
  },
  advanced: {
    icon: Crown,
    accent: "#f59e0b",
    border: "border-amber-400/35",
    hoverBorder: "hover:border-amber-400/60",
    iconBg: "from-amber-400/20 via-amber-400/10 to-amber-400/5",
    iconText: "text-amber-300",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    orb: "rgba(245,158,11,0.22)",
    glow: "rgba(245,158,11,0.18)",
    featured: true,
  },
  enterprise: {
    icon: Building2,
    accent: "#10b981",
    border: "border-emerald-400/30",
    hoverBorder: "hover:border-emerald-400/55",
    iconBg: "from-emerald-400/20 via-emerald-400/10 to-emerald-400/5",
    iconText: "text-emerald-300",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    orb: "rgba(16,185,129,0.22)",
    glow: "rgba(16,185,129,0.18)",
    featured: false,
  },
} as const;

type PlanKey = keyof typeof TIER_VISUAL;

// ─── Feature bullets per tier (Arabic, display-only) ─────────────────────────

const TIER_BULLETS: Record<PlanKey, string[]> = {
  basic: [
    "لوحة التحكم الرئيسية",
    "إدارة المهام",
    "العملاء CRM",
    "إدارة الموظفين (أساسي)",
    "التقارير الأساسية",
  ],
  growth: [
    "كل مزايا الأساسي",
    "الهيكل الإداري والأقسام",
    "المالية الأساسية",
    "التقارير التشغيلية",
  ],
  advanced: [
    "كل مزايا نمو",
    "المكتب الافتراضي التنفيذي",
    "مركز الأتمتة",
    "الاستراتيجية والتخطيط",
    "التقارير المتقدمة",
  ],
  enterprise: [
    "كل مزايا متقدم",
    "منشآت متعددة",
    "علامة بيضاء (اختياري)",
    "SLA مخصص",
    "دعم مخصص وتدريب",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function PlanCard({ plan }: { plan: PlanKey }) {
  const v = TIER_VISUAL[plan];
  const Icon = v.icon;
  const label = PLAN_LABELS_AR[plan];
  const basePrice = PLAN_BASE_PRICE_SAR[plan];
  const launchPrice = PLAN_LAUNCH_PRICE_SAR[plan];
  const maxUsers = PLAN_MAX_USERS[plan];
  const bullets = TIER_BULLETS[plan];
  const isEnterprise = plan === "enterprise";

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 ${v.border} ${v.hoverBorder} hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.72)] ${
        v.featured
          ? "ring-1 ring-inset ring-amber-400/20 shadow-[0_0_40px_-12px_rgba(245,158,11,0.25)]"
          : ""
      }`}
    >
      {/* Ambient orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-60 transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: v.orb }}
      />

      {/* Featured badge */}
      {v.featured && (
        <div className="relative mb-3 flex justify-end">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-medium ${v.badge}`}>
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
            الأكثر طلباً
          </span>
        </div>
      )}
      {!v.featured && <div className="mb-3 h-5" aria-hidden="true" />}

      {/* Icon + label */}
      <div className="relative flex items-center gap-3 mb-4">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br ${v.iconBg} ${v.iconText}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <div>
          <h3 className={`text-[17px] font-bold leading-snug ${v.iconText}`}>{label}</h3>
          {maxUsers !== null ? (
            <p className="text-[12px] text-white/50 flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" strokeWidth={1.8} />
              حتى {maxUsers} مستخدم
            </p>
          ) : (
            <p className="text-[12px] text-white/50 flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" strokeWidth={1.8} />
              غير محدود
            </p>
          )}
        </div>
      </div>

      {/* Price block */}
      <div className="relative mb-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
        {isEnterprise ? (
          <>
            <div className="text-[12px] text-white/50 mb-1">يبدأ من</div>
            <div className="text-[24px] font-bold text-white leading-none">
              1,999
              <span className="text-[13px] font-normal text-white/60 mr-1">ر.س / شهر</span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-white/40">عقد مخصص — تواصل مع الفريق</div>
          </>
        ) : (
          <>
            <div className="text-[12px] text-white/50 mb-1">عرض الإطلاق</div>
            <div className="flex items-end gap-2">
              <span className="text-[26px] font-bold text-white leading-none">
                {launchPrice?.toLocaleString("en-US")}
              </span>
              <span className="text-[13px] text-white/60 mb-0.5">ر.س / شهر</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[12px] line-through text-white/35">
                {basePrice?.toLocaleString("en-US")} ر.س
              </span>
              <span className={`text-[10.5px] rounded-full border px-2 py-0.5 font-medium ${v.badge}`}>
                خصم 50%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-white/35">لأول 6 أشهر فقط</div>
          </>
        )}
      </div>

      {/* Feature bullets */}
      <ul className="relative mb-6 space-y-2 flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[13px] text-white/80">
            <span
              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${v.iconBg} bg-gradient-to-br border border-white/[0.08]`}
            >
              <Check className={`h-2.5 w-2.5 ${v.iconText}`} strokeWidth={2.5} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isEnterprise ? (
        <Link
          href="/demo"
          className={`relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border font-medium h-11 text-[13.5px] transition-all duration-300 ${v.border} ${v.iconText} bg-white/[0.03] hover:bg-white/[0.07]`}
        >
          تواصل معنا
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
        </Link>
      ) : (
        <Link
          href="/demo"
          className={`relative inline-flex w-full items-center justify-center gap-2 rounded-2xl font-medium h-11 text-[13.5px] text-white transition-all duration-300 shadow-[0_8px_24px_-8px_var(--plan-glow)] hover:brightness-110`}
          style={{
            background: `linear-gradient(135deg, ${v.accent}cc, ${v.accent}88)`,
            ["--plan-glow" as string]: `${v.glow}`,
          }}
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
          طلب التفعيل
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const PLANS: PlanKey[] = ["basic", "growth", "advanced", "enterprise"];

export default function PricingSection() {
  return (
    <section id="pricing" className="relative py-20 sm:py-24 lg:py-32">
      {/* Divider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.06),transparent_65%)] blur-3xl"
      />

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 relative">
        {/* Heading */}
        <div className="max-w-3xl text-center mx-auto">
          <EyebrowChip>باقات الإطلاق</EyebrowChip>
          <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">
            باقات{" "}
            <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
              Blumark24 OS
            </span>
          </h2>
          <p
            className="mt-4 text-base sm:text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            اختر الباقة المناسبة لتشغيل أعمالك بذكاء
          </p>
        </div>

        {/* Launch offer banner */}
        <div className="mt-8 mx-auto max-w-2xl flex items-center justify-center gap-3 rounded-2xl border border-[#22D3EE]/25 bg-[rgba(34,211,238,0.06)] backdrop-blur-md px-5 py-3.5 text-center">
          <Sparkles className="h-4 w-4 text-[#22D3EE] shrink-0" strokeWidth={1.8} />
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.80)" }}>
            <span className="font-semibold text-[#22D3EE]">عرض الإطلاق:</span>{" "}
            خصم 50% لأول 100 منشأة — لمدة 6 أشهر فقط، ثم يعود للسعر الأصلي
          </p>
        </div>

        {/* Plan cards grid */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan} plan={plan} />
          ))}
        </div>

        {/* Payment notice */}
        <p
          className="mt-8 text-center text-[12.5px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          الدفع الإلكتروني قريبًا — للتفعيل تواصل مع فريق Blumark24 عبر{" "}
          <Link href="/demo" className="text-[#22D3EE]/80 hover:text-[#22D3EE] transition underline underline-offset-2">
            نموذج الطلب
          </Link>
        </p>
      </div>
    </section>
  );
}
