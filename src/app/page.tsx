import type { Metadata } from "next";
import MarketingLanding from "@/components/landing/MarketingLanding";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

// `/` is a public marketing surface.  It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems.  Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.

export const metadata: Metadata = {
  title: "Blumark24 OS | نظام إدارة الأعمال بالذكاء الاصطناعي",
  description:
    "منصة عربية لإدارة الأعمال بالذكاء الاصطناعي تساعد الشركات على تنظيم الفرق، العملاء، المهام، المالية، والتقارير من مكان واحد.",
  keywords: [
    "Blumark24",
    "Blumark24 OS",
    "نظام إدارة الأعمال",
    "إدارة الأعمال السعودية",
    "منصة الأعمال",
    "ذكاء اصطناعي للشركات",
    "AI business management",
    "Saudi business platform",
    "Arabic business OS",
  ],
  openGraph: {
    title: "Blumark24 OS | AI Business Management System",
    description:
      "An Arabic-first AI business management platform for teams, clients, tasks, finance, reports, and operational visibility.",
    siteName: "Blumark24 OS",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blumark24 OS | AI Business Management System",
    description:
      "An Arabic-first AI business management platform for teams, clients, tasks, finance, reports, and operational visibility.",
  },
};

export default function HomePage() {
  return (
    <>
      <div className="landing-footer-upgrade">
        <MarketingLanding />
      </div>
      <BlumarkLandingFooter />
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".landing-footer-upgrade .marketing-landing-root > footer { display: none; }",
        }}
      />
    </>
  );
}
