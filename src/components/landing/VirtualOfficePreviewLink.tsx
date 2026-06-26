"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

type Lang = "ar" | "en";

const copy = {
  ar: {
    dir: "rtl" as const,
    eyebrow: "طبقة المكتب الافتراضي",
    title: "المكتب الافتراضي",
    desc: "صورة تشغيلية توضّح كيف تتحول منشأتك إلى مكتب رقمي منظم يربط الإدارات، الموظفين، الاجتماعات، التقارير، والمساعد الذكي في تجربة واحدة.",
    cta: "استعرض المكتب الافتراضي",
    imageAlt: "معاينة المكتب الافتراضي في Blumark24 OS",
  },
  en: {
    dir: "ltr" as const,
    eyebrow: "Virtual Office Layer",
    title: "Virtual Office",
    desc: "An operational preview of how your organization becomes a structured digital office connecting departments, employees, meetings, reports, and the AI assistant in one experience.",
    cta: "Explore the Virtual Office",
    imageAlt: "Virtual office preview in Blumark24 OS",
  },
};

function getCurrentLang(): Lang {
  if (typeof document === "undefined") return "ar";
  const root = document.querySelector(".marketing-landing-root");
  return root?.getAttribute("dir") === "ltr" ? "en" : "ar";
}

export default function VirtualOfficePreviewLink() {
  const [lang, setLang] = useState<Lang>("ar");
  const [imageReady, setImageReady] = useState(true);

  useEffect(() => {
    const syncLang = () => setLang(getCurrentLang());
    syncLang();

    const root = document.querySelector(".marketing-landing-root");
    if (!root) {
      const timer = window.setTimeout(syncLang, 300);
      return () => window.clearTimeout(timer);
    }

    const observer = new MutationObserver(syncLang);
    observer.observe(root, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  const c = copy[lang];

  return (
    <section
      dir={c.dir}
      className="relative overflow-hidden bg-[#050816] px-4 py-16 text-white sm:px-6 sm:py-20"
      aria-labelledby="virtual-office-preview-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/[0.08] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(34,211,238,0.13), transparent 35%), radial-gradient(circle at 85% 25%, rgba(59,130,246,0.11), transparent 38%)",
        }}
      />

      <div className="relative mx-auto max-w-[1180px]">
        <Link
          href="/platform"
          className="group block overflow-hidden rounded-[28px] border border-white/[0.10] bg-white/[0.035] p-3 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#22D3EE]/35 hover:bg-white/[0.055] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]/70"
          aria-label={c.cta}
        >
          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#081120]">
            {imageReady ? (
              <img
                src="/images/virtual-office-preview.webp"
                alt={c.imageAlt}
                onError={() => setImageReady(false)}
                className="aspect-[1672/941] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[1672/941] w-full bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.20),transparent_30%),linear-gradient(135deg,rgba(15,23,42,1),rgba(5,8,22,1))]">
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div className="rounded-3xl border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-5 py-4 text-[#67E8F9]">
                    <Building2 className="mx-auto mb-2 h-7 w-7" strokeWidth={1.7} />
                    <span className="text-sm font-medium">{c.title}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050816]/84 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
              <div className="inline-flex rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/12 px-3 py-1 text-[12px] font-medium text-[#67E8F9] backdrop-blur-md">
                {c.eyebrow}
              </div>
              <h2
                id="virtual-office-preview-title"
                className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl"
              >
                {c.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
                {c.desc}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="text-center sm:text-start">
              <p className="text-lg font-semibold text-white">{c.title}</p>
              <p className="mt-1 text-sm text-white/55">{c.cta}</p>
            </div>
            <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-5 py-3 text-sm font-medium text-[#67E8F9] transition group-hover:bg-[#22D3EE]/15">
              {c.cta}
              <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" strokeWidth={1.8} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
