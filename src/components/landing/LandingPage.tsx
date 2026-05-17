"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  DollarSign,
  Languages,
  Layers,
  ListChecks,
  LogIn,
  Menu,
  Send,
  Sparkles,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import HeroVisual from "./HeroVisual";

const NAV = [
  { href: "#home", label: "الرئيسية" },
  { href: "#features", label: "المزايا" },
  { href: "#why", label: "لماذا نحن" },
  { href: "#contact", label: "تواصل" },
];

const TRUST_BULLETS = ["بدون بطاقة ائتمان", "إعداد سريع", "دعم عربي كامل"];

const FEATURES = [
  {
    icon: Users,
    title: "إدارة الموظفين",
    desc: "ملفات الفريق، الصلاحيات، والأدوار في مكان واحد منظّم.",
  },
  {
    icon: ListChecks,
    title: "إدارة المهام",
    desc: "تخطيط، توزيع، ومتابعة لحظية لأداء الفرق وتسليم العمل.",
  },
  {
    icon: Briefcase,
    title: "العملاء CRM",
    desc: "خط أنابيب المبيعات، الفرص، وسجل التواصل بصورة موحّدة.",
  },
  {
    icon: DollarSign,
    title: "المالية",
    desc: "إيرادات، مصروفات، وفواتير مع لوحات قياس حيّة للأداء.",
  },
  {
    icon: BarChart3,
    title: "التقارير الذكية",
    desc: "تقارير فورية مدعومة بالذكاء الاصطناعي وقابلة للتخصيص.",
  },
  {
    icon: Workflow,
    title: "مركز الأتمتة",
    desc: "سيناريوهات تشغيل تربط الوحدات وتقلّل التدخّل اليدوي.",
  },
];

const WHY_POINTS = [
  {
    icon: Languages,
    title: "منصة عربية RTL من البداية",
    desc: "كل تفصيل صُمّم للسوق السعودي والعربي — لا ترجمة، لا تكييف لاحق.",
  },
  {
    icon: Layers,
    title: "تجربة تشغيل موحّدة بدل تشتّت الأدوات",
    desc: "موظفين، مهام، عملاء، مالية، تقارير، وأتمتة في تجربة واحدة متّسقة.",
  },
  {
    icon: BrainCircuit,
    title: "ذكاء اصطناعي يساعد الإدارة في القرار",
    desc: "تلخيص فوري، اقتراحات تشغيلية، وتحليلات على بياناتك الحيّة.",
  },
  {
    icon: Building2,
    title: "بنية قابلة للتوسّع للشركات السعودية",
    desc: "أمان مؤسسي، صلاحيات دقيقة، وقابلية نموّ تواكب توسّع شركتك.",
  },
  {
    icon: Zap,
    title: "واجهة زجاجية حديثة وسريعة",
    desc: "تصميم زجاجي عصري بأداء عالٍ على كل الأجهزة من الجوال للديسكتوب.",
  },
];

