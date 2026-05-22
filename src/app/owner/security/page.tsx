import type { Metadata } from "next";
import OwnerSecurityPageContent from "../_components/OwnerSecurityPageContent";

export const metadata: Metadata = {
  title: "الأمان والتدقيق – Owner Command Center",
  description: "معاينة مركز الأمان وسجل التدقيق — واجهة فقط.",
};

export default function OwnerSecurityPage() {
  return <OwnerSecurityPageContent />;
}
