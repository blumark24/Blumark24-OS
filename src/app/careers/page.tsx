import type { Metadata } from "next";
import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

const applyUrl = "https://forms.gle/1gGN14qAjEYVQkD58";
const nominationSheetUrl = "https://docs.google.com/spreadsheets/d/1X1PjfCxiKK8Hp83521Y9i1pRX1uipQssNK2aK9kHMSA/edit?usp=drivesdk";

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
            "radial-gradient(circle at 12% 8%, rgba(34,211,238,0.16), transparent 28%), radial-gradient(circle at 88% 18%, rgba(59,130,246,0.12), transparent 32%), linear-gradient(180deg, #050816, #0A1628)",
        }}
      />

      <div className="mx-auto max-w-6xl">
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

        <section className="rounded-3xl border border-white/[0.10] bg-[rgba(10,22,40,0.72)] p-6 backdrop-blur-xl sm:p-9 lg:p-11">
          <p className="text-sm font-medium text-[#22D3EE]">التوظيف والترشيح</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight sm:text-5xl">
            انضم إلى منصة Blumark24
          </h1>
          <p className="mt-5 max-w-4xl text-sm leading-8 text-white/68 sm:text-base">
            Blumark24 منصة سعودية متخصصة في حلول الذكاء الاصطناعي، الأتمتة، أنظمة إدارة الأعمال، التسويق الرقمي، وصناعة المحتوى الحديث. نبحث عن أشخاص وشركاء يساعدوننا في بناء حضور قوي ومنتج قابل للنمو في السوق السعودي.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] px-5 text-sm font-medium text-white transition hover:brightness-110"
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
          <h2 className="text-xl font-semibold text-white">المهام الرئيسية</h2>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-white/64 sm:grid-cols-2">
            <p>إدارة حسابات التواصل الاجتماعي وإعداد خطة محتوى شهرية.</p>
            <p>كتابة محتوى تسويقي حديث وإنتاج Reels وفيديوهات قصيرة.</p>
            <p>تصميم الصور والمحتوى باستخدام أدوات الذكاء الاصطناعي.</p>
            <p>زيادة المتابعين والتفاعل وبناء حضور رقمي قوي.</p>
            <p>الرد على الرسائل والتفاعل مع المتابعين بشكل احترافي.</p>
            <p>متابعة الترندات وتطوير أفكار Growth وتسويق مبتكرة.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
