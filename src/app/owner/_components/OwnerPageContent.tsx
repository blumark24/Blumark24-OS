"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchOwnerDashboardData,
  fetchOwnerKpiAggregates,
  type OwnerDashboardData,
  type OwnerKpiAggregates,
} from "../_lib/ownerQueries";
import HeroCard from "./HeroCard";
import KpiCards from "./KpiCards";
import OrganizationsSection from "./OrganizationsSection";
import PlansSection from "./PlansSection";
import PlanLimitsPreview from "./PlanLimitsPreview";
import AiUsageCard from "./AiUsageCard";
import WhatsAppCard from "./WhatsAppCard";
import ActivityTimeline from "./ActivityTimeline";
import SystemStatusFooter from "./SystemStatusFooter";

export default function OwnerPageContent() {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [kpiAggregates, setKpiAggregates] = useState<OwnerKpiAggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [next, kpis] = await Promise.all([
        fetchOwnerDashboardData(),
        fetchOwnerKpiAggregates(),
      ]);
      setData(next);
      setKpiAggregates(kpis);
    } catch {
      setError("فشل تحميل البيانات من قاعدة البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 lg:space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          مركز قيادة <span className="gradient-text-teal">Blumark24</span>
        </h1>
        <p className="text-[13px] sm:text-sm text-[#8ba3c7] leading-relaxed max-w-3xl">
          لوحة خاصة بمالك المنصة لإدارة العملاء والباقات والاشتراكات والاستخدام من مكان واحد.
        </p>
      </header>

      <HeroCard />

      <KpiCards activeOrgCount={data?.activeOrgCount} kpiAggregates={kpiAggregates} loading={loading} />

      <OrganizationsSection
        organizations={data?.organizations}
        loading={loading}
        error={error}
        onRefresh={load}
      />

      <PlansSection plans={data?.plans} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <PlanLimitsPreview
            internalOrg={data?.internalOrg}
            internalPlanLimits={data?.internalPlanLimits}
            internalSubscription={data?.internalSubscription}
            loading={loading}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AiUsageCard />
            <WhatsAppCard />
          </div>
        </div>
        <div className="xl:col-span-1">
          <ActivityTimeline />
        </div>
      </div>

      <SystemStatusFooter />
    </div>
  );
}
