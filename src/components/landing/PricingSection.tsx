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
    cta: "اشتراك",
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
    cta: "اشتراك",
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
    cta: "اشتراك",
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
  checkColor: string;
  badgeCls: string;
  ctaCls: string;
  glow?: string;
  cardBg: string;
}> = {
  basic: {
    border: "border-white/[0.07] hover:border-cyan-400/30",
    accentText: "text-cyan-300",
    checkColor: "text-cyan-400",
    cardBg: "bg-white/[0.04]",
    badgeCls: "",
    ctaCls:
      "border border-white/[0.14] text-white/80 hover:border-cyan-400/40 hover:text-cyan-200 hover:bg-white/[0.05]",
  },
  growth: {
    border: "border-white/[0.07] hover:border-violet-400/30",
    accentText: "text-violet-300",
    checkColor: "text-violet-400",
    cardBg: "bg-white/[0.04]",
    badgeCls: "",
    ctaCls:
      "border border-white/[0.14] text-white/80 hover:border-violet-400/40 hover:text-violet-200 hover:bg-white/[0.05]",
  },
  advanced: {
    border: "border-amber-400/25 hover:border-amber-400/50",
    accentText: "text-amber-300",
    checkColor: "text-amber-400",
    cardBg: "bg-[rgba(245,158,11,0.04)]",
    badgeCls: "bg-amber-500/10 text-amber-300 border border-amber-400/25",
    ctaCls:
      "bg-gradient-to-l from-[#f59e0b] to-[#fbbf24] text-[#0a0f1a] font-semibold shadow-[0_6px_22px_-6px_rgba(245,158,11,0.50)] hover:brightness-110",
    glow: "shadow-[0_0_56px_-18px_rgba(245,158,11,0.18)]",
  },
  enterprise: {
    border: "border-white/[0.07] hover:border-emerald-400/30",
    accentText: "text-emerald-300",
    checkColor: "text-emerald-400",
    cardBg: "bg-white/[0.04]",
    badgeCls: "",
    ctaCls:
      "border border-white/[0.14] text-white/80 hover:border-emerald-400/40 hover:text-emerald-200 hover:bg-white/[0.05]",
  },
};

