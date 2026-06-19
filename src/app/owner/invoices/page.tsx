import type { Metadata } from "next";
import OwnerInvoicesPageContent from "./_components/OwnerInvoicesPageContent";

export const metadata: Metadata = {
  title: "الفواتير – Owner Command Center",
  description: "سجل الفواتير والمدفوعات لمنشآت العملاء — واجهة قراءة فقط.",
};

export default function OwnerInvoicesPage() {
  return <OwnerInvoicesPageContent />;
}
