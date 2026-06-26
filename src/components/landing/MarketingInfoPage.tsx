import Link from "next/link";
import OfficialBlumarkLogo from "@/components/brand/OfficialBlumarkLogo";

type InfoSection = {
  title: string;
  body: string;
};

type MarketingInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  sections: InfoSection[];
};

export default function MarketingInfoPage({
  eyebrow,
  title,
  description,
  primaryAction = { label: "اطلب عرضًا تجريبيًا", href: "/contact" },
  secondaryAction = { label: "العودة للرئيسية", href: "/" },
  sections,
}: MarketingInfoPageProps) {
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

        <section className="rounded-3xl border border-white/[0.10] bg-[rgba(10,22,40,0.72)] p-6 backdrop-blur-xl sm:p-9 lg:p-11">
          <p className="text-sm font-medium text-[#22D3EE]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/68 sm:text-base">
            {description}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryAction.href}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-l from-[#1E6FD9] via-[#3B82F6] to-[#22D3EE] px-6 text-sm font-medium text-white transition hover:brightness-110"
            >
              {primaryAction.label}
            </Link>
            <Link
              href={secondaryAction.href}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] px-6 text-sm font-medium text-white/72 transition hover:text-white"
            >
              {secondaryAction.label}
            </Link>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-white/[0.08] bg-[rgba(10,22,40,0.55)] p-6 backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/64">{section.body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
