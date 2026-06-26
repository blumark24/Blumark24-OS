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
    title: "المنتج",
    links: [
      { label: "المنصة", href: "/platform", note: "تعريف واضح بمنصة Blumark24 OS" },
      { label: "الديمو التفاعلي", href: "/demo", note: "تجربة مباشرة للنظام" },
      { label: "تسجيل الدخول", href: "/auth", note: "دخول العملاء والمنشآت" },
    ],
  },
  {
    title: "الحلول",
    links: [
      { label: "AI للأعمال", href: "/solutions/ai-business", note: "حلول ذكاء اصطناعي للأعمال" },
      { label: "أتمتة العمليات", href: "/solutions/automation", note: "أتمتة تشغيلية للفرق" },
      { label: "إدارة العملاء", href: "/solutions/customer-management", note: "تنظيم العملاء والمتابعة" },
      { label: "القطاعات", href: "/industries", note: "القطاعات التي نخدمها" },
    ],
  },
  {
    title: "الموارد",
    links: [
      { label: "التسعير", href: "/pricing", note: "باقات Blumark24 OS" },
      { label: "مركز المعرفة", href: "/resources", note: "محتوى تعريفي وتشغيلي" },
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
    title: "قانوني",
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
      className="relative overflow-hidden border-t border-white/[0.08] bg-[#050816] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 12%, rgba(34,211,238,0.14), transparent 30%), radial-gradient(circle at 88% 14%, rgba(59,130,246,0.12), transparent 32%), linear-gradient(180deg, rgba(5,8,22,0.98), rgba(10,22,40,0.96))",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#22D3EE]/35 to-transparent"
      />

      <div className="relative mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_2.8fr] lg:gap-14">
          <section className="max-w-md">
            <Link href="/" aria-label="Blumark24 OS" className="inline-flex items-center">
              <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
            </Link>

            <p className="mt-5 text-[13.5px] leading-7 text-white/68">
              شركة سعودية تبني أنظمة ذكاء اصطناعي وأتمتة تساعد الأعمال على التشغيل، النمو، وخدمة العملاء بكفاءة أعلى.
            </p>

            <div className="mt-5 inline-flex rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-[#22D3EE] backdrop-blur-md">
              صُنعت في السعودية. صُممت للأعمال الذكية.
            </div>
          </section>

          <nav
            aria-label="روابط Blumark24 OS"
            className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-5"
          >
            {footerColumns.map((column) => (
              <div key={column.title} className="min-w-0">
                <h2 className="text-[13px] font-semibold text-white">{column.title}</h2>
                <ul className="mt-3 grid gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        title={link.note}
                        className="block text-[12.5px] leading-5 text-white/58 transition hover:text-white focus:outline-none focus-visible:text-white"
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

        <div className="mt-10 border-t border-white/[0.08] pt-6">
          <div className="flex flex-col gap-4 text-[12px] leading-6 text-white/48 lg:flex-row lg:items-center lg:justify-between">
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
