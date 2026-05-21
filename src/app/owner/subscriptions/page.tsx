import type { Metadata } from "next";
import SubscriptionsPageContent from "./_components/SubscriptionsPageContent";

export const metadata: Metadata = {
  title: "الاشتراكات – Owner Command Center",
  description: "عرض اشتراكات منشآت منصة Blumark24 وحالتها — للقراءة فقط.",
};

export default function SubscriptionsPage() {
  return <SubscriptionsPageContent />;
}
