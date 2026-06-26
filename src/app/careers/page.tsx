import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const applyUrl = "https://forms.gle/1gGN14qAjEYVQkD58";
const nominationSheetUrl = "https://docs.google.com/spreadsheets/d/1X1PjfCxiKK8Hp83521Y9i1pRX1uipQssNK2aK9kHMSA/edit?usp=drivesdk";

const skillMatrix = [
  "Digital Twin",
  "AI Content",
  "Growth Marketing",
  "Reels Production",
  "Canva / CapCut",
  "Automation",
  "Analytics",
  "Product Thinking",
];

const tracks = [
  { title: "Content & Growth", body: "صناعة محتوى، إدارة منصات، أفكار نمو، وتجارب تسويقية سريعة." },
  { title: "Digital Twin & OS", body: "فهم تجربة المنصة، الهيكل الإداري، المكتب الافتراضي، وربط التشغيل بالبيانات." },
  { title: "Engineering", body: "تطوير المنصة، تحسين الواجهات، ربط الأدوات، ودعم تجربة SaaS احترافية." },
  { title: "Business Partners", body: "علاقات، فرص سوقية، شراكات، وترشيح عملاء أو أعضاء فريق مناسبين." },
];

export const metadata: Metadata = {
  title: "التوظيف والترشيح | Blumark24 OS",
  description: "فرص التوظيف والترشيح والشراكات التشغيلية في منصة Blumark24.",
};

export default function CareersPage() {
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
            "radial-gradient(circle at 12% 8%, rgba(34,211,238,0.18), transparent 28%), radial-gradient(circle at 88% 18%, rgba(59,130,246,0.14), transparent 32%), radial-gradient(circle at 50% 78%, rgba(14,165,233,0.10), transparent 35%), linear-gradient(180deg, #050816, #0A1628)",
        }}
      />

      <div className="mx-auto max-w-7xl">
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
                التوظيف والترشيح · Digital Twin Talent Layer
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                انضم إلى منصة Blumark24
              </h1>
              <p className="mt-6 max-w-4xl text-sm leading-8 text-white/68 sm:text-base">
                Blumark24 منصة سعودية متخصصة في حلول الذكاء الاصطناعي، الأتمتة، أنظمة إدارة الأعمال، التسويق الرقمي، وصناعة المحتوى الحديث. نبحث عن أشخاص وشركاء يساعدوننا في بناء حضور قوي ومنتج قابل للنمو في السوق السعودي.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <a
                  href={applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] px-5 text-sm font-medium text-white shadow-[0_16px_44px_rgba(34,211,238,0.22)] transition hover:brightness-110"
                >
                  نموذج التقديم
                </a>
                <a
                  href={nominationSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 text-sm font-medium text-white/72 transition hover:text-white"
                >
                  التوظيف والترشيح
                </a>
                <Link
                  href="/partners"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 text-sm font-medium text-white/72 transition hover:text-white"
                >
                  الشراكات والاستثمار
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-5 text-sm font-medium text-white/72 transition hover:text-white"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>

            <div className="relative min-h-[360px] rounded-[2rem] border border-white/[0.10] bg-[#061225]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="absolute inset-6 rounded-full border border-[#22D3EE]/15" />
              <div className="absolute inset-14 rounded-full border border-[#3B82F6]/15" />
              <div className="absolute inset-24 rounded-full border border-white/[0.08]" />
              <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/42">TALENT OPERATING MAP</p>
                    <h2 className="mt-1 text-lg font-semibold text-white">Blumark24 Growth Room</h2>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Open
                  </div>
                </div>

                <div className="relative mx-auto my-5 flex h-40 w-40 items-center justify-center rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 shadow-[0_0_70px_rgba(34,211,238,0.20)]">
                  <div className="absolute h-24 w-24 rounded-full border border-[#22D3EE]/30" />
                  <div className="text-center">
                    <p className="text-xs text-[#67E8F9]">AI Team</p>
                    <p className="mt-1 text-sm font-semibold text-white">Growth OS</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {skillMatrix.slice(0, 6).map((skill) => (
                    <div
                      key={skill}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-xs text-white/68"
                    >
                      <span className="mb-2 block h-1 w-8 rounded-full bg-[#22D3EE]/70" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          {tracks.map((track) => (
            <article
              key={track.title}
              className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.58)] p-6 backdrop-blur-xl"
            >
              <p className="text-xs font-medium text-[#67E8F9]">Talent Track</p>
              <h2 className="mt-3 text-lg font-semibold text-white">{track.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/64">{track.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">AI Content & Growth Operator</h2>
            <p className="mt-3 text-sm leading-7 text-white/64">
              دور يجمع بين إدارة السوشال ميديا، صناعة المحتوى، إنتاج Reels، استخدام أدوات الذكاء الاصطناعي، وبناء أفكار Growth تساعد المنصة على النمو.
            </p>
          </article>

          <article className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">من نبحث عنه؟</h2>
            <p className="mt-3 text-sm leading-7 text-white/64">
              نرحب بالمتفرغين، صناع المحتوى، المسوقين، المهندسين، رواد الأعمال، المتدربين، والشركاء الذين يستطيعون تقديم قيمة عملية واضحة للمنصة.
            </p>
          </article>

          <article className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">مرحلة التأسيس</h2>
            <p className="mt-3 text-sm leading-7 text-white/64">
              البداية بفترة تجربة ومكافأة رمزية، مع فرصة للنمو داخل الفريق بالتزامن مع توسع Blumark24 وزيادة العملاء والشراكات.
            </p>
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] p-6 backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-white">المهام والمهارات المطلوبة</h2>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-white/64 sm:grid-cols-2">
            <p>إدارة حسابات التواصل الاجتماعي وإعداد خطة محتوى شهرية.</p>
            <p>كتابة محتوى تسويقي حديث وإنتاج Reels وفيديوهات قصيرة.</p>
            <p>تصميم الصور والمحتوى باستخدام أدوات الذكاء الاصطناعي.</p>
            <p>زيادة المتابعين والتفاعل وبناء حضور رقمي قوي.</p>
            <p>فهم Digital Twin وربط المحتوى بصورة المنصة التشغيلية.</p>
            <p>متابعة الترندات وتطوير أفكار Growth وتسويق مبتكرة.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
