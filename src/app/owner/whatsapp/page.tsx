import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import OwnerFeaturePlaceholderPage from "../_components/OwnerFeaturePlaceholderPage";

export const metadata: Metadata = {
  title: "واتساب بوت – Owner Command Center",
  description: "معاينة مراقبة واتساب بوت — واجهة فقط.",
};

export default function OwnerWhatsappPage() {
  return (
    <OwnerFeaturePlaceholderPage
      title="واتساب بوت"
      description="متابعة رسائل البوت وحجم الاستخدام لكل منشأة — معاينة واجهة جاهزة للربط لاحقاً."
      icon={MessageCircle}
      accentClass="text-[#34d399]"
    />
  );
}
