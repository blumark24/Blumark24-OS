import Link from "next/link";
import LandingHeader from "./LandingHeader";
import LandingHero from "./LandingHero";
import LandingModules from "./LandingModules";
import LandingBusinessOutcomes from "./LandingBusinessOutcomes";
import LandingFinalCta from "./LandingFinalCta";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#081126,#050816_55%)]" />
        <div className="absolute inset-0 animate-mesh-shift opacity-85" style={{ backgroundImage: "radial-gradient(circle at 18% 14%, rgba(34,211,238,.22), transparent 38%), radial-gradient(circle at 84% 22%, rgba(59,130,246,.20), transparent 44%), radial-gradient(circle at 52% 78%, rgba(255,122,61,.11), transparent 48%), radial-gradient(circle at 70% 58%, rgba(34,211,238,.10), transparent 40%)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(90,220,255,0.20),transparent_40%)] blur-3xl" />
      </div>
      <LandingHeader />
      <LandingHero />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6" id="features">
        <h2 className="text-2xl font-bold">المشكلة والحل</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-orange-300/20 bg-white/[0.03] p-5"><h3 className="mb-3 text-lg font-semibold text-orange-300">المشكلة</h3><ul className="space-y-2 text-white/80"><li>تشتت الأدوات.</li><li>ضعف متابعة الفريق.</li><li>بطء التقارير.</li><li>صعوبة معرفة أداء المنشأة لحظياً.</li></ul></div>
          <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-5"><h3 className="mb-3 text-lg font-semibold text-cyan-300">الحل</h3><p className="text-white/80">منصة موحدة تساعد صاحب المنشأة على رؤية العملاء، المهام، الموظفين، المالية، والتقارير من مكان واحد.</p></div>
        </div>
      </section>
      <LandingModules />
      <LandingBusinessOutcomes />
      <section id="demo" className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="rounded-3xl border border-white/15 bg-white/[0.05] p-7 backdrop-blur-xl"><h3 className="text-2xl font-bold">جرّب المنصة كما يراها المدير التنفيذي</h3><p className="mt-3 text-white/75">شاهد تجربة تفاعلية توضح كيف يمكن للمنشأة متابعة العملاء، الفريق، المهام، والمؤشرات من شاشة واحدة.</p><Link href="/demo" className="mt-5 inline-block rounded-xl bg-gradient-to-l from-[#1E6FD9] to-[#22D3EE] px-6 py-3">عرض تجريبي</Link></div></section>
      <LandingFinalCta />
    </main>
  );
}
