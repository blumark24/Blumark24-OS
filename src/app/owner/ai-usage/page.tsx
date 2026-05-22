import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import OwnerFeaturePlaceholderPage from "../_components/OwnerFeaturePlaceholderPage";

export const metadata: Metadata = {
  title: "استخدام الذكاء الاصطناعي – Owner Command Center",
  description: "معاينة مراقبة استخدام الذكاء الاصطناعي — واجهة فقط.",
};

export default function OwnerAiUsagePage() {
  return (
    <OwnerFeaturePlaceholderPage
      title="استخدام الذكاء الاصطناعي"
      description="مراقبة طلبات المساعد الذكي واستدعاءات النماذج لكل منشأة — معاينة واجهة جاهزة للربط لاحقاً."
      icon={Sparkles}
      accentClass="text-[#a855f7]"
    />
  );
}
