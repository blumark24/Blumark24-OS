"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import OrgCommandBoard from "@/components/org/OrgCommandBoard";

export default function OrgPage() {
  return (
    <PageGuard permission="view_dashboard" anyOf={["view_dashboard", "manage_board"]}>
      <DashboardLayout>
        <OrgCommandBoard />
      </DashboardLayout>
    </PageGuard>
  );
}
