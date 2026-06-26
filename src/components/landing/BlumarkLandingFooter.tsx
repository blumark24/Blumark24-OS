import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

type FooterLink = {
  label: string;
  href: string;
  note?: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const footerColumns: FooterColumn[] = [
  {
    title: "المنتج",
    links: [
      { label: "Blumark24 OS", href: "/demo", note: "يفتح الديمو التفاعلي للنظام" },
      { label: "نظام إدارة الأعمال", href: "/demo", note: "يعرض تجربة إدارة الأعمال" },
      { label: "المكتب الافتراضي", href: "/demo", note: "يعرض تجربة المكتب الافتراضي عند تفعيلها" },
      { label: "لوحة المالك", href: "/auth", note: "ينقل المستخدم لتسجيل الدخول" },
      { label: "إدارة العملاء CRM", href: "/demo", note: "يعرض وحدة العملاء" },
      { label: "إدارة الموظفين", href: "/demo", note: "يعرض وحدة الموظفين" },
      { label: "إدارة المهام", href: "/demo", note: "يعرض وحدة المهام" },
      { label: "الإدارة المالية", href: "/demo", note: "يعرض وحدة المالية" },
      { label: "المساعد الذكي", href: "/demo", note: "يعرض تجربة المساعد الذكي" },
      { label: "التقارير والتحليلات", href: "/demo", note: "يعرض لوحة التقارير" },
      { label: "الهيكل الإداري الذكي", href: "/demo", note: "يعرض الهيكل الإداري" },
    ],
  },
  {
    title: "الحلول",
    links: [
      { label: "حلول الذكاء الاصطناعي للأعمال", href: "#contact", note: "ينقل المستخدم لطلب الحل" },
      { label: "أتمتة العمليات", href: "#contact", note: "ينقل المستخدم لطلب الأتمتة" },
      { label: "بوت واتساب ذكي", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "مواقع وصفحات هبوط", href: "#contact", note: "ينقل المستخدم لطلب الخدمة" },
      { label: "إدارة العملاء والمبيعات", href: "/demo", note: "يعرض تجربة CRM" },
      { label: "أنظمة الحجز والطلبات", href: "#contact", note: "ينقل المستخدم لطلب الربط" },
      { label: "لوحات متابعة تنفيذية", href: "/demo", note: "يعرض الديمو التنفيذي" },
      { label: "ربط الفروع والإدارات", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "حلول SaaS للشركات", href: "#pricing", note: "ينقل المستخدم للباقات" },
    ],
  },
  {
    title: "الموارد",
    links: [
      { label: "التسعير", href: "#pricing", note: "ينقل المستخدم إلى الباقات" },
      { label: "طلب عرض تجريبي", href: "#contact", note: "ينقل المستخدم لنموذج الطلب" },
      { label: "دليل Blumark24 OS", href: "/demo", note: "يعرض النظام عملياً" },
      { label: "دليل المكتب الافتراضي", href: "/demo", note: "يعرض الديمو" },
      { label: "دليل أتمتة الأعمال", href: "#features", note: "ينقل المستخدم للمزايا" },
      { label: "قصص العملاء", href: "#audience", note: "ينقل المستخدم للقطاعات المستهدفة" },
      { label: "مركز المعرفة", href: "#features", note: "ينقل المستخدم للمزايا" },
      { label: "المدونة", href: "#contact", note: "ينقل المستخدم للتواصل حالياً" },
      { label: "الأسئلة الشائعة", href: "#pricing", note: "ينقل المستخدم للباقات" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "حدد موعدًا لعرض توضيحي", href: "#contact", note: "ينقل المستخدم إلى طلب العرض" },
      { label: "تواصل معنا", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "مركز المساعدة", href: "#contact", note: "ينقل المستخدم للدعم" },
      { label: "تسجيل الدخول", href: "/auth", note: "يفتح صفحة تسجيل الدخول" },
      { label: "الدعم الفني", href: "#contact", note: "ينقل المستخدم للدعم" },
      { label: "طلب اشتراك", href: "#pricing", note: "ينقل المستخدم للباقات" },
      { label: "حالة النظام", href: "/api/health", note: "يعرض حالة النظام التقنية" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "عن Blumark24", href: "#home", note: "يعيد المستخدم إلى بداية صفحة الشركة" },
      { label: "فريق العمل", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "الرؤية والرسالة", href: "#why", note: "ينقل المستخدم لقسم لماذا نحن" },
      { label: "الوظائف", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "الشراكات", href: "#contact", note: "ينقل المستخدم للتواصل" },
      { label: "سياسة الخصوصية", href: "/privacy", note: "يفتح صفحة سياسة الخصوصية" },
      { label: "شروط الاستخدام", href: "/terms", note: "يفتح صفحة شروط الاستخدام" },
    ],
  },
  {
    title: "الصناعات",
    links: [
      { label: "المطاعم والكافيهات", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "العيادات والمراكز الطبية", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "المتاجر والمحلات التجارية", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "الشركات الصغيرة والمتوسطة", href: "#pricing", note: "ينقل المستخدم للباقات" },
      { label: "الفنادق والضيافة", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "وكالات التسويق", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "فرق المبيعات", href: "/demo", note: "يعرض تجربة متابعة المبيعات" },
      { label: "مزودو الخدمات", href: "#contact", note: "ينقل المستخدم لطلب حل للقطاع" },
      { label: "رواد الأعمال", href: "#pricing", note: "ينقل المستخدم للباقات" },
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
        <div className="grid gap-10 lg:grid-cols-[1.05fr_3fr] lg:gap-14">
          <section className="max-w-md">
            <Link href="/" aria-label="Blumark24 OS" className="inline-flex items-center">
              <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
            </Link>

            <p className="mt-5 text-[13.5px] leading-7 text-white/68">
              شركة سعودية متخصصة في حلول الذكاء الاصطناعي، الأتمتة، وأنظمة إدارة الأعمال الرقمية.
            </p>

            <div className="mt-5 inline-flex rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-[#22D3EE] backdrop-blur-md">
              صُنعت في السعودية. صُممت للأعمال الذكية.
            </div>
          </section>

          <nav
            aria-label="روابط Blumark24 OS"
            className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6"
          >
            {footerColumns.map((column) => (
              <div key={column.title} className="min-w-0">
                <h2 className="text-[13px] font-semibold text-white">{column.title}</h2>
                <ul className="mt-3 grid gap-2.5">
                  {column.links.map((link) => {
                    const isInternalAnchor = link.href.startsWith("#");
                    const className =
                      "block text-[12.5px] leading-5 text-white/58 transition hover:text-white focus:outline-none focus-visible:text-white";

                    return (
                      <li key={`${column.title}-${link.label}`}>
                        {isInternalAnchor ? (
                          <a href={link.href} title={link.note} className={className}>
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} title={link.note} className={className}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
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
