import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "مركز المعرفة | Blumark24 OS",
  description: "مركز معرفة Blumark24 OS للأعمال والذكاء الاصطناعي.",
};

export default function ResourcesPage() {
  return (
    <MarketingInfoPage
      eyebrow="الموارد"
      title="مركز معرفة مختصر وواضح"
      description="محتوى يساعد العميل على فهم المنصة، طريقة العمل، ومتى يحتاج إلى نظام تشغيل ذكي لأعماله."
      primaryAction={{ label: "اسأل الفريق", href: "/contact" }}
      secondaryAction={{ label: "الأسئلة الشائعة", href: "/faq" }}
      sections={[
        { title: "دليل المنصة", body: "شرح مبسط لفكرة Blumark24 OS والوحدات الأساسية داخل النظام." },
        { title: "دليل الأتمتة", body: "مفاهيم عملية حول أتمتة العمليات اليومية داخل المنشآت." },
        { title: "دليل الذكاء الاصطناعي", body: "كيف يستخدم الذكاء الاصطناعي في تحسين المتابعة وخدمة العملاء." },
        { title: "دليل التشغيل", body: "نصائح لتنظيم الفريق والعملاء والمهام في بيئة رقمية واحدة." },
      ]}
    />
  );
}