// ─── Shared input style ───────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-[13.5px] text-white placeholder-white/25 outline-none transition focus:border-[#22D3EE]/45 focus:bg-white/[0.06] focus:ring-0";

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030810]/75 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="اشتراك Blumark24 OS"
        tabIndex={-1}
        dir="rtl"
        className="relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-3xl border border-white/[0.08] bg-[rgba(8,14,30,0.92)] backdrop-blur-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.80),0_0_0_1px_rgba(34,211,238,0.06)] outline-none"
      >
        {/* Subtle cyan glow top-center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-[radial-gradient(ellipse,rgba(34,211,238,0.12),transparent_70%)] blur-2xl"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute top-4 left-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40 hover:text-white hover:bg-white/[0.07] transition"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        <div className="relative px-6 pt-6 pb-7 sm:px-8 sm:pt-7 sm:pb-8">
          {submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center py-8 gap-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/[0.08]">
                <CheckCircle2 className="h-7 w-7 text-[#22D3EE]" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[18px] font-bold text-white leading-snug">
                  تم استلام طلب الاشتراك
                </h3>
                <p className="text-[13px] leading-relaxed max-w-[340px] mx-auto" style={{ color: "rgba(255,255,255,0.60)" }}>
                  تم استلام طلب الاشتراك مبدئيًا — سيتواصل معك فريق Blumark24 لتفعيل الباقة.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-1 inline-flex items-center justify-center rounded-2xl h-10 px-8 text-[13.5px] font-medium bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_6px_20px_-6px_rgba(34,211,238,0.40)] hover:brightness-110 transition"
              >
                حسنًا
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <>
              {/* Header */}
              <div className="mb-5">
                <h2 className="text-[19px] sm:text-[21px] font-bold text-white leading-snug mb-1.5">
                  اشتراك{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                    Blumark24 OS
                  </span>
                </h2>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                  أدخل بياناتك، وسيقوم فريق Blumark24 بالتواصل معك لإكمال الاشتراك وتفعيل الباقة.
                </p>
              </div>

              {/* No-payment notice */}
              <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-2.5">
                <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#22D3EE]/15 border border-[#22D3EE]/20">
                  <Check className="h-2 w-2 text-[#22D3EE]" strokeWidth={3} />
                </span>
                <p className="text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  هذا النموذج لا ينفذ أي عملية دفع.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {/* اسم المنشأة */}
                <div>
                  <label className="block text-[12px] text-white/45 mb-1.5">
                    اسم المنشأة <span className="text-[#22D3EE]/70">*</span>
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
                  <label className="block text-[12px] text-white/45 mb-1.5">
                    نوع النشاط <span className="text-[#22D3EE]/70">*</span>
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
                  <label className="block text-[12px] text-white/45 mb-1.5">
                    الباقة المطلوبة <span className="text-[#22D3EE]/70">*</span>
                  </label>
                  <select
                    required
                    value={form.plan}
                    onChange={(e) => set("plan", e.target.value as PlanKey)}
                    className={`${INPUT_CLS} cursor-pointer`}
                  >
                    {(Object.entries(PLAN_NAME_AR) as [PlanKey, string][]).map(([key, label]) => (
                      <option key={key} value={key} className="bg-[#080e1e] text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* اسم المسؤول */}
                <div>
                  <label className="block text-[12px] text-white/45 mb-1.5">
                    اسم المسؤول <span className="text-[#22D3EE]/70">*</span>
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

                {/* رقم الجوال + البريد — side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-white/45 mb-1.5">
                      رقم الجوال <span className="text-[#22D3EE]/70">*</span>
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
                    <label className="block text-[12px] text-white/45 mb-1.5">
                      البريد الإلكتروني <span className="text-[#22D3EE]/70">*</span>
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
                  <label className="block text-[12px] text-white/45 mb-1.5">
                    رسالة اختيارية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أي تفاصيل إضافية أو متطلبات خاصة..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-2xl h-11 text-[14px] font-semibold bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_6px_24px_-8px_rgba(34,211,238,0.45)] hover:brightness-110 transition-all duration-300"
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
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-[#22D3EE] backdrop-blur-md">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
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
      className={`group relative flex flex-col rounded-2xl border backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-[3px] ${p.border} ${p.cardBg} ${plan.featured ? p.glow : ""}`}
    >
      {/* Featured badge */}
      <div className="mb-3 h-5 flex items-center justify-end">
        {plan.featured && plan.featuredBadge && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${p.badgeCls}`}>
            <Sparkles className="h-2 w-2" strokeWidth={2} />
            {plan.featuredBadge}
          </span>
        )}
      </div>

      {/* Plan name + description */}
      <div className="mb-4">
        <h3 className={`text-[18px] font-bold leading-tight mb-1 ${p.accentText}`}>
          {plan.name}
        </h3>
        <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          {plan.desc}
        </p>
      </div>

      {/* Price */}
      <div className="mb-4 pb-4 border-b border-white/[0.06]">
        {isEnterprise ? (
          <>
            <div className="text-[10.5px] text-white/35 mb-1 uppercase tracking-widest">يبدأ من</div>
            <div className="text-[26px] font-bold text-white leading-none">
              1,999
              <span className="text-[13px] font-normal text-white/40 mr-1.5">ر.س / شهريًا</span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-white/30">عقد مخصص حسب الاحتياج</div>
          </>
        ) : (
          <>
            <div className="text-[10.5px] text-white/35 mb-1 uppercase tracking-widest">سعر إطلاق لمدة 6 أشهر</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-white leading-none">
                {launchPrice?.toLocaleString("en-US")}
              </span>
              <span className="text-[13px] text-white/40">ر.س / شهريًا</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[11.5px] line-through text-white/25">
                {basePrice?.toLocaleString("en-US")} ر.س
              </span>
              <span className="text-[10px] text-white/35">السعر الأساسي</span>
            </div>
          </>
        )}
      </div>

      {/* Best-for */}
      <p className="mb-4 text-[11.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
        {plan.bestFor}
      </p>

      {/* Feature list */}
      <ul className="mb-5 space-y-2 flex-1">
        {plan.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[12.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${p.checkColor}`} strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onRequest(plan.key)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl h-10 text-[13px] font-medium transition-all duration-300 ${p.ctaCls}`}
      >
        {plan.cta}
        <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" strokeWidth={2} />
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
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.07] to-transparent"
        />

        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 h-[440px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.04),transparent_65%)] blur-3xl"
        />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 relative">

          {/* Heading block */}
          <div className="max-w-2xl text-center mx-auto">
            <EyebrowChip>عرض الإطلاق للسوق السعودي</EyebrowChip>
            <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">
              باقات{" "}
              <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                Blumark24 OS
              </span>
            </h2>
            <p
              className="mt-4 text-base sm:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.62)" }}
            >
              اختر الخطة المناسبة لتشغيل أعمالك بذكاء، من البداية حتى التوسع.
            </p>
          </div>

          {/* Launch offer strip */}
          <div className="mt-8 mx-auto max-w-xl rounded-2xl border border-[#22D3EE]/15 bg-[rgba(34,211,238,0.04)] backdrop-blur-md px-5 py-3.5 text-center">
            <p className="text-[12.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.68)" }}>
              <span className="font-semibold text-[#22D3EE]">عرض الإطلاق</span>
              {" — "}
              استفد من خصم 50% على باقات Blumark24 OS حتى 30-12-202
            </p>
          </div>

          {/* Payment notice */}
          <p
            className="mt-8 text-center text-[12px]"
            style={{ color: "rgba(255,255,255,0.32)" }}
          >
            الدفع الإلكتروني قريبًا — الاشتراك الحالي يتم عبر فريق Blumark24.
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
