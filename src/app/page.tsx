import type { Metadata } from "next";
import MarketingLanding from "@/components/landing/MarketingLanding";
import BlumarkLandingFooter from "@/components/landing/BlumarkLandingFooter";

// `/` is a public marketing surface. It must remain renderable without any
// AuthContext / PermissionsContext / Supabase / Dashboard dependency so that
// the homepage is fast and resilient to backend or auth problems. Auth gating
// for `/dashboard` and other internal routes is handled by middleware.ts and
// the per-route guards.

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Blumark24 OS | منصة تشغيل ذكية لإدارة الأعمال",
  description:
    "منصة أعمال موحّدة لإدارة العملاء، الموظفين، المهام، التقارير، والأتمتة في تجربة تشغيل واحدة تساعد المنشآت على تنظيم العمليات ورفع كفاءة الأداء.",
  keywords: [
    "Blumark24",
    "Blumark24 OS",
    "منصة تشغيل ذكية",
    "منصة إدارة الأعمال",
    "نظام تشغيل الأعمال",
    "إدارة العملاء",
    "إدارة الموظفين",
    "إدارة المهام",
    "التقارير التشغيلية",
    "المساعد الذكي",
    "AI business OS",
    "Business operating system",
    "CRM",
  ],
  openGraph: {
    title: "Blumark24 OS | Smart Business Operating Platform",
    description:
      "A unified business operating platform for clients, employees, tasks, reports, and AI assistance.",
    siteName: "Blumark24 OS",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blumark24 OS | Smart Business Operating Platform",
    description:
      "A unified business operating platform for clients, employees, tasks, reports, and AI assistance.",
  },
};

export default function HomePage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: ".marketing-landing-root > footer { display: none; }",
        }}
      />
      <MarketingLanding />
      <BlumarkLandingFooter />
    </>
  );
}
