"use client";

// VIRTUAL-OFFICE-DESIGN-2
// Isolated route — no imports from or to /org or SmartOrgBuilder.
// TODO: Gate virtual office by plan/features in a future PR.

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { WS_PAGE } from "@/components/ui/workspaceVisual";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useEmployees, useTasks } from "@/hooks/useData";
import VirtualOfficeDesign from "@/components/org/VirtualOfficeDesign";
import VirtualOfficeErrorBoundary from "@/components/org/VirtualOfficeErrorBoundary";

// ─── Content (hooks live here so errors stay catchable by the boundary) ───────

function VirtualOfficeContent({ onBack }: { onBack: () => void }) {
  const { data: snapshot, loading, error, refresh } = useOrgStructure(true);
  const { data: employees } = useEmployees();
  const { data: tasks } = useTasks();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-[#1e3a5f] p-12 text-center text-[#8ba3c7] text-sm animate-pulse"
        style={{ background: "rgba(10,22,40,0.6)" }}
      >
        جارٍ تحميل المكتب الافتراضي...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 p-6 text-red-400 text-sm space-y-3 bg-red-500/5" dir="rtl">
        <p>{error}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refresh()}
            className="btn-secondary text-sm min-h-10"
          >
            إعادة المحاولة
          </button>
          <Link href="/org" className="text-[#8ba3c7] hover:text-white text-sm transition-colors">
            الرجوع إلى الهيكل الإداري
          </Link>
        </div>
      </div>
    );
  }

  return (
    <VirtualOfficeDesign
      snapshot={snapshot}
      employees={employees ?? []}
      tasks={tasks ?? []}
      onBackToOrg={onBack}
      onRefresh={() => void handleRefresh()}
      isRefreshing={refreshing}
    />
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function VirtualOfficePage() {
  const router = useRouter();
  const handleBack = useCallback(() => router.push("/org"), [router]);

  return (
    <PageGuard permission="view_dashboard">
      <DashboardLayout>
        <div className={WS_PAGE}>
          <VirtualOfficeErrorBoundary onBack={handleBack}>
            <VirtualOfficeContent onBack={handleBack} />
          </VirtualOfficeErrorBoundary>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
