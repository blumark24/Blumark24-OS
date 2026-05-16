"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import HeroVisual from "./HeroVisual";

// ─── Logo SVG (used only in the dashboard preview mockup inside Hero) ─────────

function LogoSvg({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <rect x="3" y="3" width="34" height="34" rx="8" fill="url(#blu-grad)" opacity="0.18" />
      <rect x="3" y="3" width="34" height="34" rx="8" fill="none" stroke="url(#blu-grad)" strokeWidth="1.4" />
      <path d="M14 12h7a4 4 0 0 1 0 8h-7Z" fill="url(#blu-grad)" opacity="0.95" />
      <path d="M14 20h8a4 4 0 0 1 0 8h-8Z" fill="url(#blu-grad)" />
      <circle cx="29" cy="13" r="2" fill="#FF7A3D" />
    </svg>
  );
}

// ─── Official landing header logo (full transparent brand mark PNG) ───────────

function OfficialLandingLogo() {
  return (
    <Image
      src="/brand/blumark24-logo-transparent.png"
      width={240}
      height={96}
      alt="Blumark24 Marketing Agency"
      className="object-contain h-auto w-[150px] sm:w-[170px] lg:w-[190px]"
      priority
      unoptimized
    />
  );
}

// ─── Footer / internal logo (SVG icon + text) ──────────────────────────────────

function LogoText() {
  return (
    <span className="inline-flex items-center gap-2.5" dir="ltr">
      <Image
        src="/brand/blumark24-logo.svg"
        width={32}
        height={32}
        alt="Blumark24 OS"
        className="object-contain w-8 h-8"
        unoptimized
      />
      <span className="font-semibold text-white tracking-tight text-[15px] leading-none">
        Blumark<span className="text-[#22D3EE]">24</span>
        <span className="text-[#AAB7C7] font-normal ms-1.5 text-[12px]">OS</span>
      </span>
    </span>
  );
}

// ─── Checkmark / X icons ────────────────────────────────────────────────────────

