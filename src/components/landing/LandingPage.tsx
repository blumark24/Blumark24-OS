"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Briefcase,
  Check,
  Cloud,
  DollarSign,
  Languages,
  ListChecks,
  LogIn,
  Menu,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import HeroVisual from "./HeroVisual";

const NAV = [
  { href: "#home", label: "الرئيسية" },
  { href: "#features", label: "المزايا" },
  { href: "#modules", label: "الوحدات" },
  { href: "#contact", label: "تواصل" },
];

const TRUST_BULLETS = ["بدون بطاقة ائتمان", "إعداد سريع", "دعم عربي كامل"];

const BRAND_PILLS = ["Arabic-first SaaS", "AI Business OS", "Built for Saudi Companies"];

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    label: "آمن وموثوق",
    desc: "حماية بيانات على أعلى مستوى مع صلاحيات دقيقة.",
  },
  {
    icon: Cloud,
    label: "سحابي 100%",
    desc: "الوصول من أي مكان وفي أي وقت، بدون إعدادات معقّدة.",
  },
  {
    icon: Languages,
    label: "صنع للسعودية",
    desc: "عربي بالكامل، مرتبط بقطاع الأعمال السعودي ورؤية 2030.",
  },
];

const PROBLEMS = [
  { n: "01", title: "البيانات متفرقة", desc: "بين ملفات ورسائل يصعب تتبعها." },
  { n: "02", title: "المهام تضيع", desc: "بدون متابعة واضحة للمسؤوليات." },
  { n: "03", title: "العملاء يحتاجون CRM منظم", desc: "حتى لا تضيع الفرص وسجل التواصل." },
  { n: "04", title: "القرارات المالية تحتاج لحظية", desc: "لتحليل الأداء واتخاذ قرارات دقيقة." },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "ذكاء اصطناعي مدمج",
    desc: "مساعد ذكي يحلّل البيانات ويلخّص التقارير ويقترح خطوات تشغيلية.",
  },
  {
    icon: Workflow,
    title: "أتمتة عمليات شاملة",
    desc: "سيناريوهات تشغيل ذكية تربط بين الوحدات وتقلّل العمل اليدوي.",
  },
  {
    icon: BarChart3,
    title: "تقارير حيّة ومرنة",
    desc: "نظرة فورية على الأداء والمؤشرات مع تخصيص كامل لكل قسم.",
  },
  {
    icon: ShieldCheck,
    title: "أمان مؤسسي",
    desc: "صلاحيات دقيقة، تشفير على مستوى الصف، وسجل تدقيق شفاف.",
  },
];

const MODULES = [
  { icon: Users, title: "الموظفين", route: "/employees", desc: "إدارة الأعضاء والصلاحيات والأدوار من مكان واحد." },
  { icon: ListChecks, title: "المهام", route: "/tasks", desc: "توزيع المهام، متابعة الحالة، وربط الإنجاز بالمسؤوليات." },
  { icon: Briefcase, title: "العملاء CRM", route: "/clients", desc: "تنظيم العملاء، الفرص، مراحل البيع، وسجل التواصل." },
  { icon: DollarSign, title: "المالية", route: "/finance", desc: "متابعة الإيرادات، المصروفات، الفواتير، وصافي الأداء." },
  { icon: Target, title: "الاستراتيجية", route: "/strategy", desc: "أهداف ومؤشرات أداء واضحة وقابلة للقياس لكل فريق." },
  { icon: Workflow, title: "مركز الأتمتة", route: "/automation", desc: "سيناريوهات تشغيل تربط الوحدات وتقلّل التدخل اليدوي." },
  { icon: Bot, title: "المساعد الذكي", route: "/ai", desc: "ذكاء اصطناعي على بيانات شركتك يجاوب ويلخّص ويقترح." },
  { icon: BarChart3, title: "التقارير", route: "/reports", desc: "تقارير حيّة قابلة للتخصيص بنظرة شاملة وفورية." },
];

