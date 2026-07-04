"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CheckSquare,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "أضف أول موظف",
    description: "ابدأ ببناء فريق المنشأة وربطه بالأدوار.",
    href: "/employees",
    icon: Users,
  },
  {
    label: "أضف أول عميل",
    description: "سجّل العملاء لتظهر المؤشرات والتقارير بوضوح.",
    href: "/clients",
    icon: UserPlus,
  },
  {
    label: "أنشئ مهمة تشغيلية",
    description: "حوّل العمل اليومي إلى متابعة واضحة داخل النظام.",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "افتح المكتب الافتراضي",
    description: "اربط المكاتب والهيكل الإداري بتجربة مرئية.",
    href: "/virtual-office",
    icon: Building2,
  },
] as const;

export default function CustomerOnboardingBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || pathname !== "/dashboard") return null;

  return (
    <section
      className={cn(
        "relative mb-4 overflow-hidden rounded-[24px] border border-cyan-300/15",
        "bg-[linear-gradient(145deg,rgba(8,20,42,.92),rgba(5,15,32,.86))] p-4 sm:p-5",
        "shadow-[0_20px_60px_-38px_rgba(34,211,238,.65)]",
      )}
      aria-label="خطوات البدء في Blumark24 OS"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_120%_at_92%_-20%,rgba(34,211,238,.16),transparent_55%),radial-gradient(100%_110%_at_0%_120%,rgba(124,58,237,.14),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="إخفاء خطوات البدء"
        className="absolute left-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:border-white/20 hover:text-white"
      >
        <X size={15} />
      </button>

      <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0 pl-10 lg:pl-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">
            <CheckCircle2 size={12} />
            تجربة تشغيل أولى
          </div>
          <h2 className="text-base font-bold text-white sm:text-lg">
            ابدأ تشغيل منشأتك خلال دقائق
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#8ba3c7] sm:text-sm">
            هذه الخطوات تجعل لوحة العميل مفهومة من أول دخول: فريق، عملاء، مهام، ثم المكتب الافتراضي.
          </p>
        </div>

        <Link
          href="/employees"
          className="hidden min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15 lg:inline-flex"
        >
          ابدأ الآن
          <ArrowLeft size={15} />
        </Link>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, index) => (
          <Link
            key={step.href}
            href={step.href}
            className="group rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 transition hover:border-cyan-300/20 hover:bg-white/[0.055]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                <step.icon size={15} />
              </span>
              <span className="text-[10px] text-white/35">0{index + 1}</span>
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-cyan-50">
              {step.label}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">
              {step.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
