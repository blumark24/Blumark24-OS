import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "الشراكات | Blumark24 OS",
  description: "الشراكات والتعاون مع Blumark24.",
};

export default function PartnersPage() {
  return (
    <MarketingInfoPage
      eyebrow="الشراكات"
      title="نبني شراكات تشغيلية وتقنية"
      description="تفتح Blumark24 المجال للتعاون مع مزودي الخدمات، فرق التنفيذ، والاستشاريين الذين يخدمون الأعمال بجدية واحترافية."
      primaryAction={{ label: "قدّم طلب شراكة", href: "/contact" }}
      secondaryAction={{ label: "عن الشركة", href: "/about" }}
      sections={[
        { title: "شركاء التنفيذ", body: "للفرق التي تساعد العملاء على تطبيق الحلول الرقمية." },
        { title: "شركاء التسويق", body: "للوكالات والمستقلين الذين يخدمون السوق المحلي." },
        { title: "شركاء التقنية", body: "للمطورين ومزودي الأدوات التي تدعم تجربة العملاء." },
        { title: "آلية التواصل", body: "ابدأ من صفحة التواصل وسيتم مراجعة نوع الشراكة المناسب." },
      ]}
    />
  );
}
