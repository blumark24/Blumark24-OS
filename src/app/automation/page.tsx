"use client";

import PageGuard from "@/components/ui/PageGuard";
import AutomationEngineWorkspace from "@/components/automation/AutomationEngineWorkspace";

export default function AutomationPage() {
  return (
    <PageGuard permission="manage_automations">
      <AutomationEngineWorkspace />
    </PageGuard>
  );
}
