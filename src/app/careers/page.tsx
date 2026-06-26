import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "الوظائف | Blumark24 OS",
  description: "فرص الانضمام إلى Blumark24.",
};

export default function CareersPage() {
  return (
    <MarketingInfoPage
      eyebrow="الوظائف"
      title="فرص الانضمام إلى Blumark24"
      description="صفحة مخصصة للتعريف بالمسارات التي قد تحتاجها Blumark24 أثناء النمو والتوسع."
      primaryAction={{ label: "تواصل معنا", href: "/contact" }}
      secondaryAction={{ label: "عن الشركة", href: "/about" }}
      sections={[
        { title: "التسويق", body: "المحتوى والحضور الرقمي." },
        { title: "المبيعات", body: "التواصل مع العملاء وفهم احتياجهم." },
        { title: "التنفيذ", body: "متابعة العمل وضبط الجودة." },
        { title: "التقنية", body: "تطوير وتحسين المنصة." },
      ]}
    />
  );
}
