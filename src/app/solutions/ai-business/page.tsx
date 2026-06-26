import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "AI للأعمال | Blumark24 OS",
  description: "حلول ذكاء اصطناعي عملية للأعمال السعودية.",
};

export default function AiBusinessPage() {
  return (
    <MarketingInfoPage
      eyebrow="الحلول"
      title="ذكاء اصطناعي يخدم التشغيل والقرار"
      description="نساعد المنشآت على استخدام الذكاء الاصطناعي بطريقة عملية داخل رحلة العميل، متابعة الفريق، التقارير، والردود التشغيلية."
      primaryAction={{ label: "ناقش احتياجك", href: "/contact" }}
      secondaryAction={{ label: "مشاهدة الديمو", href: "/demo" }}
      sections={[
        { title: "مساعد ذكي للأعمال", body: "مساعد يساعد الفريق في فهم البيانات، تلخيص العمل، وتوجيه المستخدم للخطوة التالية." },
        { title: "تقارير أوضح", body: "تحويل المعلومات التشغيلية إلى مؤشرات أسهل للمتابعة واتخاذ القرار." },
        { title: "ردود منظمة", body: "بناء تجربة ردود أكثر احترافية للعملاء بدون عشوائية أو رسائل طويلة." },
        { title: "تشغيل قابل للقياس", body: "ربط الذكاء الاصطناعي بمخرجات عملية مثل العميل، المهمة، التقرير، والتنبيه." },
      ]}
    />
  );
}
