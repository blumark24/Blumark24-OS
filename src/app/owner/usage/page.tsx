import type { Metadata } from "next";
import OwnerUsagePageContent from "../_components/OwnerUsagePageContent";

export const metadata: Metadata = {
  title: "الاستخدام والحدود – Owner Command Center",
  description: "معاينة استخدام الذكاء الاصطناعي وواتساب — واجهة فقط.",
};

export default function OwnerUsagePage() {
  return <OwnerUsagePageContent />;
}
