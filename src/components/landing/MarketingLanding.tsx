"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  ClipboardList,
  DollarSign,
  FileBarChart,
  Languages,
  Layers,
  LogIn,
  Menu,
  Plug,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import CodexAnimatedBackground from "@/components/landing/CodexAnimatedBackground";
import Jellyfish from "@/components/demo/Jellyfish";
import PricingSection from "@/components/landing/PricingSection";

type Lang = "ar" | "en";

// ─── Bilingual content ────────────────────────────────────────────────────────

const CONTENT = {
  ar: {
    dir: "rtl" as const,
    langToggle: "English",
    nav: [
      { href: "#home", label: "الرئيسية" },
      { href: "#why", label: "لماذا نحن" },
      { href: "#features", label: "المزايا" },
      { href: "#how", label: "كيف يعمل" },
      { href: "#audience", label: "لمن مناسب" },
      { href: "#pricing", label: "الباقات" },
    ],
    trustBullets: ["إعداد سريع", "دعم عربي كامل", "منصة سعودية"],
    hero: {
      title: "نظام إدارة الأعمال",
      titleAccent: "للفرق السعودية",
      subtitle:
        "إدارة العملاء والمهام والتقارير من مكان واحد — منصة سعودية تدعم التحول الرقمي وتنظّم عمليات فرق العمل.",
    },
    actions: {
      primary: "اطلب العرض التجريبي",
      secondary: "تسجيل دخول المنشآت",
      navLogin: "تسجيل دخول المنشآت",
      navDemo: "طلب العرض التجريبي",
      mobileLogin: "تسجيل دخول المنشآت",
      mobileDemo: "طلب العرض التجريبي",
      menuOpen: "فتح القائمة",
      menuClose: "إغلاق",
    },
    why: {
      eyebrow: "لماذا نحن",
      title: "منظومة عربية واحدة لإدارة",
      titleAccent: "أعمالك بذكاء",
      desc: "أربعة مبادئ بُني عليها النظام لتقدّم تجربة منظمة واحترافية.",
      cards: [
        {
          icon: Languages,
          title: "منصة عربية مصمّمة للسوق السعودي",
          desc: "واجهة RTL أصلية وتجربة مصمّمة لفرق العمل في المملكة.",
        },
        {
          icon: Layers,
          title: "تجربة منظمة بدل تشتّت الأدوات",
          desc: "موظفون، مهام، عملاء، مالية، وأتمتة في تجربة واحدة متّسقة.",
        },
        {
          icon: BrainCircuit,
          title: "لوحات متابعة وتقارير تشغيلية",
          desc: "ملخصات واضحة وتقارير قابلة للتهيئة على بيانات شركتك.",
        },
        {
          icon: ShieldCheck,
          title: "صلاحيات واضحة وإدارة منظمة",
          desc: "صلاحيات دقيقة لكل دور وتتبع منظم للأنشطة.",
        },
      ],
    },
    features: {
      eyebrow: "المزايا الرئيسية",
      title: "كل ما تحتاجه شركتك",
      titleAccent: "في نظام واحد",
      desc: "ست وحدات تشغيلية مصمّمة لتعمل معاً بسلاسة لدعم التحول الرقمي.",
      cards: [
        { icon: Users, title: "إدارة الموظفين", desc: "ملفات الفريق، الصلاحيات الواضحة، والأدوار في مكان واحد منظّم." },
        { icon: ClipboardList, title: "إدارة المهام", desc: "تخطيط ومتابعة لحظية لأداء الفرق وتسليم العمل." },
        { icon: Briefcase, title: "العملاء CRM", desc: "إدارة العملاء والفرص وسجل التواصل بصورة موحّدة." },
        { icon: DollarSign, title: "المالية", desc: "إيرادات، مصروفات، وفواتير مع لوحات متابعة حيّة." },
        { icon: FileBarChart, title: "التقارير", desc: "تقارير تشغيلية قابلة للتهيئة." },
        { icon: Workflow, title: "أتمتة الأعمال", desc: "سيناريوهات تشغيل تربط الوحدات وتقلّل التدخّل اليدوي." },
      ],
    },
    how: {
      eyebrow: "كيف يعمل النظام",
      title: "ثلاث خطوات",
      titleAccent: "لتشغيل أذكى",
      desc: "إعداد واضح وتجربة تشغيل منظمة منذ البداية.",
      stepPrefix: "الخطوة",
      steps: [
        { icon: LogIn, title: "ابدأ خلال دقائق", desc: "أنشئ حساب شركتك وادعُ فريقك بخطوات بسيطة." },
        { icon: Plug, title: "وحّد فرقك ووحداتك", desc: "اربط الموظفين، المهام، العملاء، والمالية في تجربة منظمة واحدة." },
        { icon: Sparkles, title: "تابع الأداء بلوحات متابعة", desc: "تقارير وتنبيهات تشغيلية تساعدك على متابعة الأداء اليومي." },
      ],
    },
    audience: {
      eyebrow: "لمن مناسب",
      title: "مصمّم لشركات تبحث",
      titleAccent: "عن تشغيل احترافي",
      desc: "من فرق صغيرة تبدأ، إلى شركات تشغيلية تتوسّع وتحتاج نظاماً موحّداً.",
      items: [
        { icon: Rocket, title: "الشركات الناشئة", desc: "ابدأ منظّماً من اليوم الأول بدون أدوات متفرّقة." },
        { icon: Target, title: "الوكالات والاستوديوهات", desc: "تابع المشاريع، العملاء، والفواتير من مكان واحد." },
        { icon: Building2, title: "شركات التشغيل والخدمات", desc: "وحّد العمليات اليومية وحسّن كفاءة الفرق." },
        { icon: TrendingUp, title: "الفرق التنفيذية والإدارية", desc: "قرارات مبنية على بيانات حيّة ولوحات متابعة فعلية." },
      ],
    },
    cta: {
      eyebrow: "ابدأ اليوم",
      title: "جاهز تدعم تحول شركتك",
      titleAccent: "الرقمي",
      desc: "احصل على عرض تجريبي مخصّص لشركتك، أو استكشف الديمو التفاعلي مباشرة.",
    },
    footer: {
      links: [
        { href: "#why", label: "لماذا نحن" },
        { href: "#features", label: "المزايا" },
        { href: "#pricing", label: "الباقات" },
        { href: "#contact", label: "تواصل" },
      ],
      copyright: "© Blumark24 OS",
    },
  },
  en: {
    dir: "ltr" as const,
    langToggle: "العربية",
    nav: [
      { href: "#home", label: "Home" },
      { href: "#why", label: "Why Us" },
      { href: "#features", label: "Features" },
      { href: "#how", label: "How It Works" },
      { href: "#audience", label: "Who We Serve" },
      { href: "#pricing", label: "Pricing" },
    ],
    trustBullets: ["Quick setup", "Full Arabic support", "Saudi-built platform"],
    hero: {
      title: "Business Management System",
      titleAccent: "for Saudi Teams",
      subtitle:
        "Manage clients, tasks, and reports from one place — a Saudi-built platform supporting digital operations and organized workflows.",
    },
    actions: {
      primary: "Request a Demo",
      secondary: "Business Sign In",
      navLogin: "Business Sign In",
      navDemo: "Request Demo",
      mobileLogin: "Business Sign In",
      mobileDemo: "Request a Demo",
      menuOpen: "Open menu",
      menuClose: "Close",
    },
    why: {
      eyebrow: "Why Us",
      title: "One organized workspace",
      titleAccent: "for your business",
      desc: "Four core principles built into the system to deliver a professional Saudi business experience.",
      cards: [
        {
          icon: Languages,
          title: "Built for the Saudi Market",
          desc: "Native RTL interface designed for Saudi business teams from day one.",
        },
        {
          icon: Layers,
          title: "Organized workspace for teams",
          desc: "Employees, tasks, clients, finance, and automation in one consistent experience.",
        },
        {
          icon: BrainCircuit,
          title: "Business dashboards and operational reports",
          desc: "Clear operational summaries and configurable reports on your company data.",
        },
        {
          icon: ShieldCheck,
          title: "Clear permissions and organized management",
          desc: "Precise role-based access and organized activity tracking.",
        },
      ],
    },
    features: {
      eyebrow: "Core Features",
      title: "Everything your business needs",
      titleAccent: "in one system",
      desc: "Six operational modules designed to work together seamlessly to support digital operations.",
      cards: [
        { icon: Users, title: "HR Management", desc: "Team profiles, clear permissions, and roles in one organized place." },
        { icon: ClipboardList, title: "Task Management", desc: "Real-time planning and tracking for team performance and delivery." },
        { icon: Briefcase, title: "CRM", desc: "Manage clients, opportunities, and communication history from one place." },
        { icon: DollarSign, title: "Finance", desc: "Revenue, expenses, and invoices with live business dashboards." },
        { icon: FileBarChart, title: "Reports", desc: "Operational reports, configurable to your business needs." },
        { icon: Workflow, title: "Workflow Automation", desc: "Workflows that connect modules and reduce manual effort." },
      ],
    },
    how: {
      eyebrow: "How It Works",
      title: "Three steps to",
      titleAccent: "smarter operations",
      desc: "A clear onboarding experience for organized operations.",
      stepPrefix: "Step",
      steps: [
        { icon: LogIn, title: "Start in minutes", desc: "Create your company account and invite your team in a few simple steps." },
        { icon: Plug, title: "Unify your teams and modules", desc: "Connect employees, tasks, clients, and finance into one organized workspace." },
        { icon: Sparkles, title: "Track performance with dashboards", desc: "Operational reports and alerts to help you monitor daily performance." },
      ],
    },
    audience: {
      eyebrow: "Who We Serve",
      title: "Built for companies seeking",
      titleAccent: "professional operations",
      desc: "From small teams starting out, to scaling operations companies that need a unified system.",
      items: [
        { icon: Rocket, title: "Startups", desc: "Start organized from day one without scattered tools." },
        { icon: Target, title: "Agencies & Studios", desc: "Track projects, clients, and invoices from one place." },
        { icon: Building2, title: "Operations & Services", desc: "Unify daily operations and improve team efficiency." },
        { icon: TrendingUp, title: "Executive Teams", desc: "Decisions based on live data and real business dashboards." },
      ],
    },
    cta: {
      eyebrow: "Get Started Today",
      title: "Ready to support your business",
      titleAccent: "digital operations",
      desc: "Get a personalized demo for your company, or explore the interactive demo right now.",
    },
    footer: {
      links: [
        { href: "#why", label: "Why Us" },
        { href: "#features", label: "Features" },
        { href: "#pricing", label: "Pricing" },
        { href: "#contact", label: "Contact" },
      ],
      copyright: "© Blumark24 OS",
    },
  },
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function PrimaryCta({
  className = "",
  href = "/demo",
  label = "اطلب العرض التجريبي",
}: {
  className?: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-7 sm:px-8 text-base bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:shadow-[0_12px_40px_-8px_rgba(34,211,238,0.7)] hover:brightness-110 transition-all duration-300 ${className}`}
    >
      <Send className="h-4 w-4" strokeWidth={1.8} />
      <span>{label}</span>
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
        strokeWidth={1.8}
      />
    </Link>
  );
}

function SecondaryCta({
  className = "",
  href = "/auth",
  label = "تسجيل دخول المنشآت",
}: {
  className?: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-2xl font-medium h-14 px-7 sm:px-8 text-base bg-white/[0.04] text-white border border-white/[0.10] backdrop-blur-md hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300 ${className}`}
    >
      {label}
    </Link>
  );
}

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

