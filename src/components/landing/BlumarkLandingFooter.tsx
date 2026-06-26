"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

type FooterLang = "ar" | "en";

type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

const content = {
  ar: {
    dir: "rtl" as const,
    description:
      "منصة تشغيل ذكية تساعد المنشآت على إدارة العملاء، الموظفين، المهام، التقارير، المكتب الافتراضي، والمساعد الذكي ضمن تجربة أعمال موحّدة.",
    badge: "منصة تشغيل مؤسسية قابلة للتوسع",
    navLabel: "روابط Blumark24 OS",
    columns: [
      {
        title: "المنصة",
        links: [
          { label: "Blumark24 OS", href: "/platform" },
          { label: "الديمو التفاعلي", href: "/demo" },
          { label: "تسجيل دخول المنشآت", href: "/auth" },
        ],
      },
      {
        title: "التشغيل الذكي",
        links: [
          { label: "AI للأعمال", href: "/solutions/ai-business" },
          { label: "أتمتة العمليات", href: "/solutions/automation" },
          { label: "إدارة العملاء", href: "/solutions/customer-management" },
          { label: "المكتب الافتراضي", href: "/virtual-office-guide" },
        ],
      },
      {
        title: "مركز المعرفة",
        links: [
          { label: "التسعير", href: "/pricing" },
          { label: "موارد الأعمال", href: "/resources" },
          { label: "حالة النظام", href: "/status" },
        ],
      },
      {
        title: "الشركة",
        links: [
          { label: "عن Blumark24", href: "/about" },
          { label: "الشراكات", href: "/partners" },
          { label: "الوظائف", href: "/careers" },
          { label: "تواصل معنا", href: "/contact" },
        ],
      },
      {
        title: "الثقة والامتثال",
        links: [
          { label: "سياسة الخصوصية", href: "/privacy" },
          { label: "شروط الاستخدام", href: "/terms" },
        ],
      },
    ] satisfies FooterColumn[],
    copyright: "© 2026 Blumark24. جميع الحقوق محفوظة.",
    closing:
      "Blumark24 OS يساعد المنشآت على تشغيل أعمالها بذكاء من خلال منصة موحّدة تجمع الإدارة، التشغيل، التقارير، والأتمتة.",
  },
  en: {
    dir: "ltr" as const,
    description:
      "A smart operating platform for clients, employees, tasks, reports, the virtual office, and AI assistance in one unified business experience.",
    badge: "Enterprise operating platform built to scale",
    navLabel: "Blumark24 OS links",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Blumark24 OS", href: "/platform" },
          { label: "Interactive Demo", href: "/demo" },
          { label: "Business Sign In", href: "/auth" },
        ],
      },
      {
        title: "Smart Operations",
        links: [
          { label: "AI for Business", href: "/solutions/ai-business" },
          { label: "Workflow Automation", href: "/solutions/automation" },
          { label: "Customer Management", href: "/solutions/customer-management" },
          { label: "Virtual Office", href: "/virtual-office-guide" },
        ],
      },
      {
        title: "Knowledge Center",
        links: [
          { label: "Pricing", href: "/pricing" },
          { label: "Business Resources", href: "/resources" },
          { label: "System Status", href: "/status" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About Blumark24", href: "/about" },
          { label: "Partners", href: "/partners" },
          { label: "Careers", href: "/careers" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Trust & Compliance",
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
        ],
      },
    ] satisfies FooterColumn[],
    copyright: "© 2026 Blumark24. All rights reserved.",
    closing:
      "Blumark24 OS helps organizations operate smarter through unified management, operations, reporting, and automation.",
  },
};

function getCurrentLang(): FooterLang {
  if (typeof document === "undefined") return "ar";
  const root = document.querySelector(".marketing-landing-root");
  return root?.getAttribute("dir") === "ltr" ? "en" : "ar";
}

export default function BlumarkLandingFooter() {
  const [lang, setLang] = useState<FooterLang>("ar");

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

  const c = content[lang];

  return (
    <footer dir={c.dir} className="relative overflow-hidden border-t border-white/[0.10] bg-[#050816] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(34,211,238,0.18), transparent 32%), radial-gradient(circle at 88% 16%, rgba(59,130,246,0.16), transparent 34%), linear-gradient(180deg, rgba(5,8,22,0.99), rgba(10,22,40,0.97))",
        }}
      />

      <div className="relative mx-auto max-w-[1440px] px-5 py-12 sm:px-7 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.08fr_2.8fr] lg:gap-16">
          <section className="max-w-lg">
            <Link href="/" aria-label="Blumark24 OS" className="inline-flex items-center">
              <OfficialBlumarkLogo className="w-[170px] sm:w-[190px]" />
            </Link>
            <p className="mt-6 text-[14.5px] leading-8 text-white/72">{c.description}</p>
            <div className="mt-6 inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-[12.5px] font-medium text-[#67E8F9]">
              {c.badge}
            </div>
          </section>

          <nav aria-label={c.navLabel} className="grid grid-cols-2 gap-x-9 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {c.columns.map((column) => (
              <div key={column.title} className="min-w-0">
                <h2 className="relative inline-flex pb-3 text-[15px] font-bold text-white">
                  <span className="absolute bottom-0 right-0 h-px w-8 rounded-full bg-gradient-to-l from-[#22D3EE] to-[#3B82F6]" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-white via-[#DFFBFF] to-[#67E8F9]">
                    {column.title}
                  </span>
                </h2>
                <ul className="mt-4 grid gap-3">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="block text-[13.5px] leading-6 text-white/64 transition hover:translate-x-[-2px] hover:text-[#67E8F9] focus:outline-none focus-visible:text-[#67E8F9]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 border-t border-white/[0.09] pt-7">
          <div className="flex flex-col gap-4 text-[12.5px] leading-7 text-white/52 lg:flex-row lg:items-center lg:justify-between">
            <p className="shrink-0">{c.copyright}</p>
            <p className="max-w-3xl">{c.closing}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
