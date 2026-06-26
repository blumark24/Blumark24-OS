import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "التسعير | Blumark24 OS",
  description: "باقات Blumark24 OS.",
};

export default function PricingPage() {
  return (
    <MarketingInfoPage
      eyebrow="التسعير"
      title="باقات منظمة حسب احتياج المنشأة"
      description="صفحة تعريفية مختصرة تساعد العميل على فهم خيارات Blumark24 OS قبل طلب العرض المناسب."
      primaryAction={{ label: "طلب عرض", href: "/contact" }}
      secondaryAction={{ label: "مشاهدة الديمو", href: "/demo" }}
      sections={[
        { title: "أساسي", body: "لبداية منظمة في إدارة العمل اليومي والفرق الصغيرة." },
        { title: "نمو", body: "للمنشآت التي تحتاج إدارة أوسع للعملاء والمهام والتقارير." },
        { title: "متقدم", body: "لتجربة تشغيل أعمق تشمل مزايا متقدمة ومتابعة تنفيذية." },
        { title: "مؤسسي", body: "للجهات التي تحتاج تهيئة خاصة وتجربة مخصصة حسب المتطلبات." },
      ]}
    />
  );
}
