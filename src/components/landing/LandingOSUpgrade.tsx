import Link from "next/link";

const cards = [
  {
    title: "المكتب الافتراضي",
    body: "تمثيل بصري للإدارات والغرف داخل المنشأة، مرتبط بالهيكل الإداري والصلاحيات.",
    tag: "Virtual Office",
  },
  {
    title: "الهيكل الإداري",
    body: "تنظيم الإدارات والأقسام والموظفين في خريطة إدارية واضحة.",
    tag: "Org Structure",
  },
  {
    title: "المساعد الذكي",
    body: "مساعدة الإدارة في التلخيص، المتابعة، وقراءة مؤشرات العمل اليومية.",
    tag: "AI Assistant",
  },
  {
    title: "التقارير التنفيذية",
    body: "عرض مؤشرات العملاء، المهام، النمو، والأداء في لوحة واضحة.",
    tag: "Executive Reports",
  },
];

export default function LandingOSUpgrade() {
  return (
    <section dir="rtl" className="relative overflow-hidden bg-[#050816] px-4 py-16 text-white sm:px-6 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(34,211,238,0.16), transparent 32%), radial-gradient(circle at 88% 28%, rgba(59,130,246,0.13), transparent 36%), linear-gradient(180deg, rgba(5,8,22,0.99), rgba(10,22,40,0.97))",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-2 text-xs font-semibold text-[#67E8F9] backdrop-blur-md">
              Blumark24 OS · Digital Twin Layer
            </div>
            <h2 className="mt-6 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              نسخة تشغيل رقمية لمنشأتك من داخل لوحة واحدة
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-white/66 sm:text-base">
              تربط Blumark24 OS المكتب الافتراضي، الهيكل الإداري، العملاء، المهام، التقارير، والمساعد الذكي في تجربة واحدة تساعد الإدارة على الوضوح وسرعة القرار.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/platform" className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] px-6 text-sm font-semibold text-white">
                شاهد منصة Blumark24 OS
              </Link>
              <Link href="/demo" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-6 text-sm font-semibold text-white/72">
                تجربة الديمو التفاعلي
              </Link>
            </div>
          </div>

          <div className="relative min-h-[360px] rounded-[2rem] border border-white/[0.10] bg-[#061225]/80 p-5 backdrop-blur-xl">
            <div className="absolute inset-6 rounded-full border border-[#22D3EE]/15" />
            <div className="absolute inset-14 rounded-full border border-[#3B82F6]/15" />
            <div className="absolute inset-24 rounded-full border border-white/[0.08]" />
            <div className="relative z-10 flex min-h-[320px] flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-white/42">CLIENT OPERATING MAP</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Virtual Office Twin</h3>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  Active
                </span>
              </div>

              <div className="relative mx-auto my-5 flex h-40 w-40 items-center justify-center rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 shadow-[0_0_70px_rgba(34,211,238,0.20)]">
                <div className="absolute h-24 w-24 rounded-full border border-[#22D3EE]/30" />
                <div className="text-center">
                  <p className="text-xs text-[#67E8F9]">OFFICE 09</p>
                  <p className="mt-1 text-sm font-semibold text-white">Executive Hub</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {["Clients", "Teams", "Tasks", "Finance", "Reports", "AI"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-xs text-white/68">
                    <span className="mb-2 block h-1 w-8 rounded-full bg-[#22D3EE]/70" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-6 backdrop-blur-xl">
              <p className="mb-3 inline-flex rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1 text-[11px] text-[#67E8F9]">
                {card.tag}
              </p>
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/64">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
