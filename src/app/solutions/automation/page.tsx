import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "أتمتة العمليات | Blumark24 OS",
  description: "أتمتة تشغيلية للمهام والفرق داخل Blumark24 OS.",
};

export default function AutomationPage() {
  return (
    <MarketingInfoPage
      eyebrow="الحلول"
      title="أتمتة تقلل العمل اليدوي وتوضح المتابعة"
      description="نحوّل الإجراءات المتكررة إلى مسارات عمل أوضح تساعد الفرق على الإنجاز والمتابعة بدون تشتت بين أدوات متعددة."
      primaryAction={{ label: "ابدأ طلب الأتمتة", href: "/contact" }}
      secondaryAction={{ label: "مشاهدة الديمو", href: "/demo" }}
      sections={[
        { title: "تدفق مهام واضح", body: "ربط المهام بالحالات، المسؤوليات، والتنبيهات حتى يعرف كل عضو الخطوة التالية." },
        { title: "تقليل التكرار", body: "تقليل الإدخال اليدوي وتكرار المتابعة اليومية من خلال قواعد تشغيل منظمة." },
        { title: "رؤية تنفيذية", body: "تجميع المؤشرات المهمة للإدارة حتى تظهر حالة التشغيل بسرعة." },
        { title: "قابلية التوسع", body: "يمكن تطوير الأتمتة تدريجياً حسب حجم المنشأة ونضج عملياتها." },
      ]}
    />
  );
}
