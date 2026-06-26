import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "الشراكات | Blumark24 OS",
  description: "فرص التعاون مع منصة Blumark24.",
};

export default function PartnersPage() {
  return (
    <MarketingInfoPage
      eyebrow="الشراكات"
      title="شركاء يساعدون Blumark24 على النمو"
      description="Blumark24 منصة سعودية في مرحلة النمو. نرحب برواد الأعمال، المهندسين، الشركاء التشغيليين، المتدربين، والمتفرغين الذين يستطيعون تقديم قيمة عملية للمنصة والعملاء."
      primaryAction={{ label: "تواصل للشراكة", href: "/contact" }}
      secondaryAction={{ label: "التوظيف والترشيح", href: "/careers" }}
      sections={[
        { title: "شركاء نمو", body: "لمن يملك خبرة سوقية أو علاقات أو قدرة على فتح فرص جديدة." },
        { title: "رواد أعمال", body: "لمن يستطيع تحويل الأفكار إلى مسارات عمل واضحة وقابلة للتنفيذ." },
        { title: "مهندسون وتقنيون", body: "لمن يستطيع تطوير المنتج أو تحسين التجربة أو بناء تكاملات مفيدة." },
        { title: "متدربون ومتفرغون", body: "لمن يريد التعلم والعمل بجدية داخل مشروع قابل للنمو." },
      ]}
    />
  );
}
