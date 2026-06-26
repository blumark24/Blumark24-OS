import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const systems = [
  { name: "المنصة", status: "تعمل", detail: "واجهة Blumark24 OS والصفحات العامة." },
  { name: "تسجيل دخول المنشآت", status: "متاح", detail: "بوابة دخول العملاء والمنشآت." },
  { name: "الديمو التفاعلي", status: "متاح", detail: "استعراض وحدات النظام الأساسية." },
  { name: "واجهات API", status: "نشطة", detail: "فحص أولي لحالة الخدمات التقنية." },
];

export const metadata: Metadata = {
  title: "حالة النظام | Blumark24 OS",
  description: "صفحة حالة نظام Blumark24 OS.",
};

export default function StatusPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[#050816] px-4 py-10 text-white sm:px-6 lg:py-14"
      style={{ fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(34,211,238,0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(59,130,246,0.14), transparent 32%), linear-gradient(180deg, #050816, #0A1628)",
        }}
      />

      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Blumark24 OS">
            <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:text-white"
          >
            الرئيسية
          </Link>
        </header>

        <section className="rounded-[2rem] border border-white/[0.10] bg-[rgba(10,22,40,0.76)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9 lg:p-11">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
            Operational Status
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            حالة نظام Blumark24 OS
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/68 sm:text-base">
            صفحة مخصصة لعرض حالة الخدمات الأساسية للمنصة بشكل واضح واحترافي بدلاً من عرض استجابة تقنية خام للمستخدم.
          </p>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {systems.map((system) => (
            <article
              key={system.name}
              className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">{system.name}</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  {system.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/64">{system.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-6 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-white">ملاحظة تشغيلية</h2>
          <p className="mt-3 text-sm leading-8 text-white/64">
            هذه الصفحة تعرض الحالة العامة للمنصة. يمكن لاحقاً ربطها ببيانات مراقبة فعلية من الخادم وقاعدة البيانات وخدمات التكامل.
          </p>
        </section>
      </div>
    </main>
  );
}
