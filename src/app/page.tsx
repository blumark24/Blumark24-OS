import type { Metadata } from "next";
import MarketingLanding from "@/components/landing/MarketingLanding";
import LandingOSUpgrade from "@/components/landing/LandingOSUpgrade";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

// `/` is a public marketing surface.  It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems.  Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.

const landingRelease = "2026-06-26-os-layer-11";

export const metadata: Metadata = {
  title: "Blumark24 OS | نظام إدارة الأعمال بالذكاء الاصطناعي",
  description:
    "منصة عربية لإدارة الأعمال بالذكاء الاصطناعي تساعد الشركات على تنظيم الفرق، العملاء، المهام، المالية، التقارير، المكتب الافتراضي، والتوأم الرقمي من مكان واحد.",
  keywords: [
    "Blumark24",
    "Blumark24 OS",
    "نظام إدارة الأعمال",
    "إدارة الأعمال السعودية",
    "منصة الأعمال",
    "ذكاء اصطناعي للشركات",
    "المكتب الافتراضي",
    "التوأم الرقمي",
    "Digital Twin",
    "Virtual Office",
    "AI business management",
    "Saudi business platform",
    "Arabic business OS",
  ],
  openGraph: {
    title: "Blumark24 OS | AI Business Management System",
    description:
      "An Arabic-first AI business management platform for teams, clients, tasks, finance, reports, virtual office, and digital twin visibility.",
    siteName: "Blumark24 OS",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blumark24 OS | AI Business Management System",
    description:
      "An Arabic-first AI business management platform for teams, clients, tasks, finance, reports, virtual office, and digital twin visibility.",
  },
};

export default function HomePage() {
  return (
    <>
      <div className="landing-footer-upgrade" data-release={landingRelease}>
        <MarketingLanding />
      </div>
      <LandingOSUpgrade />
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
