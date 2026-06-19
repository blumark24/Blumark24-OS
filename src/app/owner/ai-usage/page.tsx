import type { Metadata } from "next";
import OwnerAiUsagePageContent from "./_components/OwnerAiUsagePageContent";

export const metadata: Metadata = {
  title: "استخدام الذكاء الاصطناعي – Owner Command Center",
  description: "مراقبة استخدام ميزات الذكاء الاصطناعي عبر منشآت العملاء.",
};

export default function OwnerAiUsagePage() {
  return <OwnerAiUsagePageContent />;
}
