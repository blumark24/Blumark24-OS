import type { Metadata } from "next";
import OrganizationsPageContent from "./_components/OrganizationsPageContent";

export const metadata: Metadata = {
  title: "المنشآت – Owner Command Center",
  description: "إدارة المنشآت المشتركة في منصة Blumark24.",
};

export default function OrganizationsPage() {
  return <OrganizationsPageContent />;
}
