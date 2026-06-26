import type { Metadata } from "next";
import MarketingInfoPage from "@/components/landing/MarketingInfoPage";

export const metadata: Metadata = {
  title: "إدارة العملاء | Blumark24 OS",
  description: "تنظيم بيانات العملاء داخل Blumark24 OS.",
};

export default function CustomerManagementPage() {
  return (
    <MarketingInfoPage
      eyebrow="الحلول"
      title="إدارة العملاء من مكان واحد"
      description="تساعد Blumark24 OS المنشآت على تنظيم بيانات العملاء، المتابعة، وسير العمل اليومي في تجربة واحدة واضحة."
      primaryAction={{ label: "طلب تجربة", href: "/contact" }}
      secondaryAction={{ label: "مشاهدة الديمو", href: "/demo" }}
      sections={[
        { title: "بيانات العملاء", body: "حفظ معلومات العملاء وسجل التواصل في مكان واضح وسهل الوصول." },
        { title: "متابعة منظمة", body: "تنظيم حالات العملاء وربطها بالمهام اليومية للفريق." },
        { title: "رؤية إدارية", body: "توفير مؤشرات تساعد الإدارة على فهم حركة العملاء بصورة أبسط." },
        { title: "قابلية التطوير", body: "يمكن تطوير التجربة وربطها بوحدات أخرى حسب احتياج المنشأة." },
      ]}
    />
  );
}
