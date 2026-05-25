import type { Metadata } from "next";
import OrganizationDetailPageContent from "./_components/OrganizationDetailPageContent";

export const metadata: Metadata = {
  title: "تفاصيل المنشأة – Owner Command Center",
  description: "عرض قراءة فقط لبيانات منشأة مشتركة في منصة Blumark24.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  return <OrganizationDetailPageContent orgId={id} />;
}
