import type { Metadata } from "next";
import OwnerWhatsappPageContent from "./_components/OwnerWhatsappPageContent";

export const metadata: Metadata = {
  title: "واتساب بوت – Owner Command Center",
  description: "إدارة ربط WhatsApp Business API لمنشآت العملاء.",
};

export default function OwnerWhatsappPage() {
  return <OwnerWhatsappPageContent />;
}
