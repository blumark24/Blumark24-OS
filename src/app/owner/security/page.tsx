import type { Metadata } from "next";
import OwnerSecurityPageContent from "./_components/OwnerSecurityPageContent";

export const metadata: Metadata = {
  title: "مركز التدقيق والمراقبة – Owner Command Center",
  description: "متابعة جميع عمليات المالك والاشتراكات والباقات والحذف والأمان.",
};

export default function OwnerSecurityPage() {
  return <OwnerSecurityPageContent />;
}
