import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | Blumark24 OS",
  description: "سياسة الخصوصية الخاصة بمنصة Blumark24 OS.",
};

export default function PrivacyPage() {
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
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">سياسة الخصوصية</h1>
          <p className="mt-4 text-sm leading-7 text-white/65">
            توضح هذه الصفحة المبادئ العامة التي تعتمدها Blumark24 في التعامل مع بيانات العملاء والمستخدمين داخل خدماتها الرقمية.
          </p>

          <div className="mt-8 grid gap-6 text-sm leading-7 text-white/70">
            <section>
              <h2 className="mb-2 text-base font-semibold text-white">البيانات التي قد نجمعها</h2>
              <p>
                قد تشمل البيانات معلومات التواصل، بيانات المنشأة، بيانات الاستخدام، وأي معلومات يقدمها العميل عند طلب عرض تجريبي أو استخدام النظام.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">كيفية استخدام البيانات</h2>
              <p>
                نستخدم البيانات لتقديم الخدمة، تحسين تجربة المستخدم، التواصل مع العملاء، تفعيل الاشتراكات، وتطوير حلول الذكاء الاصطناعي والأتمتة بما يخدم الأعمال.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">حماية البيانات</h2>
              <p>
                نلتزم بتطبيق ممارسات أمنية مناسبة لحماية البيانات وتقليل الوصول غير المصرح به، مع تطوير آليات الحماية بما يتوافق مع احتياج العملاء والسوق السعودي.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-base font-semibold text-white">التواصل</h2>
              <p>
                لأي استفسار متعلق بالخصوصية أو إدارة البيانات، يمكن التواصل مع فريق Blumark24 عبر قنوات التواصل الرسمية في صفحة الهبوط.
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
