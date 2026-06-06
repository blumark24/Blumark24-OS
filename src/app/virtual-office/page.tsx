"use client";

// VIRTUAL-OFFICE-MAIN-ROUTE-1
// Isolated route — no imports from or to /org or SmartOrgBuilder.
// TODO: Gate virtual office by plan/features in a future PR.

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageGuard from "@/components/ui/PageGuard";
import { PageHero } from "@/components/ui/workspaceUi";
import { WS_PAGE } from "@/components/ui/workspaceVisual";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useEmployees, useTasks } from "@/hooks/useData";
import VirtualOfficePreview from "@/components/org/VirtualOfficePreview";
import VirtualOfficeErrorBoundary from "@/components/org/VirtualOfficeErrorBoundary";

// ─── Content (uses hooks — kept in its own component so errors are catchable) ─

function VirtualOfficeContent({ onBack }: { onBack: () => void }) {
  const { data: snapshot, loading, error, refresh } = useOrgStructure(true);
  const { data: employees } = useEmployees();
  const { data: tasks } = useTasks();

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
      <div className="rounded-2xl border border-red-500/30 p-6 text-red-400 text-sm space-y-3 bg-red-500/5">
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
    <VirtualOfficePreview
      snapshot={snapshot}
      employees={employees ?? []}
      tasks={tasks ?? []}
      onBack={onBack}
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
          <PageHero
            title="المكتب الافتراضي"
            subtitle="محاكاة بصرية ذكية مبنية من الهيكل الإداري لكل منشأة."
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-[#22d3ee]/30 bg-[#22d3ee]/10 text-[#22d3ee]">
              <Sparkles size={12} />
              معاينة
            </span>
            <Link
              href="/org"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] border border-white/[0.1] bg-white/[0.04] text-[#8ba3c7] hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <ArrowRight size={12} />
              العودة إلى الهيكل الإداري
            </Link>
          </PageHero>

          <VirtualOfficeErrorBoundary onBack={handleBack}>
            <VirtualOfficeContent onBack={handleBack} />
          </VirtualOfficeErrorBoundary>
        </div>
      </DashboardLayout>
    </PageGuard>
  );
}
