import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Network, ShieldCheck, Sparkles } from "lucide-react";

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

const rooms = [
  { label: "الإدارة", value: "01", className: "col-span-2 bg-cyan-400/12 border-cyan-300/30" },
  { label: "المبيعات", value: "02", className: "bg-blue-400/10 border-blue-300/25" },
  { label: "الدعم", value: "03", className: "bg-sky-400/10 border-sky-300/25" },
  { label: "المالية", value: "04", className: "bg-indigo-400/10 border-indigo-300/25" },
  { label: "الاجتماعات", value: "05", className: "col-span-2 bg-cyan-400/10 border-cyan-300/25" },
];

function VirtualOfficePreview() {
  return (
    <div className="relative aspect-[1672/941] w-full overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#07111f] p-3 sm:p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.20), transparent 34%), radial-gradient(circle at 15% 15%, rgba(59,130,246,0.16), transparent 30%), linear-gradient(135deg, rgba(7,17,31,1), rgba(5,8,22,1))",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(103,232,249,0.36) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.36) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative flex h-full flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 backdrop-blur-md">
          <div className="text-right">
            <p className="text-[11px] text-cyan-200/70">Blumark24 OS</p>
            <h3 className="text-sm font-semibold text-white sm:text-base">المكتب الافتراضي التنفيذي</h3>
          </div>
          <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium text-cyan-100">
            مباشر
          </div>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
          {rooms.map((room) => (
            <div
              key={room.label}
              className={`relative overflow-hidden rounded-2xl border p-3 backdrop-blur-md ${room.className}`}
            >
              <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-cyan-300/15 blur-2xl" />
              <div className="relative flex h-full flex-col justify-between">
                <span className="text-[10px] text-white/45">OFFICE {room.value}</span>
                <div>
                  <p className="text-sm font-semibold text-white sm:text-base">{room.label}</p>
                  <div className="mt-2 flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    <span className="h-2 w-2 rounded-full bg-blue-300/70" />
                    <span className="h-2 w-2 rounded-full bg-white/35" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-white/60 sm:text-xs">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 py-2">موظفون</div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 py-2">اجتماعات</div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 py-2">تقارير</div>
        </div>
      </div>
    </div>
  );
}

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
              <VirtualOfficePreview />
              <div className="px-3 py-4 text-sm leading-7 text-white/60">
                هذه معاينة بصرية مدمجة للمكتب الافتراضي، بدون الاعتماد على روابط خارجية، لضمان ظهورها دائماً داخل الموقع.
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
