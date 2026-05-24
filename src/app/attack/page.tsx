"use client";

import PageGuard from "@/components/ui/PageGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AgencyCommandPanel from "@/components/agency/AgencyCommandPanel";

export default function AttackPage() {
  return (
    <PageGuard permission="manage_clients">
      <DashboardLayout>
        <AgencyCommandPanel variant="page" />
      </DashboardLayout>
    </PageGuard>
  );
}
