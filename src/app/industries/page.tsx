import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "القطاعات | Blumark24 OS",
  description: "القطاعات التي تخدمها Blumark24 OS في السوق السعودي.",
};

export default function IndustriesPage() {
  return (
    <MarketingInfoPage
      eyebrow="القطاعات"
      title="حلول للأعمال التي تحتاج تشغيل أوضح"
      description="Blumark24 OS مناسبة للمنشآت التي تعتمد على العملاء، الفريق، المهام، والتقارير في تشغيلها اليومي."
      primaryAction={{ label: "ناقش قطاعك", href: "/contact" }}
      secondaryAction={{ label: "مشاهدة الديمو", href: "/demo" }}
      sections={[
        { title: "المطاعم والكافيهات", body: "تنظيم العملاء، الطلبات، المهام، والتواصل التشغيلي." },
        { title: "العيادات والمراكز", body: "تحسين المتابعة، تنظيم الفريق، وتسهيل التقارير التشغيلية." },
        { title: "المتاجر والخدمات", body: "إدارة العملاء والمهام اليومية بطريقة أوضح." },
        { title: "الشركات الصغيرة والمتوسطة", body: "تجربة موحدة تساعد الإدارة على رؤية العمل من مكان واحد." },
      ]}
    />
  );
}
