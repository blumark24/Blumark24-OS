"use client";

import { useMemo, useState } from "react";
import { Activity, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantWorkspace } from "@/contexts/TenantWorkspaceContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  AGENCY_COMMAND_LABEL,
  getAgencyCommandAccess,
  PLAN_LABELS_AR,
  satisfiesPermission,
} from "@/lib/features/packageFeatures";
import { DASH_SURFACE, DASH_TITLE, DASH_SUBTLE } from "@/components/dashboard/dashboardTokens";
import AgencyCommandModal from "@/components/agency/AgencyCommandModal";
import { useAgencyCommandData } from "@/components/agency/useAgencyCommandData";

function AgencyCommandDashboardCard() {
  const { isInternal, planSlug, isPlatformAdmin, loading: wsLoading } = useTenantWorkspace();
  const { userRole, hasPermission } = usePermissions();

  const accessCtx = useMemo(
    () => ({ isInternal, planSlug, isPlatformAdmin }),
    [isInternal, planSlug, isPlatformAdmin],
  );

  const access = useMemo(
    () =>
      getAgencyCommandAccess(accessCtx, userRole, (perm) =>
        satisfiesPermission(perm, hasPermission),
      ),
    [accessCtx, userRole, hasPermission],
  );

  if (wsLoading || access === "hidden") return null;

  const locked = access === "locked";

  if (locked) {
    return (
      <section
        className={cn(DASH_SURFACE, "relative overflow-hidden p-4 sm:p-5 md:p-6 opacity-95")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(34,211,238,0.08),transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium text-cyan-200">
                <Sparkles size={11} />
                إجراء ذكي
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-200">
                <Lock size={10} />
                باقة {PLAN_LABELS_AR.advanced}
              </span>
            </div>
            <h2 className={cn(DASH_TITLE, "text-base sm:text-lg flex items-center gap-2")}>
              <Activity size={20} className="text-cyan-300 shrink-0" />
              {AGENCY_COMMAND_LABEL}
            </h2>
            <p className={cn("mt-1 text-xs sm:text-sm max-w-xl", DASH_SUBTLE)}>
              متاح في الباقة المتقدمة — لوحة قيادة الوكالة للعملاء والمهام والتنفيذ اليومي.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="shrink-0 cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/50"
          >
            ترقية للباقة المتقدمة
          </button>
        </div>
      </section>
    );
  }

  return <AgencyCommandDashboardCardEnabled />;
}

function AgencyCommandDashboardCardEnabled() {
  const [open, setOpen] = useState(false);
  const { delayedTasks, inExecutionClients, completionRate, isLoading } = useAgencyCommandData();

  return (
    <>
      <section
        className={cn(DASH_SURFACE, "relative overflow-hidden p-4 sm:p-5 md:p-6")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(90%_70%_at_0%_100%,rgba(124,58,237,0.1),transparent_50%)]" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium text-cyan-200">
                <Sparkles size={11} />
                إجراء ذكي
              </span>
            </div>
            <h2 className={cn(DASH_TITLE, "text-base sm:text-lg flex items-center gap-2")}>
              <Activity size={20} className="text-cyan-300 shrink-0" />
              {AGENCY_COMMAND_LABEL}
            </h2>
            <p className={cn("mt-1 text-xs sm:text-sm max-w-xl", DASH_SUBTLE)}>
              متابعة دورة العملاء والمهام والفريق من لوحة واحدة — بدون مغادرة الرئيسية.
            </p>
            {!isLoading && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--dash-text-secondary)]">
                <span className="rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2 py-1">
                  متأخرة: {delayedTasks.length}
                </span>
                <span className="rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2 py-1">
                  قيد التنفيذ: {inExecutionClients}
                </span>
                <span className="rounded-lg border border-[var(--dash-border-glass)] bg-[var(--dash-surface-inset)] px-2 py-1">
                  إنجاز: {completionRate}%
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "shrink-0 touch-manipulation rounded-2xl px-5 py-3 text-sm font-semibold transition",
              "border border-cyan-400/40 bg-gradient-to-br from-cyan-500/20 via-[#3B82F6]/20 to-violet-500/20 text-white",
              "shadow-[0_12px_32px_-12px_rgba(34,211,238,0.5)] hover:border-cyan-300/60 hover:shadow-[0_16px_40px_-12px_rgba(34,211,238,0.55)]",
            )}
          >
            فتح مركز الوكالة
          </button>
        </div>
      </section>

      <AgencyCommandModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default AgencyCommandDashboardCard;
