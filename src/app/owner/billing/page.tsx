import type { Metadata } from "next";
import OwnerBillingPageContent from "../_components/OwnerBillingPageContent";

export const metadata: Metadata = {
  title: "الفواتير والفوترة – Owner Command Center",
  description: "معاينة فوترة منصة Blumark24 — واجهة فقط، جاهزة للربط لاحقاً.",
};

export default function OwnerBillingPage() {
  return <OwnerBillingPageContent />;
}
