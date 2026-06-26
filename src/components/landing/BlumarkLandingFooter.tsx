import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

type FooterLink = {
  label: string;
  href: string;
  note: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "المنصة",
    links: [
      { label: "Blumark24 OS", href: "/platform", note: "تعريف واضح بمنصة Blumark24 OS" },
      { label: "الديمو التفاعلي", href: "/demo", note: "تجربة مباشرة للنظام" },
      { label: "تسجيل دخول المنشآت", href: "/auth", note: "دخول العملاء والمنشآت" },
    ],
  },
  {
    title: "التشغيل الذكي",
    links: [
      { label: "AI للأعمال", href: "/solutions/ai-business", note: "حلول ذكاء اصطناعي للأعمال" },
      { label: "أتمتة العمليات", href: "/solutions/automation", note: "أتمتة تشغيلية للفرق" },
      { label: "إدارة العملاء", href: "/solutions/customer-management", note: "تنظيم العملاء والمتابعة" },
      { label: "القطاعات", href: "/industries", note: "القطاعات التي نخدمها" },
    ],
  },
  {
    title: "مركز المعرفة",
    links: [
      { label: "التسعير", href: "/pricing", note: "باقات Blumark24 OS" },
      { label: "موارد الأعمال", href: "/resources", note: "محتوى تعريفي وتشغيلي" },
      { label: "حالة النظام", href: "/api/health", note: "فحص الحالة التقنية" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "عن Blumark24", href: "/about", note: "تعريف الشركة وهويتها" },
      { label: "الشراكات", href: "/partners", note: "فرص التعاون والشراكات" },
      { label: "الوظائف", href: "/careers", note: "فرص الانضمام للفريق" },
      { label: "تواصل معنا", href: "/contact", note: "قنوات التواصل الرسمية" },
    ],
  },
  {
    title: "الثقة والامتثال",
    links: [
      { label: "سياسة الخصوصية", href: "/privacy", note: "سياسة التعامل مع البيانات" },
      { label: "شروط الاستخدام", href: "/terms", note: "شروط استخدام الخدمة" },
    ],
  },
];

export default function BlumarkLandingFooter() {
  return (
    <footer
      dir="rtl"
      className="relative overflow-hidden border-t border-white/[0.10] bg-[#050816] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(34,211,238,0.18), transparent 32%), radial-gradient(circle at 88% 16%, rgba(59,130,246,0.16), transparent 34%), radial-gradient(circle at 50% 100%, rgba(14,165,233,0.10), transparent 42%), linear-gradient(180deg, rgba(5,8,22,0.99), rgba(10,22,40,0.97))",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#22D3EE]/45 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-8 top-10 h-24 w-24 rounded-full bg-[#22D3EE]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1440px] px-5 py-12 sm:px-7 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.08fr_2.8fr] lg:gap-16">
          <section className="max-w-lg">
            <Link href="/" aria-label="Blumark24 OS" className="inline-flex items-center">
              <OfficialBlumarkLogo className="w-[170px] sm:w-[190px]" />
            </Link>

            <p className="mt-6 text-[14.5px] leading-8 text-white/72">
              شركة سعودية تبني أنظمة ذكاء اصطناعي وأتمتة تساعد الأعمال على التشغيل، النمو، وخدمة العملاء بكفاءة أعلى.
            </p>

            <div className="mt-6 inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-[12.5px] font-medium text-[#67E8F9] shadow-[0_0_34px_rgba(34,211,238,0.10)] backdrop-blur-md">
              صُنعت في السعودية. صُممت للأعمال الذكية.
            </div>
          </section>

          <nav
            aria-label="روابط Blumark24 OS"
            className="grid grid-cols-2 gap-x-9 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
          >
            {footerColumns.map((column) => (
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
                        title={link.note}
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
            <p className="shrink-0">© 2026 Blumark24. جميع الحقوق محفوظة.</p>
            <p className="max-w-3xl">
              Blumark24 تساعد الشركات السعودية على تشغيل أعمالها بذكاء من خلال أنظمة رقمية، أتمتة، ومساعدات ذكاء اصطناعي مصممة للسوق السعودي.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
