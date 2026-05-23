"use client";

import PageGuard from "@/components/ui/PageGuard";
import CrmWorkspace from "@/components/crm/CrmWorkspace";

export default function ClientsPage() {
  return (
    <PageGuard permission="manage_clients">
      <CrmWorkspace />
    </PageGuard>
  );
}
