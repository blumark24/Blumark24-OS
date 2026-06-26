import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";

const previewImageUrl = "/virtual-office-preview.svg";

export const metadata: Metadata = {
  title: "المكتب الافتراضي | Blumark24 OS",
  description:
    "شرح المكتب الافتراضي في Blumark24 OS وكيف يربط الإدارات، الموظفين، الاجتماعات، التقارير، والمساعد الذكي في تجربة تشغيل واحدة.",
};

const highlights = [
  "تصور بصري للمنشأة كمكتب رقمي منظم وواضح.",
  "ربط الغرف والإدارات بالهيكل الإداري والصلاحيات.",
  "تسهيل متابعة الفرق والاجتماعات والمهام من واجهة واحدة.",
  "إظهار صورة تشغيلية تساعد الإدارة على اتخاذ قرار أسرع.",
];

const features = [
  {
    icon: Building2,
    title: "مكتب رقمي للمنشأة",
    desc: "يعرض الإدارات والغرف والفرق بشكل بصري يساعد الإدارة على فهم التشغيل بسرعة.",
  },
  {
    icon: Network,
    title: "مرتبط بالهيكل الإداري",
    desc: "كل مساحة في المكتب ترتبط بالموظفين والإدارات والصلاحيات داخل Blumark24 OS.",
  },
  {
    icon: ShieldCheck,
    title: "حوكمة وصلاحيات",
    desc: "المشاهدة والتحكم تظهر حسب دور المستخدم، مثل المالك، المدير، أو الموظف.",
  },
  {
    icon: Sparkles,
    title: "تشغيل أذكى",
    desc: "يدعم قراءة الحالة التشغيلية وتوجيه المستخدمين إلى الإجراء المناسب داخل المنصة.",
  },
];

export default function VirtualOfficeGuidePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden px-5 py-14 sm:px-7 lg:px-8 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 10%, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 90% 18%, rgba(59,130,246,0.16), transparent 36%), linear-gradient(180deg, rgba(5,8,22,1), rgba(10,22,40,0.98))",
          }}
        />

        <div className="relative mx-auto max-w-[1240px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:border-[#22D3EE]/35 hover:text-[#67E8F9]"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة لصفحة الهبوط
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <section className="rounded-[32px] border border-white/[0.09] bg-white/[0.035] p-6 backdrop-blur-xl sm:p-8 lg:p-10">
              <div className="inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-sm font-medium text-[#67E8F9]">
                ميزة متقدمة داخل Blumark24 OS
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                المكتب الافتراضي
              </h1>

              <p className="mt-5 text-base leading-8 text-white/72 sm:text-lg">
                مساحة تشغيل رقمية تعرض المنشأة كأنها مكتب حي، بحيث تظهر الإدارات والغرف والفرق والاجتماعات بصورة منظمة مرتبطة بالهيكل الإداري داخل النظام.
              </p>

              <div className="mt-7 grid gap-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#67E8F9]" />
                    <p className="text-sm leading-7 text-white/72">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <figure className="overflow-hidden rounded-[32px] border border-white/[0.10] bg-white/[0.04] p-3 shadow-2xl shadow-cyan-950/20">
              <img
                src={previewImageUrl}
                alt="تصور بصري للمكتب الافتراضي داخل Blumark24 OS"
                className="aspect-[1672/941] w-full rounded-[24px] object-cover"
              />
              <figcaption className="px-3 py-4 text-sm leading-7 text-white/60">
                التصور يوضح طريقة عرض المكاتب، غرف الاجتماعات، الإدارات، ولوحات المتابعة داخل تجربة تشغيل واحدة.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] px-5 py-14 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">كيف يخدم المكتب الافتراضي المنشأة؟</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              الهدف ليس مجرد صورة جميلة، بل واجهة تشغيل تساعد المالك والمدير على فهم الواقع التشغيلي بسرعة.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5">
                  <Icon className="h-7 w-7 text-[#67E8F9]" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">{feature.desc}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
