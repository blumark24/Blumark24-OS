import type { Metadata } from "next";
import OwnerPageContent from "./_components/OwnerPageContent";

export const metadata: Metadata = {
  title: "مركز قيادة Blumark24 – Owner Command Center",
  description: "لوحة خاصة بمالك منصة Blumark24 لإدارة العملاء والباقات والاشتراكات والاستخدام من مكان واحد.",
};

export default function OwnerPage() {
  return <OwnerPageContent />;
}
