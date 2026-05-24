"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import OrgCommandBoard from "@/components/org/OrgCommandBoard";

export default function OrgPage() {
  return (
    <PageGuard permission="view_dashboard">
      <DashboardLayout>
        <OrgCommandBoard />
      </DashboardLayout>
    </PageGuard>
  );
}
