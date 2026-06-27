import type { Metadata } from "next";
import "./preview.css";
import MobilePhoneFrame from "@/components/design-preview/blumark-mobile/MobilePhoneFrame";
import AnimatedBackground from "@/components/design-preview/blumark-mobile/AnimatedBackground";
import MobileTopBar from "@/components/design-preview/blumark-mobile/MobileTopBar";
import PackageWelcomeCard from "@/components/design-preview/blumark-mobile/PackageWelcomeCard";
import KpiGrid from "@/components/design-preview/blumark-mobile/KpiGrid";
import QuickActionsStrip from "@/components/design-preview/blumark-mobile/QuickActionsStrip";
import RevenueChartCard from "@/components/design-preview/blumark-mobile/RevenueChartCard";
import AiAssistantCard from "@/components/design-preview/blumark-mobile/AiAssistantCard";
import ActivityCard from "@/components/design-preview/blumark-mobile/ActivityCard";
import TasksTodayCard from "@/components/design-preview/blumark-mobile/TasksTodayCard";
import BottomNav from "@/components/design-preview/blumark-mobile/BottomNav";

export const metadata: Metadata = {
  title: "Blumark24 Mobile Dashboard — Design Preview",
  description:
    "Visual preview only. Pixel-close reconstruction of the approved Blumark24 mobile dashboard reference. Not connected to data.",
  robots: { index: false, follow: false },
};

export default function BlumarkMobileDesignPreviewPage() {
  return (
    <MobilePhoneFrame bottomNav={<BottomNav />}>
      <div className="relative min-h-full">
        <AnimatedBackground />

        <div className="relative z-10">
          <MobileTopBar />

          <div className="px-3.5 pb-4 flex flex-col gap-3">
            <PackageWelcomeCard />
            <KpiGrid />
            <QuickActionsStrip />
            <RevenueChartCard />
            <AiAssistantCard />
            <div className="grid grid-cols-2 gap-3">
              <ActivityCard />
              <TasksTodayCard />
            </div>
          </div>
        </div>
      </div>
    </MobilePhoneFrame>
  );
}
