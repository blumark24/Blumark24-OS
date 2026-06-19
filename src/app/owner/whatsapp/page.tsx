import type { Metadata } from "next";
import OwnerWhatsappPageContent from "./_components/OwnerWhatsappPageContent";

export const metadata: Metadata = {
  title: "واتساب بوت – Owner Command Center",
  description: "مراقبة تكامل واتساب بوت عبر المنشآت — واجهة قراءة فقط.",
};

export default function OwnerWhatsappPage() {
  return <OwnerWhatsappPageContent />;
}
