import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Blumark24 OS | نظام إدارة الأعمال بالذكاء الاصطناعي",
  description: "منصة سعودية ذكية لإدارة العملاء، الموظفين، المهام، المالية، التقارير، والأتمتة للمنشآت.",
  keywords: "نظام إدارة أعمال بالذكاء الاصطناعي، منصة إدارة منشآت سعودية، أتمتة الأعمال، CRM عربي، إدارة الموظفين، إدارة المهام، تقارير ذكية، حلول ذكاء اصطناعي للشركات السعودية",
};

export default function HomePage() {
  return <LandingPage />;
}
