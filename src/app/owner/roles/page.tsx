import type { Metadata } from "next";
import OwnerRolesPageContent from "./_components/OwnerRolesPageContent";

export const metadata: Metadata = {
  title: "الصلاحيات والأدوار – Owner Command Center",
  description: "إدارة أدوار وصلاحيات مالك المنصة — واجهة قراءة فقط.",
};

export default function OwnerRolesPage() {
  return <OwnerRolesPageContent />;
}
