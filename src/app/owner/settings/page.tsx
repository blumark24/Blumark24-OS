import type { Metadata } from "next";
import OwnerSettingsPageContent from "./_components/OwnerSettingsPageContent";

export const metadata: Metadata = {
  title: "الإعدادات – Owner Command Center",
  description: "إعدادات مركز القيادة لمالك المنصة.",
};

export default function OwnerSettingsPage() {
  return <OwnerSettingsPageContent />;
}
