"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckSquare,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "أضف أول موظف",
    description: "ابدأ بفريق المنشأة وحدد الدور والوحدة التنظيمية لكل موظف.",
    href: "/employees",
    action: "افتح الموظفين",
    icon: Users,
  },
  {
    label: "أضف أول عميل",
    description: "سجّل العميل واربط العمل به حتى تظهر المتابعة في نفس السياق.",
    href: "/clients",
    action: "افتح العملاء",
    icon: UserPlus,
  },
  {
    label: "أنشئ أول مهمة",
    description: "حوّل العمل اليومي إلى مهمة واضحة بموعد ومسؤول وحالة تنفيذ.",
    href: "/tasks",
    action: "افتح المهام",
    icon: CheckSquare,
  },
  {
    label: "استكشف المكتب الافتراضي",
    description: "استخدم المكتب الافتراضي لربط الفريق والهيكل وتجربة العمل اليومية.",
    href: "/virtual-office",
    action: "افتح المكتب",
    icon: Building2,
  },
] as const;

export default function CustomerOnboardingBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  if (dismissed || pathname !== "/dashboard") return null;

  const step = STEPS[activeStep];
  const StepIcon = step.icon;
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <section
      className={cn(
        "relative mt-4 overflow-hidden rounded-[22px] border border-cyan-300/15",
        "bg-[linear-gradient(145deg,rgba(8,20,42,.88),rgba(5,15,32,.78))] p-3.5 sm:p-4",
        "shadow-[0_18px_54px_-40px_rgba(34,211,238,.7)]",
      )}
      aria-label="جولة تعليمية في Blumark24 OS"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_110%_at_90%_-25%,rgba(34,211,238,.16),transparent_58%),radial-gradient(95%_105%_at_0%_120%,rgba(124,58,237,.12),transparent_62%)]" />

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء الجولة التعليمية"
        className="absolute left-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:text-white"
      >
        <X size={14} />
      </button>

      <div className="relative z-10">
        <div className="flex items-center gap-2 pr-0 pl-10">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
            <StepIcon size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-cyan-100/80">
                الجولة التعليمية · {activeStep + 1} من {STEPS.length}
              </p>
              <span className="text-[10px] text-white/35">Blumark24 OS</span>
            </div>
            <h2 className="mt-0.5 text-sm font-bold text-white sm:text-base">{step.label}</h2>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-xs leading-6 text-[#8ba3c7] sm:text-[13px]">
          {step.description}
        </p>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-l from-cyan-300 to-blue-500 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href={step.href}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-400/15"
          >
            {step.action}
            <ArrowLeft size={13} />
          </Link>

          <button
            type="button"
            onClick={() => setActiveStep((current) => Math.min(STEPS.length - 1, current + 1))}
            disabled={activeStep === STEPS.length - 1}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/80 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-35"
          >
            التالي
            <ArrowLeft size={13} />
          </button>

          <button
            type="button"
            onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
            disabled={activeStep === 0}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
          >
            <ArrowRight size={13} />
            السابق
          </button>
        </div>
      </div>
    </section>
  );
}
