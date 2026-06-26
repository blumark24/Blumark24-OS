import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "المنصة | Blumark24 OS",
  description: "تعرف على منصة Blumark24 OS لإدارة الأعمال بالذكاء الاصطناعي.",
};

export default function PlatformPage() {
  return (
    <MarketingInfoPage
      eyebrow="المنتج"
      title="Blumark24 OS — نظام تشغيل ذكي للأعمال"
      description="منصة سعودية تساعد المنشآت على إدارة العملاء، الموظفين، المهام، المالية، والتقارير من تجربة واحدة مصممة للسوق السعودي بمعايير SaaS عالمية."
      primaryAction={{ label: "استكشف الديمو", href: "/demo" }}
      secondaryAction={{ label: "تواصل مع الفريق", href: "/contact" }}
      sections={[
        { title: "لوحة تشغيل واحدة", body: "تجمع المنصة الوحدات الأساسية للأعمال في واجهة واحدة تقلل التشتت وتزيد وضوح القرار." },
        { title: "مصممة للسوق السعودي", body: "واجهة عربية RTL وتجربة مبنية على احتياج المنشآت المحلية، من الفرق الصغيرة إلى الشركات التشغيلية." },
        { title: "AI عملي", body: "الذكاء الاصطناعي داخل Blumark24 يركز على القرار، التنظيم، المتابعة، وتقليل العمل اليدوي." },
        { title: "جاهزة للنمو", body: "الهيكل قابل للتوسع عبر الباقات، الصلاحيات، والتقارير حتى تتحول المنصة إلى مركز تشغيل للأعمال." },
      ]}
    />
  );
}
