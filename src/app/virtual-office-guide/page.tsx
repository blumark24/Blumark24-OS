import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";

const previewImageUrl = "data:image/jpeg;base64,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";

export const metadata: Metadata = {
  title: "المكتب الافتراضي | Blumark24 OS",
  description:
    "شرح المكتب الافتراضي في Blumark24 OS وكيف يربط الإدارات، الموظفين، الاجتماعات، التقارير، والمساعد الذكي في تجربة تشغيل واحدة.",
};

const steps = [
  "عرض المنشأة كمكتب رقمي واضح مرتبط بالهيكل الإداري.",
  "ربط الإدارات والموظفين والغرف التشغيلية في واجهة واحدة.",
  "إظهار حالة العمل والاجتماعات والتقارير حسب الصلاحيات.",
  "دعم قرارات الإدارة عبر صورة تشغيلية مبسطة وسريعة الفهم.",
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
    title: "مساعد ذكي وتشغيل أسرع",
    desc: "يدعم قراءة الحالة التشغيلية وتوجيه المستخدمين إلى الإجراء المناسب.",
  },
];

export default function VirtualOfficeGuidePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden px-5 py-16 sm:px-7 lg:px-8 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 10%, rgba(34,211,238,0.18), transparent 34%), radial-gradient(circle at 90% 18%, rgba(59,130,246,0.16), transparent 36%), linear-gradient(180deg, rgba(5,8,22,1), rgba(10,22,40,0.98))",
          }}
        />

        <div className="relative mx-auto max-w-[1180px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:border-[#22D3EE]/35 hover:text-[#67E8F9]"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة لصفحة الهبوط
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-sm font-medium text-[#67E8F9]">
                طبقة تشغيل ذكية داخل Blumark24 OS
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                المكتب الافتراضي
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                المكتب الافتراضي هو طبقة بصرية وتشغيلية تساعد المنشأة على رؤية الإدارات، الموظفين، الاجتماعات، التقارير، والمساعد الذكي ضمن مساحة عمل رقمية واحدة مرتبطة بالهيكل الإداري.
              </p>

              <div className="mt-8 grid gap-3">
                {steps.map((step) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#67E8F9]" />
                    <p className="text-sm leading-7 text-white/72">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/[0.10] bg-white/[0.04] p-3 shadow-2xl shadow-cyan-950/20">
              <img
                src={previewImageUrl}
                alt="صورة توضيحية للمكتب الافتراضي داخل Blumark24 OS"
                className="aspect-[1672/941] w-full rounded-[22px] object-cover"
                loading="eager"
              />
              <div className="px-3 py-4 text-sm leading-7 text-white/60">
                الصورة توضّح التصور البصري للمكتب الافتراضي وكيف يمكن تقسيمه إلى غرف وإدارات ومساحات تشغيلية مترابطة.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08] px-5 py-14 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-2xl font-bold sm:text-3xl">كيف يخدم المكتب الافتراضي المنشأة؟</h2>
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
