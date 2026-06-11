"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Sparkles, ArrowLeft, X, CheckCircle2 } from "lucide-react";
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

const PLAN_NAME_AR: Record<PlanKey, string> = {
  basic: "أساسي",
  growth: "نمو",
  advanced: "متقدم",
  enterprise: "مؤسسي",
};

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

// ─── Shared input style ───────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder-white/30 outline-none transition focus:border-[#22D3EE]/50 focus:bg-white/[0.07] focus:ring-0";

// ─── Activation Modal ─────────────────────────────────────────────────────────

interface ModalProps {
  initialPlan: PlanKey;
  onClose: () => void;
}

function ActivationModal({ initialPlan, onClose }: ModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orgName: "",
    activityType: "",
    plan: initialPlan,
    contactName: "",
    phone: "",
    email: "",
    message: "",
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Focus trap: focus the dialog on mount
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No data is sent — static success state only
    setSubmitted(true);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      {/* Dim layer — click to close */}
      <div
        className="absolute inset-0 bg-[#050816]/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="طلب تفعيل Blumark24 OS"
        tabIndex={-1}
        dir="rtl"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.12] bg-[rgba(10,18,38,0.96)] backdrop-blur-2xl shadow-[0_32px_80px_-16px_rgba(0,0,0,0.7)] outline-none"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition z-10"
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>

        <div className="p-6 sm:p-8">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center py-6 gap-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10">
                <CheckCircle2 className="h-8 w-8 text-[#22D3EE]" strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-white leading-snug mb-2">
                  تم استلام طلبك
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
                  تم استلام طلبك مبدئيًا — سيتواصل معك فريق Blumark24 لتفعيل الباقة.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 inline-flex items-center justify-center rounded-2xl h-11 px-8 text-[14px] font-medium bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.45)] hover:brightness-110 transition"
              >
                حسنًا
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-white leading-snug mb-2">
                  طلب تفعيل{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                    Blumark24 OS
                  </span>
                </h2>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                  اترك بياناتك وسيقوم فريق Blumark24 بالتواصل معك لتفعيل الباقة المناسبة.
                </p>
              </div>

              {/* No-payment notice */}
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#22D3EE]/15 border border-[#22D3EE]/25">
                  <Check className="h-2.5 w-2.5 text-[#22D3EE]" strokeWidth={2.5} />
                </span>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                  هذا النموذج لا ينفذ أي عملية دفع. فريق Blumark24 سيتواصل معك لاستكمال التفعيل.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {/* اسم المنشأة */}
                <div>
                  <label className="block text-[12.5px] text-white/55 mb-1.5">
                    اسم المنشأة <span className="text-[#22D3EE]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة النهضة للتقنية"
                    value={form.orgName}
                    onChange={(e) => set("orgName", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>

                {/* نوع النشاط */}
                <div>
                  <label className="block text-[12.5px] text-white/55 mb-1.5">
                    نوع النشاط <span className="text-[#22D3EE]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: وكالة تسويق، شركة خدمات، مكتب محاسبة..."
                    value={form.activityType}
                    onChange={(e) => set("activityType", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>

                {/* الباقة المطلوبة */}
                <div>
                  <label className="block text-[12.5px] text-white/55 mb-1.5">
                    الباقة المطلوبة <span className="text-[#22D3EE]">*</span>
                  </label>
                  <select
                    required
                    value={form.plan}
                    onChange={(e) => set("plan", e.target.value as PlanKey)}
                    className={`${INPUT_CLS} cursor-pointer`}
                  >
                    {(Object.entries(PLAN_NAME_AR) as [PlanKey, string][]).map(([key, label]) => (
                      <option key={key} value={key} className="bg-[#0a1628] text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* اسم المسؤول */}
                <div>
                  <label className="block text-[12.5px] text-white/55 mb-1.5">
                    اسم المسؤول <span className="text-[#22D3EE]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الكامل"
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    className={INPUT_CLS}
                  />
                </div>

                {/* رقم الجوال + البريد — side by side on wider screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[12.5px] text-white/55 mb-1.5">
                      رقم الجوال <span className="text-[#22D3EE]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="05XXXXXXXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={INPUT_CLS}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] text-white/55 mb-1.5">
                      البريد الإلكتروني <span className="text-[#22D3EE]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={INPUT_CLS}
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* رسالة اختيارية */}
                <div>
                  <label className="block text-[12.5px] text-white/55 mb-1.5">
                    رسالة اختيارية
                  </label>
                  <textarea
                    rows={3}
                    placeholder="أي تفاصيل إضافية أو متطلبات خاصة..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-2xl h-12 text-[14.5px] font-semibold bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_28px_-8px_rgba(34,211,238,0.50)] hover:brightness-110 transition-all duration-300"
                >
                  إرسال الطلب
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

function PlanCard({
  plan,
  onRequest,
}: {
  plan: PlanDef;
  onRequest: (key: PlanKey) => void;
}) {
  const p = PALETTE[plan.key];
  const isEnterprise = plan.key === "enterprise";
  const basePrice = PLAN_BASE_PRICE_SAR[plan.key];
  const launchPrice = PLAN_LAUNCH_PRICE_SAR[plan.key];

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-[rgba(10,22,40,0.60)] backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.78)] ${p.border} ${plan.featured ? p.glow : ""}`}
    >
      {/* Featured badge row */}
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

      {/* CTA — button, not link */}
      <button
        type="button"
        onClick={() => onRequest(plan.key)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl h-11 text-[13.5px] transition-all duration-300 ${p.ctaCls}`}
      >
        {plan.cta}
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function PricingSection() {
  const [activePlan, setActivePlan] = useState<PlanKey | null>(null);

  const openModal = (plan: PlanKey) => setActivePlan(plan);
  const closeModal = () => setActivePlan(null);

  return (
    <>
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
              <PlanCard key={plan.key} plan={plan} onRequest={openModal} />
            ))}
          </div>

          {/* Payment notice */}
          <p
            className="mt-8 text-center text-[12px]"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            الدفع الإلكتروني قريبًا — للتفعيل المبكر تواصل مع فريق Blumark24 عبر زر طلب التفعيل.
          </p>

        </div>
      </section>

      {/* Activation modal — rendered outside section flow to avoid stacking context */}
      {activePlan !== null && (
        <ActivationModal initialPlan={activePlan} onClose={closeModal} />
      )}
    </>
  );
}
