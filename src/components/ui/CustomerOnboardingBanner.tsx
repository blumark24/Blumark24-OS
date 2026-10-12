"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CheckSquare,
  PlayCircle,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "blumark24_onboarding_tour_dismissed_v1";

const STEPS = [
  {
    label: "أضف فريقك",
    title: "ابدأ بالموظفين والأدوار",
    description:
      "أضف الموظفين وحدد أدوارهم ووحداتهم التنظيمية حتى يرى كل مستخدم ما يخصه فقط.",
    href: "/employees",
    cta: "فتح الموظفين",
    icon: Users,
  },
  {
    label: "سجّل عملاءك",
    title: "وحّد بيانات العملاء",
    description:
      "أضف العملاء واربطهم بالعمل التشغيلي حتى تصبح المتابعة والتقارير مرتبطة ببيانات حقيقية.",
    href: "/clients",
    cta: "فتح العملاء",
    icon: UserPlus,
  },
  {
    label: "شغّل المهام",
    title: "حوّل العمل إلى مهام واضحة",
    description:
      "أنشئ المهام، حدد المسؤول والموعد والأولوية، ثم تابع التنفيذ والمراجعة من مساحة واحدة.",
    href: "/tasks",
    cta: "فتح المهام",
    icon: CheckSquare,
  },
  {
    label: "استكشف المكتب",
    title: "اربط التشغيل بهيكل المنشأة",
    description:
      "بعد ضبط الفريق والمهام، استكشف المكتب الافتراضي والهيكل الإداري كطبقة تشغيل متقدمة.",
    href: "/virtual-office",
    cta: "فتح المكتب الافتراضي",
    icon: Building2,
  },
] as const;

export default function CustomerOnboardingBanner() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    try {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!tourOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTourOpen(false);
      if (event.key === "ArrowLeft" && step < STEPS.length - 1) {
        setStep((current) => current + 1);
      }
      if (event.key === "ArrowRight" && step > 0) {
        setStep((current) => current - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [tourOpen, step]);

  if (pathname !== "/dashboard" || hidden) return null;

  const current = STEPS[step];

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Local storage may be unavailable in private/restricted contexts.
    }
    setTourOpen(false);
    setHidden(true);
  };

  return (
    <>
      <section
        className={cn(
          "relative mb-3 overflow-hidden rounded-2xl border border-cyan-300/15",
          "bg-[linear-gradient(145deg,rgba(8,22,39,.78),rgba(5,15,29,.72))] px-3.5 py-3",
          "shadow-[0_16px_50px_-38px_rgba(34,211,238,.55)] backdrop-blur-xl",
        )}
        aria-label="جولة تعريفية في Blumark24 OS"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_150%_at_100%_0%,rgba(34,211,238,.10),transparent_58%),radial-gradient(90%_140%_at_0%_100%,rgba(124,58,237,.08),transparent_62%)]" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
            <PlayCircle size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-white sm:text-[15px]">
                تعرّف على المنصة خلال دقائق
              </h2>
              <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/45 sm:inline-flex">
                جولة اختيارية
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-[#8ba3c7] sm:text-xs">
              أربع خطوات قصيرة تشرح الفريق والعملاء والمهام والمكتب الافتراضي.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(0);
              setTourOpen(true);
            }}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          >
            ابدأ الجولة
            <ArrowLeft size={14} />
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="إخفاء الجولة التعريفية"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/45 transition hover:text-white sm:inline-flex"
          >
            <X size={14} />
          </button>
        </div>
      </section>

      {tourOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[#02060d]/76 p-3 backdrop-blur-[5px] sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setTourOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="blumark-onboarding-title"
            className="w-full max-w-[620px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,27,45,.98),rgba(5,15,29,.98))] shadow-[0_30px_100px_rgba(0,0,0,.48)]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                  <Sparkles size={16} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-cyan-200/80">
                    جولة Blumark24 OS
                  </div>
                  <h2 id="blumark-onboarding-title" className="truncate text-sm font-bold text-white">
                    {current.label}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTourOpen(false)}
                aria-label="إغلاق الجولة"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:text-white"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-1.5">
                {STEPS.map((item, index) => (
                  <span
                    key={item.href}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      index <= step ? "bg-cyan-300/80" : "bg-white/[0.08]",
                    )}
                  />
                ))}
              </div>

              <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(34,211,238,.14),rgba(59,130,246,.08))] text-cyan-200">
                    <current.icon size={21} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] text-white/40">
                      الخطوة {step + 1} من {STEPS.length}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white">{current.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#9bb0c8]">
                      {current.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={current.href}
                  onClick={() => setTourOpen(false)}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                >
                  {current.cta}
                  <ArrowLeft size={15} />
                </Link>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3.5 sm:px-5">
              <button
                type="button"
                onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
                disabled={step === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowRight size={15} />
                السابق
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((currentStep) => Math.min(STEPS.length - 1, currentStep + 1))}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-4 text-sm font-bold text-white shadow-[0_10px_30px_-18px_rgba(34,211,238,.9)]"
                >
                  التالي
                  <ArrowLeft size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={dismiss}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-4 text-sm font-bold text-white shadow-[0_10px_30px_-18px_rgba(34,211,238,.9)]"
                >
                  <CheckCircle2 size={15} />
                  إنهاء الجولة
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
