import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

const platformModules = [
  { title: "المكتب الافتراضي", body: "صورة تشغيلية للمكاتب والإدارات داخل المنشأة، مع غرف عمل واجتماعات مرتبطة بالهيكل الإداري." },
  { title: "الهيكل الإداري", body: "تنظيم الإدارات والأقسام والموظفين والصلاحيات في خريطة واضحة قابلة للإدارة." },
  { title: "إدارة العملاء", body: "متابعة العملاء، الحالات، مصادر الوصول، وسجل التواصل من لوحة واحدة." },
  { title: "المساعد الذكي", body: "مساعد AI يساعد في قراءة البيانات، تلخيص العمل، واقتراح الخطوة التالية." },
  { title: "المهام والتشغيل", body: "ربط الفريق بالمهام اليومية، الحالات، المواعيد، والتنبيهات المهمة." },
  { title: "التقارير التنفيذية", body: "مؤشرات واضحة للمالك والمدير عن النمو، الأداء، العملاء، والعمل التشغيلي." },
];

const operatingFlow = [
  "المنشأة",
  "الهيكل الإداري",
  "المكتب الافتراضي",
  "العملاء والمهام",
  "التقارير والقرارات",
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blumark24 OS | Digital Twin Business Platform",
  description: "منصة Blumark24 OS كنظام تشغيل وتوأم رقمي للأعمال السعودية.",
};

export default function HomePage() {
  return (
    <>
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
              "radial-gradient(circle at 12% 8%, rgba(34,211,238,0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(59,130,246,0.14), transparent 32%), radial-gradient(circle at 50% 78%, rgba(14,165,233,0.10), transparent 35%), linear-gradient(180deg, #050816, #0A1628)",
          }}
        />

        <div className="mx-auto max-w-7xl">
          <header className="mb-10 flex items-center justify-between gap-4">
            <Link href="/" aria-label="Blumark24 OS">
              <OfficialBlumarkLogo className="w-[150px] sm:w-[170px]" />
            </Link>
            <Link
              href="/demo"
              className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:text-white"
            >
              مشاهدة الديمو
            </Link>
          </header>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[rgba(10,22,40,0.76)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9 lg:p-11">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-3 py-1.5 text-xs font-medium text-[#67E8F9]">
                  Blumark24 OS · Digital Twin Business Platform
                </div>

                <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  منصة تشغيل ذكية تعرض منشأتك كنسخة رقمية واضحة
                </h1>
                <p className="mt-6 max-w-3xl text-sm leading-8 text-white/68 sm:text-base">
                  Blumark24 OS تجمع المكتب الافتراضي، الهيكل الإداري، العملاء، المهام، المساعد الذكي، والتقارير التنفيذية في تجربة واحدة تساعد الإدارة على رؤية العمل واتخاذ القرار بسرعة.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/demo"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] px-6 text-sm font-medium text-white shadow-[0_16px_44px_rgba(34,211,238,0.22)] transition hover:brightness-110"
                  >
                    مشاهدة الديمو
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-6 text-sm font-medium text-white/72 transition hover:text-white"
                  >
                    احجز عرض منصة للمنشآت
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[390px] rounded-[2rem] border border-white/[0.10] bg-[#061225]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="absolute inset-6 rounded-full border border-[#22D3EE]/15" />
                <div className="absolute inset-14 rounded-full border border-[#3B82F6]/15" />
                <div className="absolute inset-24 rounded-full border border-white/[0.08]" />

                <div className="relative z-10 flex h-full min-h-[350px] flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/42">CLIENT OPERATING MAP</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">Virtual Office Twin</h2>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      Live
                    </div>
                  </div>

                  <div className="relative mx-auto my-5 flex h-44 w-44 items-center justify-center rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 shadow-[0_0_70px_rgba(34,211,238,0.20)]">
                    <div className="absolute h-28 w-28 rounded-full border border-[#22D3EE]/30" />
                    <div className="text-center">
                      <p className="text-xs text-[#67E8F9]">OFFICE 09</p>
                      <p className="mt-1 text-sm font-semibold text-white">Executive Hub</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {["Board Room", "Admin Office", "Focus Zone", "AI Assistant", "CRM", "Reports"].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-xs text-white/68"
                      >
                        <span className="mb-2 block h-1 w-8 rounded-full bg-[#22D3EE]/70" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {operatingFlow.map((item, index) => (
              <article
                key={item}
                className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-5 backdrop-blur-xl"
              >
                <p className="text-xs font-medium text-[#67E8F9]">0{index + 1}</p>
                <h2 className="mt-3 text-base font-semibold text-white">{item}</h2>
              </article>
            ))}
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformModules.map((module) => (
              <article
                key={module.title}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-6 backdrop-blur-xl transition hover:border-[#22D3EE]/25"
              >
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#22D3EE]/10 blur-2xl transition group-hover:bg-[#22D3EE]/20" />
                <div className="relative">
                  <p className="mb-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1 text-[11px] text-white/42">
                    Platform Module
                  </p>
                  <h2 className="text-lg font-semibold text-white">{module.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/64">{module.body}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[rgba(10,22,40,0.72)] p-6 backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-medium text-[#67E8F9]">لماذا هذا مهم؟</p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  المنشآت لا تحتاج أدوات كثيرة؛ تحتاج طبقة تشغيل واحدة
                </h2>
                <p className="mt-4 text-sm leading-8 text-white/62">
                  القيمة الأساسية في Blumark24 OS هي تحويل العمل المتفرق إلى خريطة تشغيل قابلة للمتابعة: من المكتب الافتراضي والهيكل الإداري إلى العملاء والمهام والتقارير.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {["Virtual Office", "Org Structure", "AI Agent", "Executive Reports"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-white/68"
                  >
                    <span className="mb-3 block h-1 w-10 rounded-full bg-gradient-to-l from-[#22D3EE] to-[#3B82F6]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <BlumarkLandingFooter />
    </>
  );
}