function IconCheck({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconX({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// ─── Landing Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050B16] text-white antialiased overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}>

      {/* SVG gradient definition — referenced by id="blu-grad" throughout */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="blu-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#1E6FD9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Fixed global background */}
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
      <header className="fixed inset-x-0 top-0 z-50 py-2 sm:py-3">
        <div className="mx-auto max-w-7xl px-2 sm:px-6">
          <div className="flex items-center justify-between rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(5,11,22,0.82)] backdrop-blur-2xl px-3 sm:px-5 h-[64px] sm:h-[72px] min-w-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">

            <a href="#" className="flex items-center flex-shrink-0" aria-label="Blumark24 Marketing Agency">
              <OfficialLandingLogo />
            </a>

            <nav className="hidden lg:flex items-center gap-1">
              {["#home:الرئيسية", "#features:المزايا", "#modules:الوحدات", "#automation:الأتمتة", "#reports:التقارير", "#packages:الباقات", "#contact:تواصل معنا"].map((item) => {
                const [href, label] = item.split(":");
                return (
                  <a key={href} href={href} className="px-3 py-1.5 text-[13.5px] text-[#AAB7C7] hover:text-white rounded-lg hover:bg-white/[0.04] transition">
                    {label}
                  </a>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-2">
              <Link href="/auth" className="inline-flex items-center justify-center rounded-2xl font-medium h-10 px-4 text-sm text-[#AAB7C7] hover:text-white hover:bg-white/[0.04] transition">
                تسجيل الدخول
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-10 px-4 text-sm bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition">
                طلب عرض تجريبي
              </Link>
            </div>

            <button
              onClick={() => { setMobileMenuOpen(true); document.body.style.overflow = "hidden"; }}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(34,211,238,0.16)] bg-white/[0.03] text-white"
              aria-label="فتح القائمة"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━ MOBILE MENU ━━━━━━━━━━ */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className="absolute inset-0 bg-[#050B16]/85 backdrop-blur-md"
          onClick={() => { setMobileMenuOpen(false); document.body.style.overflow = ""; }}
        />
        <div className="absolute inset-x-3 top-3 rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(10,22,40,0.95)] backdrop-blur-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <OfficialLandingLogo />
            <button
              onClick={() => { setMobileMenuOpen(false); document.body.style.overflow = ""; }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <nav className="p-3">
            {[
              ["#home", "الرئيسية"],
              ["#features", "المزايا"],
              ["#modules", "الوحدات"],
              ["#automation", "الأتمتة"],
              ["#reports", "التقارير"],
              ["#packages", "الباقات"],
              ["#contact", "تواصل معنا"],
            ].map(([href, label], i, arr) => (
              <a
                key={href}
                href={href}
                onClick={() => { setMobileMenuOpen(false); document.body.style.overflow = ""; }}
                className={`block px-4 py-3.5 text-[15px] text-white/90 hover:bg-white/[0.04] rounded-xl ${i < arr.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="p-4 pt-2 grid gap-2.5">
            <Link
              href="/auth"
              onClick={() => { setMobileMenuOpen(false); document.body.style.overflow = ""; }}
              className="inline-flex items-center justify-center rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] backdrop-blur-md w-full"
            >
              تسجيل الدخول
            </Link>
            <Link href="/demo" onClick={() => { setMobileMenuOpen(false); document.body.style.overflow = ""; }} className="inline-flex items-center justify-center rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] w-full">
              طلب عرض تجريبي
            </Link>
          </div>
        </div>
      </div>

      <main>

        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section id="home" className="relative pt-[88px] sm:pt-[100px] pb-4 sm:pb-8 overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage: "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
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
                <span className="text-[12px] sm:text-[13px] font-medium text-[#22D3EE]">نظام إدارة الأعمال بالذكاء الاصطناعي</span>
              </div>
            </div>

            <h1
              className="mt-5 sm:mt-6 text-center text-[32px] leading-[1.18] sm:text-5xl sm:leading-[1.15] md:text-6xl lg:text-7xl font-bold text-white tracking-tight max-w-5xl mx-auto animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              نظام إدارة أعمال ذكي يقود شركتك
              <span className="relative inline-block">
                <span className="bg-gradient-to-l from-[#22D3EE] via-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">من مكان واحد</span>
                <span aria-hidden="true" className="absolute -inset-x-2 -inset-y-1 -z-10 bg-[radial-gradient(ellipse,rgba(34,211,238,0.18),transparent_70%)] blur-xl" />
              </span>
            </h1>

            <p
              className="mt-4 sm:mt-5 text-center text-[15px] sm:text-lg md:text-xl text-[#AAB7C7] leading-relaxed max-w-3xl mx-auto animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Blumark24 OS يجمع الموظفين، المهام، العملاء، المالية، التقارير، والأتمتة داخل منصة عربية مدعومة بالذكاء الاصطناعي لتقليل الفوضى ورفع كفاءة التشغيل.
            </p>

            <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition w-full sm:w-auto"
              >
                طلب عرض تجريبي
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><path d="m12 5-7 7 7 7" />
                </svg>
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-2xl font-medium h-14 px-8 text-base bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] backdrop-blur-md hover:bg-white/[0.08] transition w-full sm:w-auto"
              >
                تسجيل الدخول
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-[#AAB7C7] animate-fade-up" style={{ animationDelay: "400ms" }}>
              {["بدون بطاقة ائتمان", "إعداد سريع", "دعم عربي كامل"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#22D3EE]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {item}
                </span>
              ))}
            </div>
            {/* Hero visual — dashboard mockup */}
            <div className="mt-8 sm:mt-10 animate-fade-up animate-float" style={{ animationDelay: "500ms" }}>
              <HeroVisual />
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ TRUST BAR ━━━━━━━━━━ */}
        <section className="relative py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  label: "آمن وموثوق",
                  desc: "حماية بيانات على أعلى مستوى",
                  icon: "M12 3 4 6v6c0 4.5 3.2 8.4 8 9 4.8-.6 8-4.5 8-9V6l-8-3ZM9 12l2.2 2.2L15 10.5",
                },
                {
                  label: "سحابي 100%",
                  desc: "الوصول من أي مكان وفي أي وقت",
                  icon: "M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 9.5a4 4 0 0 1-.7 7.95Z",
                },
                {
                  label: "صنع للسعودية",
                  desc: "يدعم التحول الرقمي ورؤية 2030",
                  icon: "M12 22V11M12 11c-.5-3-3-5.5-7-5.5 1.5 1 2 2.5 2 4M12 11c.5-3 3-5.5 7-5.5-1.5 1-2 2.5-2 4M9 22h6",
                },
              ].map((item) => (
                <div key={item.label} className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-4 sm:p-5 flex items-center gap-4">
                  <div className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.12)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] sm:text-base font-semibold text-white">{item.label}</div>
                    <div className="mt-0.5 text-[12.5px] sm:text-[13px] text-[#AAB7C7] leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ PROBLEMS ━━━━━━━━━━ */}
        <section className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />المشكلة
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">المشاكل اللي تواجه الشركات كل يوم</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">الفوضى التشغيلية تكلّف الشركات وقتاً وأموالاً وفرصاً ضائعة كل يوم.</p>
            </div>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { n: "01", title: "البيانات متفرقة", desc: "بين ملفات ورسائل يصعب تتبعها." },
                { n: "02", title: "المهام تضيع", desc: "بدون متابعة واضحة للمسؤوليات." },
                { n: "03", title: "العملاء يحتاجون CRM منظم", desc: "حتى لا تضيع الفرص وسجل التواصل." },
                { n: "04", title: "القرارات المالية تحتاج تقارير لحظية", desc: "لتحليل الأداء واتخاذ قرارات دقيقة." },
              ].map((p) => (
                <div key={p.n} className="rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-10 w-10 rounded-xl border border-[rgba(255,122,61,0.34)] bg-[rgba(255,122,61,0.08)] flex items-center justify-center font-mono text-[#FF7A3D] text-sm font-semibold">{p.n}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] sm:text-[17px] font-semibold text-white mb-1.5">{p.title}</h3>
                      <p className="text-[13.5px] sm:text-[14px] text-[#AAB7C7] leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 sm:mt-12 mx-auto max-w-3xl">
              <div className="relative rounded-2xl border border-[rgba(34,211,238,0.34)] bg-gradient-to-l from-[rgba(34,211,238,0.08)] via-[rgba(30,111,217,0.04)] to-[rgba(34,211,238,0.08)] p-5 sm:p-6 text-center backdrop-blur-md">
                <div aria-hidden="true" className="absolute -inset-x-10 -inset-y-4 -z-10 bg-[radial-gradient(ellipse,rgba(34,211,238,0.15),transparent_70%)] blur-2xl" />
                <p className="text-[15px] sm:text-base text-white leading-relaxed">
                  <span className="font-semibold">Blumark24 OS</span> يحوّل هذا التشتت إلى <span className="text-[#22D3EE]">نظام واحد واضح وقابل للقياس</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FEATURES ━━━━━━━━━━ */}
        <section id="features" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />المميزات</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">المميزات الرئيسية</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">قدرات مصمّمة لتحويل بيانات شركتك إلى قرارات ذكية وإجراءات تشغيلية.</p>
            </div>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  title: "مساعد ذكي",
                  desc: "ذكاء اصطناعي يفهم بياناتك ويساعدك على اتخاذ قرارات أسرع.",
                  icon: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM19 14.5l.8 2.5 2.2.8-2.2.8-.8 2.5-.8-2.5-2.2-.8 2.2-.8.8-2.5Z",
                },
                {
                  title: "أتمتة متقدمة",
                  desc: "أتمتة المهام والعمليات لتقليل العمل اليدوي وزيادة الإنتاجية.",
                  icon: "M13 3 4 14h6l-1 7 9-11h-6l1-7Z",
                },
                {
                  title: "تقارير ذكية",
                  desc: "تقارير لحظية ودقيقة تساعدك على قياس الأداء واتخاذ القرار.",
                  icon: "M3 20h18M6 20V10M11 20V6M16 20v-7M21 20v-4",
                },
                {
                  title: "صلاحيات مرنة",
                  desc: "تحكم كامل في الصلاحيات والأدوار لكل مستخدم بدقة وسهولة.",
                  icon: "M12 3 4 6v6c0 4.5 3.2 8.4 8 9 4.8-.6 8-4.5 8-9V6l-8-3ZM9 12l2.2 2.2L15 10.5",
                },
              ].map((f) => (
                <div key={f.title} className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6 group overflow-hidden">
                  <div aria-hidden="true" className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE] mb-4 group-hover:scale-110 transition-transform duration-500">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        {f.icon.split("M").filter(Boolean).map((d, i) => <path key={i} d={`M${d}`} />)}
                      </svg>
                    </div>
                    <h3 className="text-[16px] sm:text-[17px] font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-[13.5px] sm:text-[14px] text-[#AAB7C7] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ MODULES ━━━━━━━━━━ */}
        <section id="modules" className="relative py-16 sm:py-24">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-50" style={{ background: "radial-gradient(ellipse at top, rgba(34,211,238,0.06), transparent 60%)" }} />
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />الوحدات</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">كل أقسام شركتك داخل منصة واحدة</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">٩ وحدات تشغيلية متكاملة، مصمّمة للعمل معاً كمنظومة موحّدة.</p>
            </div>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[
                { title: "الموظفين", route: "/employees", desc: "إدارة الأعضاء والصلاحيات والأدوار من مكان واحد.", icon: "M9 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c.6-3.4 3.1-5.5 6-5.5s5.4 2.1 6 5.5M17 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" },
                { title: "المهام", route: "/tasks", desc: "توزيع المهام، متابعة الحالة، وربط الإنجاز بالمسؤوليات.", icon: "M3 4h18v16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V4Zm5 8 3 3 5-6" },
                { title: "العملاء CRM", route: "/clients", desc: "تنظيم العملاء، الفرص، مراحل البيع، وسجل التواصل.", icon: "M3 7h18v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 20V7ZM8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 13h18" },
                { title: "المالية", route: "/finance", desc: "متابعة الإيرادات، المصروفات، الفواتير، وصافي الأداء.", icon: "M3 8a3 3 0 0 1 3-3h12v4M3 6h18v14a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 20V6Zm14 7a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 17 13Z" },
                { title: "الاستراتيجية", route: "/strategy", desc: "تحويل خطة الشركة إلى مراحل وأهداف قابلة للمتابعة.", icon: "M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 0 0-16 0Zm8 0m-4 0a4 4 0 1 0 8 0 4 4 0 0 0-8 0Zm4 0a0 0 0 1 0 1 0" },
                { title: "الهيكل الإداري", route: "/organization", desc: "عرض مجلس الإدارة، الوكالات، الأقسام، والمسؤوليات بوضوح.", icon: "M9 3h6v4H9ZM3 14h6v4H3ZM15 14h6v4h-6ZM12 7v3M6 14v-2h12v2" },
                { title: "مركز الأتمتة", route: "/automation", desc: "تشغيل إجراءات تلقائية تقلل العمل اليدوي وتسرّع العمليات.", icon: "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v2M12 19v2M21 12h-2M5 12H3M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4 17 17M7 7 5.6 5.6" },
                { title: "المساعد الذكي", route: "/assistant", desc: "مساعد AI يقرأ البيانات ويساعدك في اتخاذ قرارات أسرع.", icon: "M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V7a4 4 0 0 1 4-4Z" },
                { title: "التقارير", route: "/reports", desc: "تقارير تنفيذية قابلة للطباعة والتحليل والمتابعة.", icon: "M7 3h7l5 5v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM13 3v6h6" },
              ].map((mod) => (
                <div key={mod.title} className="rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-5 sm:p-6 group relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE] group-hover:scale-110 transition-transform duration-500">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        {mod.icon.split(/(?=[MLA])/).map((d, i) => <path key={i} d={d} />)}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-[15.5px] sm:text-base font-semibold text-white">{mod.title}</h3>
                        <span className="text-[10px] text-[#AAB7C7]/60 font-mono">{mod.route}</span>
                      </div>
                      <p className="text-[13.5px] text-[#AAB7C7] leading-relaxed">{mod.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ AUTOMATION ━━━━━━━━━━ */}
        <section id="automation" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />الذكاء الاصطناعي</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">أتمتة وذكاء اصطناعي داخل قلب التشغيل</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">النظام لا يعرض البيانات فقط، بل يساعد في قراءتها، ترتيبها، وتحويلها إلى قرارات وإجراءات.</p>
            </div>

            <div className="mt-10 sm:mt-14">
              <div className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl p-5 sm:p-8 overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 opacity-50"
                  style={{ background: "radial-gradient(circle at 80% 20%, rgba(34,211,238,0.18), transparent 50%), radial-gradient(circle at 20% 80%, rgba(30,111,217,0.18), transparent 50%)" }}
                />

                {/* Flow */}
                <div dir="ltr" className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  {[
                    { label: "CRM", icon: "M3 7h18v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 20V7ZM8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 13h18" },
                    { label: "Tasks", icon: "M3 4h18v16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V4Zm5 8 3 3 5-6" },
                    { label: "Reports", icon: "M7 3h7l5 5v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM13 3v6h6" },
                  ].map((node, i) => (
                    <div key={node.label} className="flex items-center">
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.06)] flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            {node.icon.split(/(?=[MLA])/).map((d, j) => <path key={j} d={d} />)}
                          </svg>
                        </div>
                        <span className="text-[10.5px] sm:text-xs text-[#AAB7C7] font-mono">{node.label}</span>
                      </div>
                      {i < 2 && (
                        <div className="mx-1 sm:mx-3 flex items-center">
                          <div className="relative h-px w-6 sm:w-12 bg-gradient-to-r from-[#22D3EE]/40 to-[#22D3EE]/60">
                            <span className="absolute top-1/2 -translate-y-1/2 right-0 h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="mx-1 sm:mx-3 flex items-center">
                    <div className="relative h-px w-6 sm:w-12 bg-gradient-to-r from-[#22D3EE]/40 to-[#22D3EE]/60">
                      <span className="absolute top-1/2 -translate-y-1/2 right-0 h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2 scale-110">
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl border border-[rgba(34,211,238,0.55)] bg-gradient-to-br from-[rgba(34,211,238,0.22)] to-[rgba(30,111,217,0.14)] flex items-center justify-center shadow-[0_0_30px_-5px_rgba(34,211,238,0.5)]">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7 text-[#22D3EE]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V7a4 4 0 0 1 4-4Z" />
                      </svg>
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
                      </span>
                    </div>
                    <span className="text-[10.5px] sm:text-xs text-[#AAB7C7] font-mono">AI Assistant</span>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {["تلخيص أداء الأقسام", "اكتشاف المهام المتأخرة", "تحليل العملاء والفرص", "اقتراح تحسينات تشغيلية"].map((cap) => (
                    <div key={cap} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                      <div className="shrink-0 h-7 w-7 rounded-lg bg-[rgba(34,211,238,0.12)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE]">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" /></svg>
                      </div>
                      <span className="text-[13px] sm:text-[13.5px] text-white/90">{cap}</span>
                    </div>
                  ))}
                </div>

                {/* Chat demo */}
                <div className="mt-8 sm:mt-10 max-w-2xl mx-auto space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
                      <div className="text-[10px] text-[#AAB7C7] mb-1">المستخدم</div>
                      <div className="text-[14px] text-white">حلل أداء الشركة هذا الأسبوع</div>
                    </div>
                  </div>
                  <div className="flex justify-start gap-2">
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#1E6FD9] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V7a4 4 0 0 1 4-4Z" /></svg>
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[rgba(34,211,238,0.24)] bg-gradient-to-br from-[rgba(34,211,238,0.08)] to-transparent px-4 py-2.5 backdrop-blur-md">
                      <div className="text-[10px] text-[#22D3EE] mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse" />Blumark24 AI
                      </div>
                      <div className="text-[14px] text-white/95 leading-relaxed">يوجد ارتفاع في العملاء المحتملين، لكن <span className="text-[#FF7A3D] font-medium">٣ مهام متأخرة</span> في قسم الهجوم وتحتاج متابعة.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ REPORTS ━━━━━━━━━━ */}
        <section id="reports" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />التقارير</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">تقارير تنفيذية تساعدك تقرر أسرع</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">بدل ما تبحث عن المعلومة، النظام يعرضها لك بشكل واضح وقابل للطباعة.</p>
            </div>

            <div className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              {[
                { title: "تقرير العملاء", icon: "M9 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20c.6-3.4 3.1-5.5 6-5.5s5.4 2.1 6 5.5M17 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" },
                { title: "تقرير المهام", icon: "M3 4h18v16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V4Zm5 8 3 3 5-6" },
                { title: "تقرير المالية", icon: "M3 6h18v14a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 20V6Zm14 7a1.3 1.3 0 1 0 0-2.6A1.3 1.3 0 0 0 17 13Z" },
                { title: "تقرير الأداء الإداري", icon: "M3 20h18M6 20V10M11 20V6M16 20v-7M21 20v-4" },
                { title: "تقرير الأتمتة", icon: "M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 3v2M12 19v2M21 12h-2M5 12H3" },
              ].map((r) => (
                <div key={r.title} className="rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-4 sm:p-5 group">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                    <div className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[rgba(34,211,238,0.18)] to-[rgba(30,111,217,0.08)] border border-[rgba(34,211,238,0.24)] flex items-center justify-center text-[#22D3EE] group-hover:scale-110 transition-transform duration-500">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        {r.icon.split(/(?=[MLA])/).map((d, i) => <path key={i} d={d} />)}
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-start">
                      <h3 className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-tight">{r.title}</h3>
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] text-[#22D3EE]/80">
                        <span className="h-1 w-1 rounded-full bg-[#22D3EE]" />جاهز للطباعة
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ PACKAGES ━━━━━━━━━━ */}
        <section id="packages" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-3xl text-center mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 text-xs font-medium text-[#22D3EE] mb-4"><span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />الباقات</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight">ابدأ بنظام يناسب مرحلة شركتك</h2>
              <p className="mt-4 text-base sm:text-lg text-[#AAB7C7] leading-relaxed">باقات مرنة مصمّمة للنمو مع كل مرحلة من مراحل تطوّر أعمالك.</p>
            </div>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:max-w-5xl mx-auto">
              {/* START */}
              <div className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-6 sm:p-7 h-full flex flex-col">
                <div>
                  <div className="inline-flex items-center font-mono text-[11px] tracking-wider rounded-md px-2 py-1 bg-white/[0.04] text-[#AAB7C7] border border-white/[0.06]" dir="ltr">START</div>
                  <p className="mt-3 text-[14px] text-[#AAB7C7] leading-relaxed">للشركات الصغيرة التي تحتاج تنظيم أساسي.</p>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {["إدارة الموظفين والمهام", "CRM أساسي", "تقارير شهرية"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70"><IconCheck className="h-3 w-3" /></span>
                      <span className="text-[13.5px] text-white/90 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] hover:bg-white/[0.08] transition w-full">طلب عرض تجريبي</a>
                </div>
              </div>

              {/* GROW */}
              <div className="relative md:-translate-y-2">
                <div className="absolute -top-3 inset-x-0 flex justify-center z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_20px_-4px_rgba(34,211,238,0.6)]">
                    <span className="h-1 w-1 rounded-full bg-white" />الأكثر طلباً
                  </span>
                </div>
                <div className="relative rounded-2xl border border-[rgba(34,211,238,0.45)] bg-gradient-to-b from-[rgba(34,211,238,0.06)] to-[rgba(10,22,40,0.8)] backdrop-blur-xl hover:-translate-y-0.5 transition p-6 sm:p-7 h-full flex flex-col shadow-[0_0_0_1px_rgba(34,211,238,0.06)_inset,0_20px_60px_-30px_rgba(34,211,238,0.4)]">
                  <div aria-hidden="true" className="absolute -inset-x-4 -top-8 -z-10 h-32 bg-[radial-gradient(ellipse,rgba(34,211,238,0.18),transparent_70%)] blur-2xl" />
                  <div>
                    <div className="inline-flex items-center font-mono text-[11px] tracking-wider rounded-md px-2 py-1 bg-[rgba(34,211,238,0.12)] text-[#22D3EE] border border-[rgba(34,211,238,0.34)]" dir="ltr">GROW</div>
                    <p className="mt-3 text-[14px] text-[#AAB7C7] leading-relaxed">للشركات النامية التي تحتاج CRM ومهام وتقارير.</p>
                  </div>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {["كل مزايا START", "CRM متقدم وفرص بيع", "تقارير لحظية", "صلاحيات متعددة"].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(34,211,238,0.18)] text-[#22D3EE]"><IconCheck className="h-3 w-3" /></span>
                        <span className="text-[13.5px] text-white/90 leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition w-full">
                      طلب عرض تجريبي
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 5-7 7 7 7" /></svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* SCALE */}
              <div className="relative rounded-2xl border border-[rgba(34,211,238,0.16)] bg-[rgba(10,22,40,0.72)] backdrop-blur-xl hover:border-[rgba(34,211,238,0.34)] hover:-translate-y-0.5 transition p-6 sm:p-7 h-full flex flex-col">
                <div>
                  <div className="inline-flex items-center font-mono text-[11px] tracking-wider rounded-md px-2 py-1 bg-white/[0.04] text-[#AAB7C7] border border-white/[0.06]" dir="ltr">SCALE</div>
                  <p className="mt-3 text-[14px] text-[#AAB7C7] leading-relaxed">للشركات التي تحتاج صلاحيات، أتمتة، وذكاء اصطناعي متقدم.</p>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {["كل مزايا GROW", "أتمتة كاملة", "مساعد ذكي AI", "صلاحيات هرمية متقدمة"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-white/70"><IconCheck className="h-3 w-3" /></span>
                      <span className="text-[13.5px] text-white/90 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <a href="#contact" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-12 px-6 text-[15px] bg-white/[0.04] text-white border border-[rgba(34,211,238,0.34)] hover:bg-white/[0.08] transition w-full">طلب عرض تجريبي</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FINAL CTA ━━━━━━━━━━ */}
        <section id="contact" className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(34,211,238,0.34)] bg-gradient-to-br from-[rgba(34,211,238,0.08)] via-[rgba(10,22,40,0.9)] to-[rgba(30,111,217,0.08)] backdrop-blur-2xl">
              <div aria-hidden="true" className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28),transparent_60%)] blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(30,111,217,0.28),transparent_60%)] blur-3xl" />
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08]"
                style={{ backgroundImage: "linear-gradient(rgba(34,211,238,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.4) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
              />

              <div className="relative p-7 sm:p-12 lg:p-16 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 backdrop-blur-md mb-5 sm:mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                  <span className="text-[12px] font-medium text-[#22D3EE]">ابدأ التحوّل الآن</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.2] tracking-tight max-w-3xl mx-auto">
                  حوّل شركتك من إدارة متفرقة إلى{" "}
                  <span className="bg-gradient-to-l from-[#22D3EE] to-[#1E6FD9] bg-clip-text text-transparent">نظام ذكي واحد</span>
                </h2>

                <p className="mt-5 sm:mt-6 text-[15px] sm:text-lg text-[#AAB7C7] leading-relaxed max-w-2xl mx-auto">
                  ابدأ بعرض تجريبي يوضح كيف يمكن لـ Blumark24 OS تنظيم التشغيل، تحسين المتابعة، ورفع كفاءة القرارات.
                </p>

                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="https://wa.me/966507006849" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.55)] hover:brightness-110 transition w-full sm:w-auto">
                    طلب عرض تجريبي
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 5-7 7 7 7" /></svg>
                  </a>
                  <a href="https://wa.me/966507006849" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl font-medium h-14 px-8 text-base bg-[#22C55E] text-white shadow-[0_8px_24px_-8px_rgba(34,197,94,0.6)] hover:brightness-110 transition w-full sm:w-auto">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M17.5 14.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.2 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3Z" />
                      <path d="M20.5 3.5A11.4 11.4 0 0 0 12 0 11.5 11.5 0 0 0 2 17.4L0 24l6.8-1.8a11.5 11.5 0 0 0 5.2 1.3h.1c6.3 0 11.5-5.1 11.5-11.5a11.4 11.4 0 0 0-3.1-8.5Zm-8.5 17.7a9.6 9.6 0 0 1-4.9-1.3l-.4-.2-4 1 1-3.9-.2-.4a9.5 9.5 0 1 1 17.6-5.1 9.6 9.6 0 0 1-9.6 9.9Z" />
                    </svg>
                    تواصل عبر واتساب
                  </a>
                </div>

                <div className="mt-10 sm:mt-12 pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
                  <a href="https://www.blumark24.com" target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="text-[11px] text-[#AAB7C7] mb-1">الموقع الإلكتروني</div>
                    <div className="text-[14px] sm:text-[15px] font-medium text-white group-hover:text-[#22D3EE] transition" dir="ltr">www.blumark24.com</div>
                  </a>
                  <a href="mailto:info@blumark.sa" className="group block">
                    <div className="text-[11px] text-[#AAB7C7] mb-1">البريد الإلكتروني</div>
                    <div className="text-[14px] sm:text-[15px] font-medium text-white group-hover:text-[#22D3EE] transition" dir="ltr">info@blumark.sa</div>
                  </a>
                  <a href="https://wa.me/966507006849" target="_blank" rel="noopener noreferrer" className="group block">
                    <div className="text-[11px] text-[#AAB7C7] mb-1">واتساب</div>
                    <div className="text-[14px] sm:text-[15px] font-medium text-white group-hover:text-[#22D3EE] transition" dir="ltr">0507006849</div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ━━━━━━━━━━ FOOTER ━━━━━━━━━━ */}
      <footer className="relative border-t border-white/[0.06] bg-[rgba(5,11,22,0.6)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">

            <div className="lg:col-span-1">
              <LogoText />
              <p className="mt-4 text-[13.5px] text-[#AAB7C7] leading-relaxed">نظام إدارة الأعمال بالذكاء الاصطناعي للشركات السعودية. منصة عربية لتنظيم التشغيل ورفع الكفاءة من مكان واحد.</p>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">المنتج</h3>
              <ul className="space-y-2.5">
                {[["#features", "المزايا"], ["#modules", "الوحدات"], ["#automation", "الأتمتة"], ["#reports", "التقارير"], ["#packages", "الباقات"]].map(([href, label]) => (
                  <li key={href}><a href={href} className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">{label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">الشركة</h3>
              <ul className="space-y-2.5">
                <li><a href="#contact" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">تواصل معنا</a></li>
                <li>
                  <Link href="/auth" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">
                    تسجيل الدخول
                  </Link>
                </li>
                <li><a href="#" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">الشروط والأحكام</a></li>
                <li><a href="#" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition">سياسة الخصوصية</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider mb-4">تواصل</h3>
              <ul className="space-y-2.5">
                <li><a href="https://www.blumark24.com" target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block" dir="ltr">www.blumark24.com</a></li>
                <li><a href="mailto:info@blumark.sa" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block" dir="ltr">info@blumark.sa</a></li>
                <li><a href="https://wa.me/966507006849" target="_blank" rel="noopener noreferrer" className="text-[13.5px] text-[#AAB7C7] hover:text-[#22D3EE] transition block" dir="ltr">+966 0507006849</a></li>
              </ul>
            </div>

          </div>

          <div className="mt-10 sm:mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12.5px] text-[#AAB7C7]">© 2026 Blumark24. جميع الحقوق محفوظة.</p>
            <p className="text-[12px] text-[#AAB7C7]/70" dir="ltr">Built for Saudi companies · صنع للسعودية 🇸🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
