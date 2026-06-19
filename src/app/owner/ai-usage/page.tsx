import type { Metadata } from "next";
import OwnerAiUsagePageContent from "./_components/OwnerAiUsagePageContent";

export const metadata: Metadata = {
  title: "استخدام الذكاء الاصطناعي – Owner Command Center",
  description: "مراقبة استهلاك الذكاء الاصطناعي عبر منشآت العملاء — واجهة قراءة فقط.",
};

export default function OwnerAiUsagePage() {
  return <OwnerAiUsagePageContent />;
}
