import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "تواصل معنا | Blumark24 OS",
  description: "تواصل مع فريق Blumark24.",
};

export default function ContactPage() {
  return (
    <MarketingInfoPage
      eyebrow="التواصل"
      title="تحدث مع فريق Blumark24"
      description="أرسل احتياجك بشكل واضح، وسيتم تحديد المسار الأنسب لك: تجربة منصة، باقة تشغيل، حل ذكاء اصطناعي، أو أتمتة أعمال."
      primaryAction={{ label: "فتح الديمو", href: "/demo" }}
      secondaryAction={{ label: "تسجيل الدخول", href: "/auth" }}
      sections={[
        { title: "ماذا تكتب؟", body: "اكتب نوع نشاطك، عدد الفريق، وأهم مشكلة تشغيلية تريد حلها." },
        { title: "متى تحتاج Blumark24؟", body: "عندما تكون بيانات العملاء والمهام والتقارير موزعة بين أدوات كثيرة." },
        { title: "الخطوة التالية", body: "بعد مراجعة الاحتياج يتم تحديد الحل أو الباقة المناسبة." },
        { title: "قنوات التواصل", body: "يمكن ربط هذه الصفحة لاحقاً بنموذج رسمي أو واتساب أعمال أو بريد الشركة." },
      ]}
    />
  );
}
