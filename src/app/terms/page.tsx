import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

export const metadata: Metadata = {
  title: "شروط الاستخدام | Blumark24 OS",
  description: "شروط استخدام منصة Blumark24 OS.",
};

export default function TermsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050816] px-4 py-10 text-white sm:px-6 lg:py-14"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Blumark24 OS">
            <OfficialBlumarkLogo className="w-[150px]" />
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:text-white"
          >
            العودة للرئيسية
          </Link>
        </div>

        <section className="rounded-3xl border border-white/[0.10] bg-[rgba(10,22,40,0.72)] p-6 backdrop-blur-xl sm:p-9">
          <p className="text-sm font-medium text-[#22D3EE]">Blumark24 OS</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">شروط الاستخدام</h1>
          <p className="mt-4 text-sm leading-7 text-white/65">
            تحدد هذه الصفحة الإطار العام لاستخدام خدمات Blumark24 OS، بما يشمل الوصول للنظام، الاشتراكات، وحماية تجربة العملاء.
          </p>

          <div className="mt-8 grid gap-6 text-sm leading-7 text-white/70">
            <section>
              <h2 className="mb-2 text-base font-semibold text-white">استخدام الخدمة</h2>
              <p>
                يجب استخدام Blumark24 OS للأغراض التجارية المشروعة، وبما يتوافق مع الأنظمة ذات العلاقة وسياسات المنصة.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">الحسابات والصلاحيات</h2>
              <p>
                يتحمل مالك الحساب مسؤولية إدارة المستخدمين، الصلاحيات، بيانات المنشأة، وأي نشاط يتم داخل حسابه وفق الأدوار الممنوحة.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">الاشتراكات والخدمات</h2>
              <p>
                قد تختلف مزايا الخدمة حسب الباقة أو الاتفاق التجاري. يتم توضيح التفاصيل التشغيلية والمالية قبل تفعيل الاشتراك أو تنفيذ الخدمة.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">التحديثات</h2>
              <p>
                يحق لـ Blumark24 تطوير المنصة وتحسينها وتحديث هذه الشروط بما يخدم استقرار الخدمة وتجربة العملاء.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
