import type { Metadata } from "next";
import OwnerSettingsPageContent from "./_components/OwnerSettingsPageContent";

export const metadata: Metadata = {
  title: "الإعدادات – Owner Command Center",
  description: "إعدادات المنصة العامة والتكاملات الخارجية.",
};

export default function OwnerSettingsPage() {
  return <OwnerSettingsPageContent />;
}
