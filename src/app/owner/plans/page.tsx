import type { Metadata } from "next";
import PlansPageContent from "./_components/PlansPageContent";

export const metadata: Metadata = {
  title: "الباقات – Owner Command Center",
  description: "عرض باقات منصة Blumark24 وحدودها — للقراءة فقط.",
};

export default function PlansPage() {
  return <PlansPageContent />;
}
