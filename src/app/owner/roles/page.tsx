import type { Metadata } from "next";
import OwnerRolesPageContent from "./_components/OwnerRolesPageContent";

export const metadata: Metadata = {
  title: "الصلاحيات والأدوار – Owner Command Center",
  description: "إدارة صلاحيات مالكي المنصة والأدوار المميزة.",
};

export default function OwnerRolesPage() {
  return <OwnerRolesPageContent />;
}
