"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Cpu,
  Languages,
  ListChecks,
  LogIn,
  Menu,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import HeroVisual from "./HeroVisual";

const NAV = [
  { href: "#home", label: "الرئيسية" },
  { href: "#kpi", label: "المؤشرات" },
  { href: "#why", label: "لماذا نحن" },
  { href: "#contact", label: "تواصل" },
];

const TRUST_BULLETS = ["بدون بطاقة ائتمان", "إعداد سريع", "دعم عربي كامل"];

const KPI_CARDS = [
  {
    icon: Users,
    label: "العملاء النشطون",
    value: "1,248",
    delta: "+18%",
    hint: "نمو مقارنة بالشهر الماضي",
  },
  {
    icon: ListChecks,
    label: "المهام المكتملة",
    value: "92%",
    delta: "+6%",
    hint: "نسبة الإنجاز على مستوى الفرق",
  },
  {
    icon: Zap,
    label: "الأتمتة الذكية",
    value: "24",
    delta: "+12",
    hint: "سير عمل ذكي يعمل تلقائياً",
  },
  {
    icon: BarChart3,
    label: "التقارير الفورية",
    value: "36",
    delta: "+9",
    hint: "تقارير مولّدة بالذكاء الاصطناعي",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "أمان واحترافية على مستوى المؤسسات",
    desc: "صلاحيات دقيقة، تشفير على مستوى الصف، وتدقيق كامل لكل عملية حساسة داخل النظام.",
    points: ["RLS لكل جدول", "أدوار وصلاحيات قابلة للضبط", "سجل تدقيق شفاف"],
  },
  {
    icon: Cpu,
    title: "ذكاء اصطناعي مدمج في كل وحدة",
    desc: "مساعد ذكي يحلّل المهام، يلخّص التقارير، ويقترح خطوات تشغيل ذكية بناءً على بيانات شركتك.",
    points: ["تلخيص فوري بالعربية", "اقتراحات سير عمل", "إجابات على بيانات حيّة"],
  },
  {
    icon: Languages,
    title: "عربي بالكامل، مصمم للسوق السعودي",
    desc: "تجربة RTL أصيلة، تواريخ ميلادية وهجرية، وعملة وريالة سعودية افتراضية لكل العمليات المالية.",
    points: ["RTL أصلي", "هجري + ميلادي", "ريال سعودي افتراضي"],
  },
  {
    icon: Rocket,
    title: "سرعة إنجاز قياسية بدون تعقيد",
    desc: "ابدأ خلال دقائق: شركتك جاهزة بكل وحداتها — موظفين، مهام، عملاء، مالية، تقارير، وأتمتة.",
    points: ["تشغيل خلال دقائق", "بدون تخصيص معقّد", "ترقيات تلقائية"],
  },
];

function PrimaryCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/demo"
      className={`group inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 sm:h-13 px-6 sm:px-7 text-sm sm:text-base bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 hover:shadow-[0_12px_40px_-8px_rgba(34,211,238,0.65)] transition-all ${className}`}
    >
      <Send className="h-4 w-4" strokeWidth={1.8} />
      <span>طلب عرض تجريبي</span>
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.8} />
    </Link>
  );
}

function SecondaryCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/auth"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 sm:h-13 px-6 sm:px-7 text-sm sm:text-base bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] backdrop-blur-md hover:bg-white/[0.08] transition ${className}`}
    >
      <LogIn className="h-4 w-4" strokeWidth={1.8} />
      <span>تسجيل الدخول</span>
    </Link>
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
      className="min-h-screen bg-[#020617] text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,18,37,1),rgba(2,6,23,1))]" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 12%, rgba(34,211,238,0.07), transparent 40%), radial-gradient(circle at 82% 30%, rgba(30,111,217,0.07), transparent 42%), radial-gradient(circle at 50% 85%, rgba(34,211,238,0.04), transparent 50%)",
          }}
        />
      </div>

      {/* ━━━━━━━━━━ HEADER ━━━━━━━━━━ */}
      <header className="fixed inset-x-0 top-0 z-50 py-2 sm:py-3">
        <div className="mx-auto max-w-7xl px-2 sm:px-6">
          <div className="flex flex-row-reverse lg:flex-row items-center justify-between rounded-2xl border border-[rgba(34,211,238,0.14)] bg-[rgba(2,6,23,0.78)] backdrop-blur-2xl px-3 sm:px-5 h-[60px] sm:h-[68px] min-w-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)]">
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
          className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md"
          onClick={closeMenu}
        />
        <div className="absolute inset-x-3 top-3 rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(8,18,37,0.96)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]">
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
          className="relative pt-[84px] sm:pt-[100px] pb-10 sm:pb-14 lg:pb-16 overflow-hidden"
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
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_60%)] blur-3xl" />
            <div className="absolute top-40 -right-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.22),transparent_60%)] blur-3xl" />
            <div className="absolute top-60 -left-32 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.14),transparent_60%)] blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex justify-center animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-3.5 py-1.5 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#22D3EE]" strokeWidth={1.8} />
                <span className="text-[12px] sm:text-[13px] font-medium text-[#22D3EE]">
                  AI Business OS — مدعوم بالذكاء الاصطناعي
                </span>
              </div>
            </div>

            <h1
              className="mt-5 sm:mt-6 text-center text-[30px] leading-[1.18] sm:text-[44px] sm:leading-[1.15] md:text-[56px] lg:text-[68px] lg:leading-[1.08] font-bold text-white tracking-tight max-w-5xl mx-auto animate-fade-up"
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
              className="mt-4 sm:mt-5 text-center text-[15px] sm:text-[17px] lg:text-[19px] text-[#AAB7C7] leading-relaxed max-w-3xl mx-auto animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              منصة عربية متكاملة بالذكاء الاصطناعي: موظفين، مهام، عملاء، مالية،
              تقارير، وأتمتة — في تجربة واحدة سريعة وآمنة ومصمّمة للشركات السعودية.
            </p>

            <div
              className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <PrimaryCta className="w-full sm:w-auto" />
              <SecondaryCta className="w-full sm:w-auto" />
            </div>

            <div
              className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-[#AAB7C7] animate-fade-up"
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
              className="mt-8 sm:mt-10 lg:mt-12 animate-fade-up"
              style={{ animationDelay: "500ms" }}
            >
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ KPI CARDS ━━━━━━━━━━ */}
        <section id="kpi" className="relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.05)] px-3 py-1 text-[11.5px] font-medium text-[#22D3EE] mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                المؤشرات الحيّة
              </div>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] leading-tight font-bold text-white tracking-tight">
                نتائج تظهر من أول أسبوع
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15.5px] text-[#AAB7C7] leading-relaxed">
                أرقام واقعية يحقّقها العملاء بعد اعتماد Blumark24 OS داخل عملياتهم اليومية.
              </p>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {KPI_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="group relative rounded-2xl border border-[rgba(34,211,238,0.14)] bg-[rgba(8,18,37,0.72)] backdrop-blur-xl p-4 sm:p-5 overflow-hidden hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.14),transparent_60%)]"
                    />
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.24)] bg-gradient-to-br from-[rgba(34,211,238,0.16)] to-[rgba(30,111,217,0.08)] text-[#22D3EE]">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.8} />
                      </span>
                      <span className="text-[11px] sm:text-[12px] font-medium text-[#22D3EE] tabular-nums">
                        {card.delta}
                      </span>
                    </div>
                    <div className="text-[11.5px] sm:text-[12.5px] text-[#AAB7C7] mb-1">
                      {card.label}
                    </div>
                    <div className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-white tabular-nums leading-none">
                      {card.value}
                    </div>
                    <div className="mt-2 text-[11px] sm:text-[11.5px] text-[#7A8FAB] leading-snug">
                      {card.hint}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ WHY BLUMARK24 OS ━━━━━━━━━━ */}
        <section id="why" className="relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.28)] bg-[rgba(34,211,238,0.05)] px-3 py-1 text-[11.5px] font-medium text-[#22D3EE] mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                لماذا Blumark24 OS
              </div>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] leading-tight font-bold text-white tracking-tight">
                كل ما تحتاجه شركتك — في نظام واحد
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15.5px] text-[#AAB7C7] leading-relaxed">
                أربعة مبادئ بُني عليها النظام لتقدم تجربة سعودية، ذكية، آمنة، وسريعة.
              </p>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const featured = i === 0 || i === 3;
                return (
                  <div
                    key={f.title}
                    className={`group relative rounded-2xl border bg-[rgba(8,18,37,0.72)] backdrop-blur-xl p-5 sm:p-6 lg:p-7 overflow-hidden transition hover:-translate-y-0.5 ${
                      featured
                        ? "border-[rgba(34,211,238,0.24)] md:row-span-1"
                        : "border-[rgba(34,211,238,0.14)]"
                    } hover:border-[rgba(34,211,238,0.34)]`}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.10),transparent_55%)]"
                    />
                    <div className="flex items-start gap-4">
                      <span className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.24)] bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.10)] text-[#22D3EE]">
                        <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5" strokeWidth={1.7} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[16px] sm:text-[18px] lg:text-[19px] font-semibold text-white leading-snug">
                          {f.title}
                        </h3>
                        <p className="mt-2 text-[13px] sm:text-[14px] text-[#AAB7C7] leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                    <ul className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                      {f.points.map((p) => (
                        <li
                          key={p}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-[#AAB7C7]"
                        >
                          <Check className="h-3 w-3 text-[#22D3EE]" strokeWidth={2.5} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FINAL CTA ━━━━━━━━━━ */}
        <section id="contact" className="relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(8,18,37,0.72)] backdrop-blur-xl px-6 sm:px-10 lg:px-14 py-10 sm:py-12 lg:py-14 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(30,111,217,0.18),transparent_55%)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[260px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_60%)] blur-3xl"
              />

              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[11.5px] font-medium text-[#22D3EE]">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />
                  ابدأ مع Blumark24 OS اليوم
                </div>
                <h2 className="mt-4 text-[26px] sm:text-[34px] lg:text-[44px] leading-[1.15] font-bold text-white tracking-tight max-w-3xl">
                  جاهز تشغّل شركتك بنظام واحد، ذكي، وعربي بالكامل؟
                </h2>
                <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] text-[#AAB7C7] leading-relaxed max-w-2xl">
                  احصل على عرض تجريبي خاص بشركتك، أو ابدأ مباشرة بتسجيل الدخول وتجربة
                  النظام كما هو يعمل اليوم.
                </p>

                <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
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
      <footer className="relative border-t border-white/[0.06] bg-[rgba(2,6,23,0.6)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <OfficialBlumarkLogo className="w-[120px]" />
            <span className="hidden sm:inline text-[12px] text-[#7A8FAB]">
              AI Business OS للشركات السعودية
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#AAB7C7]">
            <a href="#why" className="hover:text-white transition">
              لماذا نحن
            </a>
            <a href="#kpi" className="hover:text-white transition">
              المؤشرات
            </a>
            <a href="#contact" className="hover:text-white transition">
              تواصل
            </a>
          </div>
          <div className="text-[11.5px] text-[#7A8FAB]">© Blumark24 OS</div>
        </div>
      </footer>
    </div>
  );
}
