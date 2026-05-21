import type { Metadata } from "next";
import HeroCard from "./_components/HeroCard";
import KpiCards from "./_components/KpiCards";
import OrganizationsSection from "./_components/OrganizationsSection";
import PlansSection from "./_components/PlansSection";
import PlanLimitsPreview from "./_components/PlanLimitsPreview";
import AiUsageCard from "./_components/AiUsageCard";
import WhatsAppCard from "./_components/WhatsAppCard";
import ActivityTimeline from "./_components/ActivityTimeline";
import SystemStatusFooter from "./_components/SystemStatusFooter";

export const metadata: Metadata = {
  title: "مركز قيادة Blumark24 – Owner Command Center",
  description: "لوحة خاصة بمالك منصة Blumark24 لإدارة العملاء والباقات والاشتراكات والاستخدام من مكان واحد.",
};

export default function OwnerPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      {/* Page title */}
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          مركز قيادة <span className="gradient-text-teal">Blumark24</span>
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          لوحة خاصة بمالك المنصة لإدارة العملاء والباقات والاشتراكات والاستخدام من مكان واحد.
        </p>
      </header>

      {/* Hero */}
      <HeroCard />

      {/* KPIs */}
      <KpiCards />

      {/* Organizations */}
      <OrganizationsSection />

      {/* Plans */}
      <PlansSection />

      {/* Limits + AI + WhatsApp + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <PlanLimitsPreview />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AiUsageCard />
            <WhatsAppCard />
          </div>
        </div>
        <div className="xl:col-span-1">
          <ActivityTimeline />
        </div>
      </div>

      {/* System status footer */}
      <SystemStatusFooter />
    </div>
  );
}
