"use client";

// EXECUTIVE-OFFICE-VISUAL-1
// Tenant-aware Executive Virtual Office (Kumospace-inspired).
// Fixed 8-zone Executive Office Template. Read-only.
// Isolated route — no imports from or to /org or SmartOrgBuilder.
// TODO: Gate virtual office by plan/features in a future PR.
// TODO: EXECUTIVE-OFFICE-MAPPING-2 will let managers map rooms → org units.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { WS_PAGE } from "@/components/ui/workspaceVisual";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useEmployees, useTasks } from "@/hooks/useData";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { getTenantWorkspaceSettings } from "@/lib/db";
import VirtualOfficeDesign from "@/components/org/VirtualOfficeDesign";
import VirtualOfficeErrorBoundary from "@/components/org/VirtualOfficeErrorBoundary";

// ─── Content component (hooks isolated so errors are caught by boundary) ──────

function VirtualOfficeContent({ onBack }: { onBack: () => void }) {
  const { data: snapshot, loading, error, refresh } = useOrgStructure(true);
  const { data: employees } = useEmployees();
  // useTasks is safe here in the isolated /virtual-office page (not in /org)
  const { data: tasks } = useTasks();
  const { organizationId } = useTenantWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgCode, setOrgCode] = useState<string>("");

  // Fetch org/company identity from workspace settings (read-only)
  useEffect(() => {
    if (!organizationId) return;
    getTenantWorkspaceSettings(organizationId)
      .then((settings) => {
        const ci = settings?.company_info as Record<string, unknown> | undefined;
        const name = typeof ci?.name === "string" ? ci.name : "";
        const code = typeof ci?.code === "string"
          ? ci.code
          : typeof ci?.commercial_registration === "string"
            ? ci.commercial_registration
            : "";
        if (name) setOrgName(name);
        if (code) setOrgCode(code);
      })
      .catch(() => {
        // Safe fallback — orgName/orgCode stay ""
      });
  }, [organizationId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  if (loading) {
    return (
      <div
        className="rounded-2xl border border-[#1e3a5f] p-12 text-center text-[#8ba3c7] text-sm animate-pulse"
        style={{ background: "rgba(10,22,40,0.6)" }}
        dir="rtl"
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
          <button type="button" onClick={() => void refresh()} className="btn-secondary text-sm min-h-10">
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
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#22d3ee]/18 bg-[#0d1f3c]/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" dir="rtl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">مرتبط بخطة النمو</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#8ba3c7]">
              يمكن استخدام المكتب الافتراضي لمتابعة اجتماعات ومهام مراحل النمو بعد تحديدها في خطة النمو.
            </p>
          </div>
          <span className="w-fit rounded-full border border-cyan-300/22 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
            متابعة اجتماعات ومهام النمو
          </span>
        </div>
      </section>
      <VirtualOfficeDesign
        snapshot={snapshot}
        employees={employees ?? []}
        tasks={tasks ?? []}
        orgName={orgName}
        orgCode={orgCode}
        onBackToOrg={onBack}
        onRefresh={() => void handleRefresh()}
        isRefreshing={refreshing}
      />
    </div>
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