function PrimaryCta({ className = "", label = "طلب عرض تجريبي" }: { className?: string; label?: string }) {
  return (
    <Link
      href="/demo"
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:shadow-[0_12px_40px_-8px_rgba(34,211,238,0.7)] hover:brightness-110 transition-all duration-300 ${className}`}
    >
      {label}
      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={1.8} />
    </Link>
  );
}

function SecondaryCta({ className = "", label = "تسجيل الدخول" }: { className?: string; label?: string }) {
  return (
    <Link
      href="/auth"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-white/[0.04] text-white border border-white/[0.10] backdrop-blur-md hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300 ${className}`}
    >
      <LogIn className="h-4 w-4" strokeWidth={1.8} />
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
      <p className="mt-4 text-base sm:text-lg text-white/72 leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
        {desc}
      </p>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <div
      className="min-h-screen bg-[#050816] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      {/* Ambient global lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0F172A,#0A1628_45%,#050816)]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 12%, rgba(34,211,238,0.08), transparent 38%), radial-gradient(circle at 84% 28%, rgba(59,130,246,0.08), transparent 40%), radial-gradient(circle at 50% 88%, rgba(30,111,217,0.06), transparent 50%)",
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
              aria-label="Blumark24 Marketing Agency"
            >
              <OfficialBlumarkLogo className="w-[140px] sm:w-[160px] lg:w-[180px]" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => (
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
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl font-medium h-10 px-4 text-sm text-white/70 hover:text-white hover:bg-white/[0.04] transition"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-10 px-4 text-sm bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.5)] hover:brightness-110 transition"
              >
                طلب عرض تجريبي
              </Link>
            </div>

            <button
              onClick={openMenu}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white hover:bg-white/[0.06] transition"
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
          className="absolute inset-0 bg-[#050816]/85 backdrop-blur-md"
          onClick={closeMenu}
        />
        <div className="absolute inset-x-3 top-3 rounded-3xl border border-white/[0.10] bg-[rgba(10,22,40,0.94)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex flex-row-reverse items-center justify-between p-4 border-b border-white/[0.06]">
            <OfficialBlumarkLogo className="w-[140px]" />
            <button
              onClick={closeMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] text-white"
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-white/[0.10] backdrop-blur-md w-full"
            >
              <LogIn className="h-4 w-4" strokeWidth={1.8} />
              تسجيل الدخول
            </Link>
            <Link
              href="/demo"
              onClick={closeMenu}
              className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] w-full"
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
          className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-24 lg:pb-32 overflow-hidden"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                WebkitMaskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
                maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
              }}
            />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] blur-3xl animate-pulse-slow" />
            <div className="absolute top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.22),transparent_60%)] blur-3xl" />
            <div className="absolute top-60 -left-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.18),transparent_60%)] blur-3xl" />
          </div>

          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="flex justify-center animate-fade-up">
              <EyebrowChip>نظام إدارة أعمال بالذكاء الاصطناعي</EyebrowChip>
            </div>

            <h1
              className="mt-6 sm:mt-8 text-center text-[34px] leading-[1.18] sm:text-5xl sm:leading-[1.12] md:text-6xl lg:text-[68px] lg:leading-[1.08] font-bold text-white tracking-tight max-w-5xl mx-auto animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              نظام ذكي يوحّد إدارة شركتك{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                  من مكان واحد
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
              Blumark24 OS منصة عربية متكاملة لإدارة الموظفين، المهام، العملاء، المالية،
              التقارير، والأتمتة — مصممة للشركات السعودية التي تبحث عن تشغيل أكثر ذكاءً وكفاءة.
            </p>

            <div
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <PrimaryCta className="w-full sm:w-auto" />
              <SecondaryCta className="w-full sm:w-auto" />
            </div>

            <div
              className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] animate-fade-up"
              style={{ animationDelay: "400ms", color: "rgba(255,255,255,0.72)" }}
            >
              {TRUST_BULLETS.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#22D3EE]" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>

            <div
              className="mt-12 sm:mt-16 lg:mt-20 animate-fade-up animate-float"
              style={{ animationDelay: "500ms" }}
            >
              <HeroVisual />
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
              eyebrow="المزايا"
              title="منظومة تشغيل واحدة"
              titleAccent="لكل أقسام شركتك"
              desc="ستّ وحدات تشغيلية مصمّمة لتعمل معاً بسلاسة، مع لمسة ذكاء اصطناعي في كل وحدة."
            />

            <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 lg:p-7 min-w-0 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5 hover:bg-[rgba(10,22,40,0.72)]"
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
                        {f.title}
                      </h3>
                      <p className="text-[13.5px] sm:text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                        {f.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ WHY BLUMARK24 OS ━━━━━━━━━━ */}
        <section id="why" className="relative py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-50"
            style={{
              background: "radial-gradient(ellipse at center, rgba(34,211,238,0.05), transparent 65%)",
            }}
          />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-32 text-center lg:text-right">
                <EyebrowChip>لماذا نحن</EyebrowChip>
                <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                  لماذا{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                    Blumark24 OS؟
                  </span>
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0" style={{ color: "rgba(255,255,255,0.72)" }}>
                  ليست مجرد أدوات منفصلة — Blumark24 OS منظومة عربية واحدة، مصمّمة من الصفر
                  لتشغيل الشركات السعودية بذكاء وكفاءة.
                </p>
                <div className="mt-6 hidden lg:flex items-center gap-3">
                  <PrimaryCta />
                  <SecondaryCta />
                </div>
              </div>

              <ul className="grid gap-3 sm:gap-4">
                {WHY_POINTS.map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <li
                      key={p.title}
                      className="group relative rounded-2xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] backdrop-blur-xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:border-white/[0.16] hover:bg-[rgba(10,22,40,0.72)]"
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.08),transparent_55%)]"
                      />
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.10] bg-gradient-to-br from-[rgba(34,211,238,0.18)] via-[rgba(59,130,246,0.10)] to-[rgba(30,111,217,0.08)] text-[#22D3EE]">
                            <Icon className="h-5 w-5" strokeWidth={1.6} />
                          </span>
                          <span className="text-[10.5px] font-mono text-white/40 tabular-nums">
                            0{i + 1}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[16px] sm:text-[17px] font-semibold text-white leading-snug">
                            {p.title}
                          </h3>
                          <p className="mt-2 text-[13.5px] sm:text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                            {p.desc}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="lg:hidden flex flex-col sm:flex-row items-center justify-center gap-3 -mt-2">
                <PrimaryCta className="w-full sm:w-auto" />
                <SecondaryCta className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        </section>

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

              <div className="relative p-8 sm:p-12 lg:p-16 text-center">
                <EyebrowChip>ابدأ التحوّل اليوم</EyebrowChip>

                <h2 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight max-w-3xl mx-auto">
                  ابدأ تشغيل أعمالك بطريقة{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] via-[#3B82F6] to-[#1E6FD9] bg-clip-text text-transparent">
                    أذكى
                  </span>
                </h2>

                <p className="mt-5 sm:mt-6 text-[15px] sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.72)" }}>
                  حوّل الإدارة اليومية إلى تجربة أكثر وضوحاً وسرعة وكفاءة مع Blumark24 OS.
                </p>

                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <PrimaryCta className="w-full sm:w-auto" />
                  <SecondaryCta className="w-full sm:w-auto" />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
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

      {/* ━━━━━━━━━━ MINIMAL FOOTER ━━━━━━━━━━ */}
      <footer className="relative border-t border-white/[0.08] bg-[rgba(5,8,22,0.6)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <OfficialBlumarkLogo className="w-[130px]" />
            <span className="hidden sm:inline text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              <Sparkles className="inline h-3 w-3 text-[#22D3EE] mb-0.5" strokeWidth={1.8} /> AI Business OS
            </span>
          </div>
          <div className="flex items-center gap-5 text-[12.5px]" style={{ color: "rgba(255,255,255,0.72)" }}>
            <a href="#features" className="hover:text-white transition">
              المزايا
            </a>
            <a href="#why" className="hover:text-white transition">
              لماذا نحن
            </a>
            <a href="#contact" className="hover:text-white transition">
              تواصل
            </a>
          </div>
          <div className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            © Blumark24 OS
          </div>
        </div>
      </footer>
    </div>
  );
}