function PrimaryCta({ className = "", label = "طلب عرض تجريبي" }: { className?: string; label?: string }) {
  return (
    <Link
      href="/demo"
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition ${className}`}
    >
      {label}
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} />
    </Link>
  );
}

function SecondaryCta({ className = "", label = "تسجيل الدخول" }: { className?: string; label?: string }) {
  return (
    <Link
      href="/auth"
      className={`inline-flex items-center justify-center rounded-2xl font-medium h-14 px-8 text-base bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] backdrop-blur-md hover:bg-white/[0.08] transition ${className}`}
    >
      {label}
    </Link>
  );
}

function EyebrowChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4">
      <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
  titleAccent,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  titleAccent?: string;
}) {
  return (
    <div className="max-w-3xl text-center mx-auto">
      <EyebrowChip>{eyebrow}</EyebrowChip>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">
        {title}{" "}
        {titleAccent && (
          <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">
            {titleAccent}
          </span>
        )}
      </h2>
      <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };
  const openMenu = () => {
    setMobileMenuOpen(true);
    document.body.style.overflow = "hidden";
  };

  return (
    <div
      className="min-h-screen bg-[#050B16] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(10,22,40,1),rgba(5,11,22,1))]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.06), transparent 40%), radial-gradient(circle at 80% 30%, rgba(30,111,217,0.06), transparent 40%), radial-gradient(circle at 50% 80%, rgba(34,211,238,0.04), transparent 50%)",
          }}
        />
      </div>

      {/* ━━━━━━━━━━ HEADER ━━━━━━━━━━ */}
      <header className="fixed inset-x-0 top-0 z-50 py-3 sm:py-4">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="flex flex-row-reverse lg:flex-row items-center justify-between rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(5,11,22,0.78)] backdrop-blur-2xl px-3 sm:px-5 h-16 min-w-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
            <Link
              href="/"
              className="flex items-center flex-shrink-0"
              aria-label="Blumark24 Marketing Agency"
            >
              <OfficialBlumarkLogo className="w-[140px] sm:w-[160px] lg:w-[180px]" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-[13.5px] text-[#AAB7C7] hover:text-white rounded-lg hover:bg-white/[0.04] transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl font-medium h-10 px-4 text-sm text-[#AAB7C7] hover:text-white hover:bg-white/[0.04] transition"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-10 px-4 text-sm bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition"
              >
                طلب عرض تجريبي
              </Link>
            </div>

            <button
              onClick={openMenu}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.16)] bg-white/[0.03] text-white hover:bg-white/[0.06] transition"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━ MOBILE MENU ━━━━━━━━━━ */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-[#050B16]/85 backdrop-blur-md"
          onClick={closeMenu}
        />
        <div className="absolute inset-x-3 top-3 rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(10,22,40,0.95)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex flex-row-reverse items-center justify-between p-4 border-b border-white/5">
            <OfficialBlumarkLogo className="w-[140px]" />
            <button
              onClick={closeMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
          <nav className="p-3">
            {NAV.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block px-4 py-3.5 text-[15px] text-white/90 hover:bg-white/[0.04] rounded-xl ${
                  i < NAV.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 pt-2 grid gap-2.5">
            <Link
              href="/auth"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] backdrop-blur-md w-full"
            >
              <LogIn className="h-4 w-4" strokeWidth={1.8} />
              تسجيل الدخول
            </Link>
            <Link
              href="/demo"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] w-full"
            >
              <Send className="h-4 w-4" strokeWidth={1.8} />
              طلب عرض تجريبي
            </Link>
          </div>
        </div>
      </div>

      <main>
        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section
          id="home"
          className="relative pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-20 lg:pb-28 overflow-hidden"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                WebkitMaskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
                maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
              }}
            />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] blur-3xl animate-pulse-slow" />
            <div className="absolute top-40 -right-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.22),transparent_60%)] blur-3xl" />
            <div className="absolute top-60 -left-32 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.15),transparent_60%)] blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex justify-center animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D3EE]" />
                </span>
                <span className="text-[12px] sm:text-[13px] font-medium text-[#22D3EE]">
                  نظام إدارة الأعمال بالذكاء الاصطناعي
                </span>
              </div>
            </div>

            <h1
              className="mt-6 sm:mt-8 text-center text-[34px] leading-[1.18] sm:text-5xl sm:leading-[1.15] md:text-6xl lg:text-7xl font-bold text-white tracking-tight max-w-5xl mx-auto animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              نظام إدارة أعمال ذكي يقود شركتك{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-[#22D3EE] via-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">
                  من مكان واحد
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -inset-x-2 -inset-y-1 -z-10 bg-[radial-gradient(ellipse,rgba(34,211,238,0.18),transparent_70%)] blur-xl"
                />
              </span>
            </h1>

            <p
              className="mt-5 sm:mt-6 text-center text-[15.5px] sm:text-lg md:text-xl text-[#AAB7C7] leading-relaxed max-w-3xl mx-auto animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Blumark24 OS يجمع الموظفين، المهام، العملاء، المالية، التقارير، والأتمتة
              داخل منصة عربية مدعومة بالذكاء الاصطناعي لتقليل الفوضى ورفع كفاءة التشغيل.
            </p>

            <div
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <PrimaryCta className="w-full sm:w-auto" />
              <SecondaryCta className="w-full sm:w-auto" />
            </div>

            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-[#AAB7C7] animate-fade-up"
              style={{ animationDelay: "400ms" }}
            >
              {TRUST_BULLETS.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#22D3EE]" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>

            <div
              className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-up"
              style={{ animationDelay: "450ms" }}
            >
              {BRAND_PILLS.map((label) => (
                <span
                  key={label}
                  dir="ltr"
                  className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11.5px] text-[#AAB7C7]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div
              className="mt-10 sm:mt-14 animate-fade-up animate-float"
              style={{ animationDelay: "500ms" }}
            >
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ TRUST BAR ━━━━━━━━━━ */}
        <section className="relative py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {TRUST_CARDS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-4 sm:p-5 flex items-center gap-4 min-w-0"
                  >
                    <div className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.12)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE]">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] sm:text-base font-semibold text-white">{item.label}</div>
                      <div className="mt-0.5 text-[12.5px] sm:text-[13px] text-[#AAB7C7] leading-relaxed">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ PROBLEMS ━━━━━━━━━━ */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="المشكلة"
              title="المشاكل اللي تواجه الشركات كل يوم"
              desc="الفوضى التشغيلية تكلّف الشركات وقتاً وأموالاً وفرصاً ضائعة كل يوم."
            />

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {PROBLEMS.map((p) => (
                <div
                  key={p.n}
                  className="rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-xl border border-[rgba(255,122,61,0.34)] bg-[rgba(255,122,61,0.08)] flex items-center justify-center font-mono text-[#FF7A3D] text-sm font-semibold">
                      {p.n}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] sm:text-[17px] font-semibold text-white mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-[13.5px] sm:text-[14px] text-[#AAB7C7] leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 mx-auto max-w-3xl">
              <div className="relative rounded-2xl border border-[rgba(34,211,238,0.34)] bg-gradient-to-l from-[rgba(34,211,238,0.08)] via-[rgba(30,111,217,0.04)] to-[rgba(34,211,238,0.08)] p-5 sm:p-6 text-center backdrop-blur-md">
                <div
                  aria-hidden="true"
                  className="absolute -inset-x-10 -inset-y-4 -z-10 bg-[radial-gradient(ellipse,rgba(34,211,238,0.15),transparent_70%)] blur-2xl"
                />
                <p className="text-[15px] sm:text-base text-white leading-relaxed">
                  <span className="font-semibold">Blumark24 OS</span> يحوّل هذا التشتت إلى{" "}
                  <span className="text-[#22D3EE]">نظام واحد واضح وقابل للقياس</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FEATURES ━━━━━━━━━━ */}
        <section id="features" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="المميزات"
              title="المميزات الرئيسية"
              desc="قدرات مصمّمة لتحويل بيانات شركتك إلى قرارات ذكية وإجراءات تشغيلية."
            />

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6 group overflow-hidden"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE] mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Icon className="h-6 w-6" strokeWidth={1.6} />
                      </div>
                      <h3 className="text-[16px] sm:text-[17px] font-semibold text-white mb-1.5 leading-snug">
                        {f.title}
                      </h3>
                      <p className="text-[13.5px] sm:text-[14px] text-[#AAB7C7] leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ MODULES ━━━━━━━━━━ */}
        <section id="modules" className="relative py-16 sm:py-24">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              background: "radial-gradient(ellipse at top, rgba(34,211,238,0.06), transparent 60%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="الوحدات"
              title="كل أقسام شركتك داخل منصة واحدة"
              desc="ثماني وحدات تشغيلية متكاملة، مصمّمة للعمل معاً كمنظومة موحّدة."
            />

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.title}
                    className="rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6 group relative overflow-hidden min-w-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE] group-hover:scale-110 transition-transform duration-500">
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-[15.5px] sm:text-base font-semibold text-white">
                            {m.title}
                          </h3>
                          <span className="text-[10px] text-[#AAB7C7]/60 font-mono" dir="ltr">
                            {m.route}
                          </span>
                        </div>
                        <p className="text-[13.5px] text-[#AAB7C7] leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FINAL CTA ━━━━━━━━━━ */}
        <section id="contact" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(34,211,238,0.34)] bg-gradient-to-br from-[rgba(34,211,238,0.08)] via-[rgba(10,22,40,0.9)] to-[rgba(30,111,217,0.08)] backdrop-blur-2xl">
              <div
                aria-hidden="true"
                className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_60%)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.28),transparent_60%)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(34,211,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.4) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative p-7 sm:p-12 lg:p-16 text-center">
                <EyebrowChip>ابدأ التحوّل الآن</EyebrowChip>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight max-w-3xl mx-auto">
                  حوّل شركتك من إدارة متفرقة إلى{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">
                    نظام ذكي واحد
                  </span>
                </h2>

                <p className="mt-5 sm:mt-6 text-[15px] sm:text-lg text-[#AAB7C7] leading-relaxed max-w-2xl mx-auto">
                  ابدأ بعرض تجريبي يوضح كيف يمكن لـ Blumark24 OS تنظيم التشغيل، تحسين
                  المتابعة، ورفع كفاءة القرارات.
                </p>

                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <PrimaryCta className="w-full sm:w-auto" />
                  <SecondaryCta className="w-full sm:w-auto" />
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-[#AAB7C7]">
                  {TRUST_BULLETS.map((item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#22D3EE]" strokeWidth={2.5} />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ━━━━━━━━━━ FOOTER ━━━━━━━━━━ */}
      <footer className="relative border-t border-white/[0.06] bg-[rgba(5,11,22,0.6)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div className="lg:col-span-1">
              <OfficialBlumarkLogo className="w-[140px]" />
              <p className="mt-4 text-[13.5px] text-[#AAB7C7] leading-relaxed">
                نظام إدارة الأعمال بالذكاء الاصطناعي للشركات السعودية. منصة عربية لتنظيم
                التشغيل ورفع الكفاءة من مكان واحد.
              </p>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                المنتج
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a href="#features" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    المزايا
                  </a>
                </li>
                <li>
                  <a href="#modules" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    الوحدات
                  </a>
                </li>
                <li>
                  <Link href="/demo" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    عرض تجريبي
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    تسجيل الدخول
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                الشركة
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a href="#contact" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    تواصل معنا
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    الشروط والأحكام
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    سياسة الخصوصية
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">
                تواصل
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://www.blumark24.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block"
                  >
                    www.blumark24.com
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@blumark.sa"
                    dir="ltr"
                    className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block"
                  >
                    info@blumark.sa
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/966507006849"
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block"
                  >
                    +966 0507006849
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 sm:mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12.5px] text-[#AAB7C7]">© Blumark24 OS. جميع الحقوق محفوظة.</p>
            <p className="text-[12px] text-[#AAB7C7]/70" dir="ltr">
              Built for Saudi companies · صنع للسعودية
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
