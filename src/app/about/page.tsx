import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "عن Blumark24 | Blumark24 OS",
  description: "تعريف مختصر بشركة Blumark24.",
};

export default function AboutPage() {
  return (
    <MarketingInfoPage
      eyebrow="الشركة"
      title="عن Blumark24"
      description="Blumark24 تبني حلولاً رقمية تساعد المنشآت على تنظيم العمل اليومي وإدارة العمليات من مكان واحد."
      primaryAction={{ label: "تواصل معنا", href: "/contact" }}
      secondaryAction={{ label: "استكشف المنصة", href: "/platform" }}
      sections={[
        { title: "الرؤية", body: "بناء تجربة تشغيل أوضح للأعمال." },
        { title: "الرسالة", body: "تنظيم العملاء والفرق والمهام والتقارير في نظام واحد." },
        { title: "الهوية", body: "تجربة عربية احترافية مصممة للأعمال." },
        { title: "القيمة", body: "تقليل التشتت وتحسين وضوح المتابعة." },
      ]}
    />
  );
}