function SectionHeading({
  eyebrow,
  title,
  titleAccent,
  desc,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  desc: string;
}) {
  return (
    <div className="max-w-3xl text-center mx-auto">
      <EyebrowChip>{eyebrow}</EyebrowChip>
      <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">
        {title}
        {titleAccent && (
          <>
            {" "}
            <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
              {titleAccent}
            </span>
          </>
        )}
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
        {desc}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarketingLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<Lang>("ar");

  const c = CONTENT[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };
  const openMenu = () => {
    setMobileMenuOpen(true);
    document.body.style.overflow = "hidden";
  };
  const toggleLang = () => setLang((l) => (l === "ar" ? "en" : "ar"));

  return (
    <>
      <CodexAnimatedBackground />
      <div
        className="marketing-landing-root min-h-screen bg-[#050816] text-white antialiased overflow-x-hidden"
        dir={c.dir}
        style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
      >
      {/* Legacy ambient layer hidden — codex animated bg is active */}
      <div
        aria-hidden="true"
        className="marketing-landing-ambient pointer-events-none fixed inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0F172A,#0A1628_45%,#050816)]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 14% 18%, rgba(34,211,238,0.10), transparent 38%), radial-gradient(circle at 86% 28%, rgba(59,130,246,0.08), transparent 40%), radial-gradient(circle at 50% 88%, rgba(30,111,217,0.06), transparent 50%)",
          }}
        />
      </div>

      {/* ━━━━━━━━━━ HEADER ━━━━━━━━━━ */}
      <header className="fixed inset-x-0 top-0 z-50 py-3 sm:py-4">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-6">
          <div
            className={`flex flex-row-reverse lg:flex-row items-center justify-between rounded-2xl border px-3 sm:px-5 h-16 min-w-0 transition-all duration-300 ${
              scrolled
                ? "border-white/[0.10] bg-[rgba(5,8,22,0.82)] backdrop-blur-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)]"
                : "border-white/[0.06] bg-[rgba(5,8,22,0.5)] backdrop-blur-xl shadow-none"
            }`}
          >
            <Link
              href="/"
              className="flex items-center flex-shrink-0"
              aria-label="Blumark24 OS"
            >
              <OfficialBlumarkLogo className="w-[140px] sm:w-[160px] lg:w-[180px]" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {c.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-[13.5px] text-white/70 hover:text-white rounded-lg hover:bg-white/[0.04] transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 rounded-2xl h-10 px-3 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition"
                aria-label="Toggle language"
              >
                <Languages className="h-4 w-4" strokeWidth={1.6} />
                <span className="text-[12.5px] font-medium">{c.langToggle}</span>
              </button>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl font-medium h-10 px-4 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition"
              >
                {c.actions.navLogin}
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-10 px-4 text-sm bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.5)] hover:brightness-110 transition"
              >
                {c.actions.navDemo}
              </Link>
            </div>

            <button
              onClick={openMenu}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white hover:bg-white/[0.06] transition"
              aria-label={c.actions.menuOpen}
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
          className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
          onClick={closeMenu}
        />
        <div className="absolute inset-x-3 top-3 rounded-3xl border border-white/[0.10] bg-[rgba(10,22,40,0.94)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex flex-row-reverse items-center justify-between p-4 border-b border-white/[0.06]">
            <OfficialBlumarkLogo className="w-[140px]" />
            <button
              onClick={closeMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white"
              aria-label={c.actions.menuClose}
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
          <nav className="p-3">
            {c.nav.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`block px-4 py-3.5 text-[15px] text-white/90 hover:bg-white/[0.04] rounded-xl ${
                  i < c.nav.length - 1 ? "border-b border-white/[0.04]" : ""
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 pt-2 grid gap-2.5">
            <button
              onClick={() => { closeMenu(); toggleLang(); }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-11 px-6 text-[14px] bg-white/[0.04] text-white/70 border border-white/[0.08] w-full"
            >
              <Languages className="h-4 w-4" strokeWidth={1.8} />
              {c.langToggle}
            </button>
            <Link
              href="/auth"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-white/[0.10] backdrop-blur-md w-full"
            >
              <LogIn className="h-4 w-4" strokeWidth={1.8} />
              {c.actions.mobileLogin}
            </Link>
            <Link
              href="/demo"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] w-full"
            >
              <Send className="h-4 w-4" strokeWidth={1.8} />
              {c.actions.mobileDemo}
            </Link>
          </div>
        </div>
      </div>

      <main>
        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section
          id="home"
          className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 overflow-hidden"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                WebkitMaskImage: "radial-gradient(ellipse at top, black 35%, transparent 75%)",
                maskImage: "radial-gradient(ellipse at top, black 35%, transparent 75%)",
              }}
            />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] blur-3xl animate-pulse-slow" />
            <div className="absolute top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_60%)] blur-3xl" />
            <div className="absolute top-60 -left-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.18),transparent_60%)] blur-3xl" />
            <Jellyfish
              variant="panel"
              className="absolute -bottom-10 -left-10 lg:-left-20 h-[320px] sm:h-[420px] lg:h-[520px] w-auto opacity-50 lg:opacity-70"
            />
            <Jellyfish
              variant="card"
              className="absolute top-20 -right-10 lg:-right-20 h-[260px] sm:h-[340px] lg:h-[420px] w-auto opacity-40 lg:opacity-55"
            />
          </div>

          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="flex justify-center animate-fade-up">
              <EyebrowChip>Blumark24 OS</EyebrowChip>
            </div>

            <h1
              className="mt-6 sm:mt-8 text-center text-[34px] leading-[1.18] sm:text-5xl sm:leading-[1.12] md:text-6xl lg:text-[68px] lg:leading-[1.08] font-bold text-white tracking-tight max-w-5xl mx-auto animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              {c.hero.title}{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                  {c.hero.titleAccent}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute -inset-x-2 -inset-y-1 -z-10 bg-[radial-gradient(ellipse,rgba(34,211,238,0.18),transparent_70%)] blur-xl"
                />
              </span>
            </h1>

            <p
              className="mt-5 sm:mt-6 text-center text-[15.5px] sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto animate-fade-up"
              style={{ animationDelay: "200ms", color: "rgba(255,255,255,0.72)" }}
            >
              {c.hero.subtitle}
            </p>

            <div
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <PrimaryCta className="w-full sm:w-auto" label={c.actions.primary} />
              <SecondaryCta className="w-full sm:w-auto" label={c.actions.secondary} />
            </div>

            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] animate-fade-up"
              style={{ animationDelay: "400ms", color: "rgba(255,255,255,0.72)" }}
            >
              {c.trustBullets.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#22D3EE]" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ WHY ━━━━━━━━━━ */}
        <section id="why" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <SectionHeading
              eyebrow={c.why.eyebrow}
              title={c.why.title}
              titleAccent={c.why.titleAccent}
              desc={c.why.desc}
            />
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {c.why.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 lg:p-7 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.72)]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[rgba(34,211,238,0.18)] via-[rgba(59,130,246,0.10)] to-[rgba(30,111,217,0.08)] flex items-center justify-center text-[#22D3EE] mb-4 group-hover:scale-105 transition-transform duration-500">
                        <Icon className="h-6 w-6" strokeWidth={1.6} />
                      </div>
                      <h3 className="text-[16px] sm:text-[17px] font-semibold text-white mb-2 leading-snug">
                        {card.title}
                      </h3>
                      <p
                        className="text-[13.5px] sm:text-[14px] leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.72)" }}
                      >
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FEATURES ━━━━━━━━━━ */}
        <section id="features" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <SectionHeading
              eyebrow={c.features.eyebrow}
              title={c.features.title}
              titleAccent={c.features.titleAccent}
              desc={c.features.desc}
            />
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {c.features.cards.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 min-w-0 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#1E6FD9]/10 text-[#22D3EE] shrink-0">
                        <Icon className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15.5px] sm:text-[16px] font-semibold text-white leading-snug">
                          {f.title}
                        </h3>
                        <p
                          className="mt-1.5 text-[13px] sm:text-[13.5px] leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.72)" }}
                        >
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━ */}
        <section id="how" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <SectionHeading
              eyebrow={c.how.eyebrow}
              title={c.how.title}
              titleAccent={c.how.titleAccent}
              desc={c.how.desc}
            />
            <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 relative">
              {c.how.steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.title}
                    className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:bg-[rgba(10,22,40,0.72)]"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-10 opacity-50 bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.08),transparent_55%)]"
                    />
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#22D3EE]/20 via-[#3B82F6]/10 to-[#1E6FD9]/10 text-[#22D3EE]">
                          <Icon className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        <span className="text-[11px] font-mono text-white/45 tabular-nums">
                          {c.how.stepPrefix} 0{i + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] sm:text-[18px] font-semibold text-white leading-snug">
                          {s.title}
                        </h3>
                        <p
                          className="mt-2 text-[13.5px] sm:text-[14px] leading-relaxed"
                          style={{ color: "rgba(255,255,255,0.72)" }}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ AUDIENCE ━━━━━━━━━━ */}
        <section id="audience" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <SectionHeading
              eyebrow={c.audience.eyebrow}
              title={c.audience.title}
              titleAccent={c.audience.titleAccent}
              desc={c.audience.desc}
            />
            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {c.audience.items.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.title}
                    className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[#FF7A3D]/20 via-[#FFB066]/10 to-[#FF7A3D]/5 text-[#FFB066] mb-3">
                      <Icon className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <h3 className="text-[15px] sm:text-[16px] font-semibold text-white leading-snug">
                      {a.title}
                    </h3>
                    <p
                      className="mt-1.5 text-[12.5px] sm:text-[13.5px] leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.72)" }}
                    >
                      {a.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ PRICING ━━━━━━━━━━ */}
        <PricingSection lang={lang} />

        {/* ━━━━━━━━━━ FINAL CTA ━━━━━━━━━━ */}
        <section id="contact" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.10] bg-gradient-to-br from-[rgba(34,211,238,0.08)] via-[rgba(10,22,40,0.85)] to-[rgba(30,111,217,0.08)] backdrop-blur-2xl mx-auto max-w-5xl">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_60%)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_60%)] blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <Jellyfish
                variant="panel"
                className="absolute bottom-0 right-0 h-[280px] w-auto opacity-40 hidden md:block"
              />

              <div className="relative p-8 sm:p-12 lg:p-16 text-center">
                <EyebrowChip>{c.cta.eyebrow}</EyebrowChip>
                <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight max-w-3xl mx-auto">
                  {c.cta.title}{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                    {c.cta.titleAccent}
                  </span>
                </h2>
                <p
                  className="mt-5 sm:mt-6 text-[15px] sm:text-lg leading-relaxed max-w-2xl mx-auto"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {c.cta.desc}
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <PrimaryCta className="w-full sm:w-auto" label={c.actions.primary} />
                </div>
                <div
                  className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px]"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {c.trustBullets.map((item) => (
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
      <footer className="relative border-t border-white/[0.08] bg-[rgba(5,8,22,0.6)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OfficialBlumarkLogo className="w-[130px]" />
            <span
              className="hidden sm:inline text-[12px]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              <Sparkles className="inline h-3 w-3 text-[#22D3EE] mb-0.5" strokeWidth={1.8} /> AI Business OS
            </span>
          </div>
          <div className="flex items-center gap-5 text-[12.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            {c.footer.links.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition">
                {link.label}
              </a>
            ))}
          </div>
          <div className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            {c.footer.copyright}
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
